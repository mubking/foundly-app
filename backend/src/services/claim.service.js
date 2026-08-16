import Message from "@/models/Message";
import Claim from "@/models/Claim";
import { notify } from "@/lib/notifications";
import { findOrCreateConversation } from "@/services/message.service";
import { evaluateClaimRejected } from "@/services/spam-detection.service";
import { resolveMatchesForItem } from "@/services/matching.service";

// findOrCreateConversation expects the public "lost"/"found" wording (see
// message.service.js's own ITEM_LOOKUP), while Claim.itemType stores the
// model-name string — same conversion claims/create/route.js's itemType
// param already is in the caller's wording, just done the other way here.
const ITEM_TYPE_TO_KIND = { LostItem: "lost", FoundItem: "found" };

/**
 * Drops a system message into the claimant/owner conversation announcing a
 * review decision — the same conversation claims/create/route.js seeds
 * with the "claim submitted" system message, so the thread reads as one
 * continuous record of the claim's lifecycle. Best-effort: the claim's
 * status change and its notify() are already committed/queued by the time
 * this runs, so a failure here (e.g. a transient DB blip) shouldn't turn
 * an otherwise-successful review into a 500.
 */
async function postClaimReviewSystemMessage({ ownerId, claimantId, itemId, itemType, text }) {
  try {
    const conversation = await findOrCreateConversation({
      participantAId: ownerId,
      participantBId: claimantId,
      itemId,
      itemType: ITEM_TYPE_TO_KIND[itemType],
    });

    const message = await Message.create({
      conversation: conversation._id,
      sender: ownerId,
      text,
      isSystem: true,
    });

    conversation.lastMessage = message._id;
    await conversation.save();
  } catch (err) {
    console.error("Post claim-review system message error:", err);
  }
}

/**
 * Applies an approve/reject decision to a pending claim: updates the
 * claim (and, on approval, the item + sibling claims), triggers the same
 * side effects regardless of who's reviewing (owner via
 * PATCH /api/claims/:id/status, or an admin via
 * POST /api/admin/claims/:id/moderate) — resolving matches, notifying
 * everyone involved, and posting the system-message trail. Callers are
 * responsible for their own permission check and for verifying
 * `claim.status === "pending"` before calling this.
 *
 * @param {object} params
 * @param {import("mongoose").Document} params.claim
 * @param {{owner: string, title: string}} params.item - Lean item doc (owner + title only needed).
 * @param {import("mongoose").Model} params.ItemModel
 * @param {"approved"|"rejected"} params.status
 * @returns {Promise<void>}
 */
export async function applyClaimReview({ claim, item, ItemModel, status }) {
  if (status === "approved") {
    claim.status = "approved";

    const siblingFilter = { item: claim.item, itemType: claim.itemType, _id: { $ne: claim._id }, status: "pending" };

    // Four independent operations — none depends on another's result —
    // so they run concurrently instead of as sequential round trips.
    const [, , , siblingClaims] = await Promise.all([
      claim.save(),
      ItemModel.findByIdAndUpdate(claim.item, { status: "claimed" }, { runValidators: true }),
      Claim.updateMany(siblingFilter, { status: "rejected" }),
      Claim.find(siblingFilter).select("claimant").lean(),
    ]);

    // Fire-and-forget — the item is claimed now, so any pending/viewed
    // match involving it is moot. Never allowed to fail or delay a
    // successful review.
    resolveMatchesForItem({ itemId: claim.item, itemType: claim.itemType });

    await notify({
      recipient: claim.claimant,
      title: "Claim approved",
      message: `Your claim for "${item.title}" was approved.`,
      type: "claim_approved",
      targetType: claim.itemType,
      targetId: claim.item,
    });

    await postClaimReviewSystemMessage({
      ownerId: item.owner.toString(),
      claimantId: claim.claimant.toString(),
      itemId: claim.item.toString(),
      itemType: claim.itemType,
      text: `Your claim for "${item.title}" was approved.`,
    });

    // Auto-rejected as a side effect of the approval above — same
    // notification a directly-rejected claimant gets below, since from
    // their point of view it's the same event: their claim was rejected.
    await Promise.all(
      siblingClaims.map((sibling) =>
        Promise.all([
          notify({
            recipient: sibling.claimant,
            title: "Claim not approved",
            message: `Your claim for "${item.title}" was not approved.`,
            type: "claim_rejected",
            targetType: claim.itemType,
            targetId: claim.item,
          }),
          postClaimReviewSystemMessage({
            ownerId: item.owner.toString(),
            claimantId: sibling.claimant.toString(),
            itemId: claim.item.toString(),
            itemType: claim.itemType,
            text: `Your claim for "${item.title}" was not approved.`,
          }),
        ])
      )
    );

    // Fire-and-forget — never allowed to fail or delay a successful review.
    siblingClaims.forEach((sibling) => evaluateClaimRejected(sibling.claimant.toString()));

    return;
  }

  claim.status = "rejected";
  await claim.save();

  await notify({
    recipient: claim.claimant,
    title: "Claim not approved",
    message: `Your claim for "${item.title}" was not approved.`,
    type: "claim_rejected",
    targetType: claim.itemType,
    targetId: claim.item,
  });

  await postClaimReviewSystemMessage({
    ownerId: item.owner.toString(),
    claimantId: claim.claimant.toString(),
    itemId: claim.item.toString(),
    itemType: claim.itemType,
    text: `Your claim for "${item.title}" was not approved.`,
  });

  evaluateClaimRejected(claim.claimant.toString());
}
