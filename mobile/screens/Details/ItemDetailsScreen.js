import React, { useState, useMemo } from "react";
import { View, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";

import { useTheme } from "../../context/ThemeContext";
import { ITEM_CATEGORIES } from "../../constants/itemCategories";
import { useAuth } from "../../context/AuthContext";
import { useItemDetails } from "../../hooks/useItemDetails";
import { useItemDetailsActions } from "../../hooks/useItemDetailsActions";

import Header from "../../components/Header/Header";
import StatusState from "../../components/common/StatusState";
import ItemDetailsHero from "../../components/common/ItemDetailsHero";
import ItemImageThumbnails from "../../components/common/ItemImageThumbnails";
import ItemDetailsBody from "../../components/common/ItemDetailsBody";
import ItemDetailsCta from "../../components/common/ItemDetailsCta";
import ImageViewerModal from "../../components/common/ImageViewerModal";
import ItemMenuSheet from "../../components/common/ItemMenuSheet";
import ReportReasonSheet from "../../components/common/ReportReasonSheet";

const HERO_HEIGHT = 320;

export default function ItemDetailsScreen() {
  const colors = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { user, isAuthenticated } = useAuth();
  const [saved, setSaved] = useState(false);

  const { item, status, errorMessage, reload } = useItemDetails(route.params?.id);

  if (status !== "success") {
    return (
      <SafeAreaView style={styles.screen} edges={["top"]}>
        <Header title="Item Details" onBack={() => navigation.goBack()} />
        {status === "loading" ? (
          <StatusState loading />
        ) : status === "empty" ? (
          <StatusState message={errorMessage} actionLabel="Go Back" onAction={() => navigation.goBack()} />
        ) : (
          <StatusState message={errorMessage} actionLabel="Retry" onAction={reload} />
        )}
      </SafeAreaView>
    );
  }

  return (
    <ItemDetailsContent
      item={item}
      navigation={navigation}
      insets={insets}
      user={user}
      isAuthenticated={isAuthenticated}
      saved={saved}
      setSaved={setSaved}
      reload={reload}
      claimant={route.params?.claimant}
    />
  );
}

/**
 * Split out from ItemDetailsScreen so {@link useItemDetailsActions} (which
 * needs the loaded `item`) can be called unconditionally — hooks can't run
 * conditionally after the loading/error early-return above.
 */
function ItemDetailsContent({ item, navigation, insets, user, isAuthenticated, saved, setSaved, reload, claimant }) {
  const colors = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const actions = useItemDetailsActions(item);

  const isOwner = isAuthenticated && item.owner.id === user?.id;
  const categoryMeta = ITEM_CATEGORIES.find((c) => c.label === item.category);
  const posterLabel = item.type === "lost" ? "Reported by" : "Found by";

  // The Message button always targets the *other* participant, never the
  // signed-in user: an owner viewing their own item (e.g. from "Claims on
  // My Items") messages the claimant who filed against it; anyone else
  // messages the item's owner, same as before. When the owner arrives here
  // without claimant context (browsing their own listing directly), there's
  // no one to message, so `otherParty` is null and the button hides below.
  const otherParty = isOwner ? claimant : item.owner;

  const handleClaimPress = () => {
    if (!isAuthenticated) {
      navigation.navigate("Login");
      return;
    }
    navigation.navigate("ClaimVerification", {
      itemId: item.id,
      itemType: item.type,
      itemTitle: item.title,
    });
  };

  // GET /api/items/:id only populates the owner's firstName/lastName (see
  // services/items.js's toItemDetail) — no avatar — so `participant.avatar`
  // is `null` here and the chat thread falls back to initials, same as
  // everywhere else an avatar is missing.
  const handleMessagePress = () => {
    if (!isAuthenticated) {
      navigation.navigate("Login");
      return;
    }
    if (!otherParty) return;

    navigation.navigate("ChatThread", {
      recipientId: otherParty.id,
      participant: { id: otherParty.id, firstName: otherParty.firstName, lastName: otherParty.lastName, avatar: null },
      itemId: item.id,
      itemType: item.type,
      itemTitle: item.title,
      itemImage: item.images[0],
      itemStatus: item.status,
    });
  };

  return (
    <View style={styles.screen}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <ItemDetailsHero
          item={item}
          height={HERO_HEIGHT}
          activeImageIndex={actions.activeImageIndex}
          onIndexChange={actions.setActiveImageIndex}
          onImagePress={actions.handleImagePress}
          saved={saved}
          onToggleSaved={() => setSaved((v) => !v)}
          onSharePress={actions.handleSharePress}
          onMenuPress={() => actions.setMenuVisible(true)}
          onBack={() => navigation.goBack()}
          topInset={insets.top}
          categoryEmoji={categoryMeta?.emoji}
        />

        <ItemImageThumbnails
          images={item.images}
          activeIndex={actions.activeImageIndex}
          onSelect={actions.setActiveImageIndex}
          style={styles.thumbnails}
        />

        <ItemDetailsBody
          item={item}
          posterLabel={posterLabel}
          isOwner={isOwner}
          onMessage={otherParty ? handleMessagePress : undefined}
          onReportPress={actions.openReportSheet}
        />
      </ScrollView>

      {!isOwner ? (
        <ItemDetailsCta
          isClaimable={actions.isClaimable}
          claimLabel={actions.claimLabel}
          onCallPress={handleMessagePress}
          onClaimPress={handleClaimPress}
          bottomInset={insets.bottom}
        />
      ) : null}

      <ImageViewerModal
        visible={actions.viewerVisible}
        images={item.images}
        activeIndex={actions.activeImageIndex}
        onIndexChange={actions.setActiveImageIndex}
        onClose={() => actions.setViewerVisible(false)}
        topInset={insets.top}
      />

      <ItemMenuSheet
        visible={actions.menuVisible}
        onClose={() => actions.setMenuVisible(false)}
        isOwner={isOwner}
        onCopyLink={actions.handleCopyLink}
        onReport={actions.openReportSheet}
        onEdit={() => {
          actions.setMenuVisible(false);
          navigation.navigate("EditListing", { id: item.id, type: item.type, onSaved: reload });
        }}
        onDelete={() => actions.handleDeletePress(() => navigation.goBack())}
        deleting={actions.deleting}
      />

      <ReportReasonSheet
        visible={actions.reportSheetVisible}
        onClose={() => actions.setReportSheetVisible(false)}
        onSelectReason={actions.handleSelectReportReason}
        submitting={actions.reporting}
      />
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  thumbnails: {
    paddingVertical: 16,
  },
});
