import LostItem from "@/models/LostItem";
import FoundItem from "@/models/FoundItem";
import Match from "@/models/Match";
import { notify } from "@/lib/notifications";
import { tokenize, jaccard } from "./duplicate-detection.service";

// Bounds every candidate scan — never a full collection scan regardless of
// table size. Paired with the {status:1, category:1, createdAt:-1} index
// added to both LostItem and FoundItem, this keeps each trigger to one
// indexed, capped query.
const CANDIDATE_LIMIT = 200;
const CANDIDATE_SELECT = "title description brand color keywords location images owner dateLost dateFound";

// Sums to 100. Category isn't a weighted signal — it's a hard gate (see
// fetchCandidates: only same-category items are ever scored against each
// other), matching the spec's "Category: Required". Reward is intentionally
// absent (spec: "Ignore"). Image similarity is intentionally absent too —
// see the module doc comment at the bottom for how it plugs in later.
const WEIGHTS = {
  title: 25,
  description: 20,
  location: 20,
  keywords: 10,
  brand: 10,
  color: 8,
  date: 7,
};

// >= this → "Very likely" (mobile's High Confidence section) and the
// trigger for Phase 5 notifications. 50-79 → "Possible match". 35-49 →
// "Weak match", still stored but folded into "Possible Matches" in the UI
// (the spec's mobile screen has no separate Weak section). Below 35 is
// discarded entirely — a same-category-only pair is too weak a signal on
// its own to be worth a record.
export const VERY_LIKELY_THRESHOLD = 80;
export const POSSIBLE_THRESHOLD = 50;
export const MIN_SCORE_TO_STORE = 35;

const EARTH_RADIUS_KM = 6371;
const LOCATION_FULL_POINTS_KM = 2;
const LOCATION_ZERO_POINTS_KM = 25;

function toRadians(deg) {
  return (deg * Math.PI) / 180;
}

