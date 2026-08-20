let activeConversationId = null;

/**
 * The conversation currently open on screen, if any — set by ChatScreen
 * while focused (see screens/Chat/ChatScreen.js), cleared on blur/unmount.
 * Lets components/common/NotificationToastHost.js skip showing a "new
 * message" toast for a conversation the user is already looking at, where
 * the message itself already arrives live via hooks/useMessages.js's own
 * socket subscription — same module-level-singleton shape as
 * services/push.js's currentPushToken.
 */
export function setActiveConversationId(id) {
  activeConversationId = id || null;
}

/** @returns {string | null} */
export function getActiveConversationId() {
  return activeConversationId;
}
