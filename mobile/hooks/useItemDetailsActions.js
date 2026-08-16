import { useState } from "react";
import { Share, Alert, Clipboard } from "react-native";

import { useItemActions } from "./useItemActions";

// A claim only makes sense while the item is still unresolved — once
// someone's claim is accepted ("claimed") or the item is returned/closed
// ("closed"), submitting a new claim would just 404/409 against a listing
// that's already spoken for.
const CLAIMABLE_STATUSES = ["open", "matched"];

/**
 * All non-fetch behavior for Item Details: the image viewer / 3-dot menu /
 * report sheet's open state, and the share / copy-link / report / delete
 * action pipelines built on top of {@link useItemActions}. Kept separate
 * from `useItemDetails` (which only owns fetching the item itself) and from
 * the screen component so the JSX stays focused on layout.
 *
 * @param {object} item - The loaded item, from `useItemDetails`.
 * @returns {object} Everything ItemDetailsScreen wires into its child components.
 */
export function useItemDetailsActions(item) {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [viewerVisible, setViewerVisible] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [reportSheetVisible, setReportSheetVisible] = useState(false);

  const { deleting, handleDelete, reporting, handleReport } = useItemActions();

  // No web app or registered deep-link scheme exists yet (app.json has no
  // "scheme"), so this is a placeholder rather than a real universal link —
  // swap it out once one exists instead of inventing a working link today.
  const shareUrl = `https://foundly.app/items/${item.id}`;

  const isClaimable = CLAIMABLE_STATUSES.includes(item.status);
  const claimLabel =
    item.status === "claimed" ? "Already Claimed" : item.status === "closed" ? "No Longer Available" : "Claim This Item";

  const handleImagePress = (index) => {
    setActiveImageIndex(index);
    setViewerVisible(true);
  };

  const handleSharePress = async () => {
    try {
      await Share.share(
        {
          title: item.title,
          message: `${item.title} — ${item.category} · ${item.location}\n${shareUrl}`,
          url: shareUrl,
        },
        { dialogTitle: "Share this listing" }
      );
      // Share.share() resolves the same way on a completed share and on a
      // user cancel/dismiss — there's nothing to branch on here either way.
    } catch (err) {
      Alert.alert("Couldn't share", err.message || "Something went wrong. Please try again.");
    }
  };

  const handleCopyLink = () => {
    setMenuVisible(false);
    // react-native's Clipboard is deprecated (logs a warning) but still
    // functional; expo-clipboard would replace it, not installed here per
    // "no new dependencies unless required".
    Clipboard.setString(shareUrl);
    Alert.alert("Link copied", "Paste it anywhere to share this listing.");
  };

  const openReportSheet = () => {
    setMenuVisible(false);
    setReportSheetVisible(true);
  };

  const handleSelectReportReason = async (reason) => {
    const result = await handleReport({ targetType: item.type, targetId: item.id, reason });
    if (result.ok) {
      setReportSheetVisible(false);
      Alert.alert("Report submitted", "Thanks — our team will take a look.");
    } else {
      Alert.alert("Couldn't submit report", result.message);
    }
  };

  /** @param {() => void} onDeleted - Called after a successful delete (the screen decides what "leave" means). */
  const handleDeletePress = (onDeleted) => {
    setMenuVisible(false);
    Alert.alert("Delete this listing?", "This can't be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          const result = await handleDelete(item.id);
          if (result.ok) onDeleted();
          else Alert.alert("Couldn't delete", result.message);
        },
      },
    ]);
  };

  return {
    activeImageIndex,
    setActiveImageIndex,
    viewerVisible,
    setViewerVisible,
    menuVisible,
    setMenuVisible,
    reportSheetVisible,
    setReportSheetVisible,
    deleting,
    reporting,
    isClaimable,
    claimLabel,
    handleImagePress,
    handleSharePress,
    handleCopyLink,
    openReportSheet,
    handleSelectReportReason,
    handleDeletePress,
  };
}