function haversineKm(a, b) {
  const dLat = toRadians(b.latitude - a.latitude);
  const dLon = toRadians(b.longitude - a.longitude);
  const lat1 = toRadians(a.latitude);
  const lat2 = toRadians(b.latitude);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

// --- Individual signals -----------------------------------------------
// Each returns { points, reason }. `reason` is null when the signal
// contributed nothing, so computeMatchScore can skip it when building the
// user-facing "why this matched" list (Phase 4).

function scoreTitle(lostItem, foundItem) {
  const similarity = jaccard(new Set(tokenize(lostItem.title)), new Set(tokenize(foundItem.title)));
  return { points: similarity * WEIGHTS.title, reason: similarity > 0.3 ? "Similar title" : null };
}

function scoreDescription(lostItem, foundItem) {
  const similarity = jaccard(new Set(tokenize(lostItem.description)), new Set(tokenize(foundItem.description)));
  return { points: similarity * WEIGHTS.description, reason: similarity > 0.2 ? "Similar description" : null };
}

function scoreKeywords(lostItem, foundItem) {
  const similarity = jaccard(new Set(lostItem.keywords || []), new Set(foundItem.keywords || []));
  return { points: similarity * WEIGHTS.keywords, reason: similarity > 0.2 ? "Overlapping keywords" : null };
}

function scoreBrand(lostItem, foundItem) {
  if (lostItem.brand && foundItem.brand && lostItem.brand.toLowerCase() === foundItem.brand.toLowerCase()) {
    return { points: WEIGHTS.brand, reason: "Same brand" };
  }
  return { points: 0, reason: null };
}

function scoreColor(lostItem, foundItem) {
  if (lostItem.color && foundItem.color && lostItem.color.toLowerCase() === foundItem.color.toLowerCase()) {
    return { points: WEIGHTS.color, reason: "Same color" };
  }
  return { points: 0, reason: null };
}

function scoreDate(lostItem, foundItem) {
  if (!lostItem.dateLost || !foundItem.dateFound) return { points: 0, reason: null };

  const diffDays = Math.abs(new Date(foundItem.dateFound) - new Date(lostItem.dateLost)) / (1000 * 60 * 60 * 24);
  let fraction = 0;
  if (diffDays <= 3) fraction = 1;
  else if (diffDays <= 14) fraction = 0.6;
  else if (diffDays <= 30) fraction = 0.3;

  return { points: fraction * WEIGHTS.date, reason: fraction > 0 ? "Reported around the same time" : null };
}

// Prefers precise Haversine distance when both items have coordinates
// (mobile/hooks/useGeoLocation.js supplies these on new reports); falls
// back to a city/state string match for older records or manual entries
// that only have text fields.
function scoreLocation(lostItem, foundItem) {
  const a = lostItem.location;
  const b = foundItem.location;
  if (!a || !b) return { points: 0, reason: null };

  if (
    typeof a.latitude === "number" &&
    typeof a.longitude === "number" &&
    typeof b.latitude === "number" &&
    typeof b.longitude === "number"
  ) {
    const distanceKm = haversineKm(a, b);
    let fraction;
    if (distanceKm <= LOCATION_FULL_POINTS_KM) fraction = 1;
    else if (distanceKm >= LOCATION_ZERO_POINTS_KM) fraction = 0;
    else fraction = (LOCATION_ZERO_POINTS_KM - distanceKm) / (LOCATION_ZERO_POINTS_KM - LOCATION_FULL_POINTS_KM);

    return { points: fraction * WEIGHTS.location, reason: fraction > 0 ? "Same location" : null };
  }

  if (a.city && b.city && a.city.trim().toLowerCase() === b.city.trim().toLowerCase()) {
    return { points: WEIGHTS.location * 0.8, reason: "Same city" };
  }
  if (a.state && b.state && a.state.trim().toLowerCase() === b.state.trim().toLowerCase()) {
    return { points: WEIGHTS.location * 0.4, reason: "Same area" };
  }
  return { points: 0, reason: null };
}

const SIGNALS = [scoreTitle, scoreDescription, scoreLocation, scoreKeywords, scoreBrand, scoreColor, scoreDate];

/**
 * Weighted 0-100 confidence score for one lost/found pair, plus the
 * human-readable reasons behind it (Phase 4). Only ever called on pairs
 * that already share a category — see fetchCandidates — so "Same category"
 * is always true and always included first.
 *
 * @param {object} params
 * @param {object} params.lostItem - LostItem doc or lean object.
 * @param {object} params.foundItem - FoundItem doc or lean object.
 * @returns {{score: number, reasons: string[]}}
 */
export function computeMatchScore({ lostItem, foundItem }) {
  const reasons = ["Same category"];
  let total = 0;

  for (const signal of SIGNALS) {
    const { points, reason } = signal(lostItem, foundItem);
    total += points;
    if (reason) reasons.push(reason);
  }

  return { score: Math.max(0, Math.min(100, Math.round(total))), reasons };
}

async function fetchCandidates(Model, category) {
  return Model.find({ status: "open", category }).select(CANDIDATE_SELECT).sort({ createdAt: -1 }).limit(CANDIDATE_LIMIT).lean();
}

/**
 * Creates or rescoring-updates the one Match document for this exact
 * (lostItem, foundItem) pair — the unique index on Match guarantees this
 * never duplicates, whether it's the first time these two items have been
 * compared or a rescore triggered by an edit. Notifies both owners exactly
 * once: `status === "pending" && !notifiedAt` is true both for a brand new
 * high-confidence match and for an existing pending one whose score just
 * crossed the threshold on a rescore, and false for anything already
 * viewed/dismissed/claimed/resolved or already notified — so this one
 * condition covers both cases without needing to know whether the upsert
 * inserted or updated.
 */
async function upsertMatch({ lostItemDoc, foundItemDoc, score, reasons }) {
  const match = await Match.findOneAndUpdate(
    { lostItem: lostItemDoc._id, foundItem: foundItemDoc._id },
    {
      $set: { score, reasons, lostOwner: lostItemDoc.owner, foundOwner: foundItemDoc.owner },
      $setOnInsert: { status: "pending" },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true }
  );

  const shouldNotify = score >= VERY_LIKELY_THRESHOLD && match.status === "pending" && !match.notifiedAt;
  if (!shouldNotify) return match;

  await Promise.all([
    notify({
      recipient: lostItemDoc.owner,
      title: "Possible match found",
      message: `We found a possible match for your lost ${lostItemDoc.title}.`,
      type: "match",
      targetType: "Match",
      targetId: match._id,
    }),
    notify({
      recipient: foundItemDoc.owner,
      title: "Possible match found",
      message: "Someone reported losing an item similar to the one you found.",
      type: "match",
      targetType: "Match",
      targetId: match._id,
    }),
  ]);

  match.notifiedAt = new Date();
  await match.save();

  return match;
}

/**
 * Call after a lost item is created or edited (Phase 2). Fire-and-forget —
 * same convention as spam-detection.service.js's evaluateItemCreation: an
 * internal try/catch means this never throws or delays the caller's
 * response, so route handlers call it without awaiting.
 *
 * @param {object} lostItem - Needs _id, title, description, category,
 *   brand, color, keywords, location, dateLost, owner.
 */
export async function matchLostItem(lostItem) {
  try {
    const candidates = await fetchCandidates(FoundItem, lostItem.category);

    await Promise.all(
      candidates.map(async (foundItem) => {
        const { score, reasons } = computeMatchScore({ lostItem, foundItem });
        if (score < MIN_SCORE_TO_STORE) return;
        await upsertMatch({ lostItemDoc: lostItem, foundItemDoc: foundItem, score, reasons });
      })
    );
  } catch (err) {
    console.error("Match lost item error:", err);
  }
}

/** Mirror of {@link matchLostItem} for a found item. */
export async function matchFoundItem(foundItem) {
  try {
    const candidates = await fetchCandidates(LostItem, foundItem.category);

    await Promise.all(
      candidates.map(async (lostItem) => {
        const { score, reasons } = computeMatchScore({ lostItem, foundItem });
        if (score < MIN_SCORE_TO_STORE) return;
        await upsertMatch({ lostItemDoc: lostItem, foundItemDoc: foundItem, score, reasons });
      })
    );
  } catch (err) {
    console.error("Match found item error:", err);
  }
}

/**
 * Call after a claim is approved (item status flips to "claimed") — the
 * only place `resolved` is actually reachable from, since neither owner has
 * a direct "mark resolved" action. Leaves dismissed/already-resolved
 * matches alone. Fire-and-forget, same reasoning as matchLostItem.
 *
 * @param {object} params
 * @param {string} params.itemId
 * @param {"LostItem"|"FoundItem"} params.itemType
 */
export async function resolveMatchesForItem({ itemId, itemType }) {
  try {
    const field = itemType === "LostItem" ? "lostItem" : "foundItem";
    await Match.updateMany({ [field]: itemId, status: { $nin: ["dismissed", "resolved"] } }, { $set: { status: "resolved" } });
  } catch (err) {
    console.error("Resolve matches for item error:", err);
  }
}

// --- Future-proofing (Phase 8) -----------------------------------------
// Image similarity is intentionally not implemented. To add it later:
// 1. Add a `scoreImage(lostItem, foundItem)` signal following the same
//    { points, reason } shape as the ones above (e.g. cosine similarity
//    over stored embeddings, or a vision-AI call — backend/src/lib/ai.js
//    already has the OpenAI client-setup pattern to copy).
// 2. Add it to the SIGNALS array and give it a WEIGHTS entry, rebalancing
//    the others so they still sum to 100.
// No other part of this file, Match.js, or any caller needs to change —
// computeMatchScore, upsertMatch, and the two trigger functions are all
// signal-count-agnostic.
