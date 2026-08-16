import LostItem from "@/models/LostItem";
import FoundItem from "@/models/FoundItem";
import { escapeRegex } from "@/utils/regex";

const MODEL_BY_TYPE = { lost: LostItem, found: FoundItem };
const DATE_FIELD_BY_TYPE = { lost: "dateLost", found: "dateFound" };

const STOPWORDS = new Set([
  "the", "a", "an", "and", "or", "but", "of", "to", "in", "on", "at", "for",
  "with", "is", "was", "were", "it", "this", "that", "my", "i", "me", "near",
  "found", "lost", "item", "please", "help", "someone", "anyone",
]);

/**
 * Also used by services/matching.service.js's cross-type (lost-vs-found)
 * scorer — kept here since this is where token-set similarity for items
 * was first built out, rather than duplicated in the matcher.
 *
 * @param {string} text
 * @returns {string[]}
 */
export function tokenize(text) {
  return (text || "").toLowerCase().match(/[a-z0-9]+/g) || [];
}

/**
 * Auto-derives `LostItem.keywords`/`FoundItem.keywords` from title +
 * description at creation time — not a user-entered field (see the schema
 * comment on `keywords`), so duplicate detection works without any mobile
 * form changes.
 *
 * @param {object} params
 * @param {string} params.title
 * @param {string} params.description
 * @returns {string[]}
 */
export function deriveKeywords({ title, description }) {
  const tokens = [...tokenize(title), ...tokenize(description)].filter(
    (t) => t.length > 2 && !STOPWORDS.has(t)
  );
  return [...new Set(tokens)].slice(0, 30);
}

/**
 * Also reused by services/matching.service.js — see the note on
 * {@link tokenize}.
 *
 * @param {Set<string>} setA
 * @param {Set<string>} setB
 * @returns {number}
 */
export function jaccard(setA, setB) {
  if (!setA.size || !setB.size) return 0;

  let intersection = 0;
  for (const token of setA) {
    if (setB.has(token)) intersection += 1;
  }

  const union = setA.size + setB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

const SIMILARITY_THRESHOLD = 0.55;
const MAX_MATCHES = 5;
const LOOKBACK_DAYS = 90;
const DATE_PROXIMITY_DAYS = 3;

/**
 * Scores existing open items of the same type/category/city against a
 * candidate new item using weighted token-Jaccard similarity over
 * title/description/keywords, plus small bonuses for matching brand/color
 * and a nearby date — the signals Feature 8 asks for (title, description,
 * category, brand, location, date, color, keywords). Never used to reject
 * anything automatically; callers (items/lost, items/found POST) surface
 * the result as a warning the user can acknowledge and continue past.
 *
 * @param {object} params
 * @param {"lost"|"found"} params.type
 * @param {string} params.title
 * @param {string} params.description
 * @param {string} params.category
 * @param {string} [params.brand]
 * @param {string} [params.color]
 * @param {string[]} params.keywords
 * @param {{city?: string}} [params.location]
 * @param {string} params.date - `dateLost`/`dateFound` as an ISO string.
 * @param {string} params.ownerId - Excluded from candidates — your own other listings aren't "duplicates" of this one.
 * @returns {Promise<Array<{id: string, title: string, image: string|null, location: object, score: number}>>}
 */
export async function findPossibleDuplicates({
  type,
  title,
  description,
  category,
  brand,
  color,
  keywords,
  location,
  date,
  ownerId,
}) {
  const Model = MODEL_BY_TYPE[type];
  const dateField = DATE_FIELD_BY_TYPE[type];

  const since = new Date(Date.now() - LOOKBACK_DAYS * 24 * 60 * 60 * 1000);
  const filter = {
    status: "open",
    category,
    owner: { $ne: ownerId },
    createdAt: { $gte: since },
  };
  if (location?.city) {
    filter["location.city"] = new RegExp(`^${escapeRegex(location.city)}$`, "i");
  }

  const candidates = await Model.find(filter)
    .select(`title description brand color keywords location images ${dateField}`)
    .limit(100)
    .lean();

  const titleTokens = new Set(tokenize(title));
  const descriptionTokens = new Set(tokenize(description));
  const keywordSet = new Set(keywords);
  const candidateDate = date ? new Date(date) : null;

  const scored = candidates.map((candidate) => {
    let score =
      jaccard(titleTokens, new Set(tokenize(candidate.title))) * 0.45 +
      jaccard(descriptionTokens, new Set(tokenize(candidate.description))) * 0.25 +
      jaccard(keywordSet, new Set(candidate.keywords || [])) * 0.2;

    if (brand && candidate.brand && brand.toLowerCase() === candidate.brand.toLowerCase()) {
      score += 0.1;
    }
    if (color && candidate.color && color.toLowerCase() === candidate.color.toLowerCase()) {
      score += 0.05;
    }
    if (candidateDate && candidate[dateField]) {
      const diffDays = Math.abs(candidateDate - new Date(candidate[dateField])) / (1000 * 60 * 60 * 24);
      if (diffDays <= DATE_PROXIMITY_DAYS) score += 0.05;
    }

    return { candidate, score: Math.min(score, 1) };
  });

  return scored
    .filter(({ score }) => score >= SIMILARITY_THRESHOLD)
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_MATCHES)
    .map(({ candidate, score }) => ({
      id: candidate._id,
      title: candidate.title,
      image: candidate.images?.[0] || null,
      location: candidate.location,
      score: Math.round(score * 100) / 100,
    }));
}
