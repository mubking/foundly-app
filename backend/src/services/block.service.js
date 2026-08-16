import UserBlock from "@/models/UserBlock";

/**
 * Whether either user has blocked the other — the check messaging needs
 * ("cannot send messages," "cannot start new conversations," existing
 * chats read-only), since a block is meant to stop contact regardless of
 * who initiates it, even though the underlying relationship is one-way.
 *
 * @param {string} userAId
 * @param {string} userBId
 * @returns {Promise<boolean>}
 */
export async function isBlockedEitherDirection(userAId, userBId) {
  const block = await UserBlock.findOne({
    $or: [
      { blocker: userAId, blocked: userBId },
      { blocker: userBId, blocked: userAId },
    ],
  })
    .select("_id")
    .lean();

  return Boolean(block);
}

/**
 * The full list of user ids `blockerId` has blocked — one direction only,
 * for "hidden from search" (from the blocker's point of view).
 *
 * @param {string} blockerId
 * @returns {Promise<string[]>}
 */
export async function getBlockedUserIds(blockerId) {
  return UserBlock.find({ blocker: blockerId }).distinct("blocked");
}
