import React, { useState } from "react";
import { View, Text, Image, ScrollView, Pressable, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";

import colors from "../../constants/colors";
import { ITEMS } from "../../constants/homeMockData";
import { FINDER, STATUS_TIMELINE, ITEM_DESCRIPTION } from "../../constants/itemDetailsMockData";

import Pill from "../../components/common/Pill";
import ProgressDots from "../../components/common/ProgressDots";
import HeroIconButton from "../../components/common/HeroIconButton";
import ArrowLeftIcon from "../../components/common/ArrowLeftIcon";
import HeartIcon from "../../components/common/HeartIcon";
import Share2Icon from "../../components/common/Share2Icon";
import MoreVerticalIcon from "../../components/common/MoreVerticalIcon";
import MapPinIcon from "../../components/common/MapPinIcon";
import ClockIcon from "../../components/common/ClockIcon";
import FlagIcon from "../../components/common/FlagIcon";
import PhoneIcon from "../../components/common/PhoneIcon";
import ShieldIcon from "../../components/common/ShieldIcon";
import FinderCard from "../../components/common/FinderCard";
import StatusTimeline from "../../components/common/StatusTimeline";
import Button from "../../components/Button/Button";

const item = ITEMS[0];

export default function ItemDetailsScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [saved, setSaved] = useState(false);

  return (
    <View style={styles.screen}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Image source={item.image} style={StyleSheet.absoluteFill} />

          <LinearGradient
            colors={["rgba(15,23,42,0.75)", "rgba(15,23,42,0.1)", "transparent"]}
            locations={[0, 0.55, 1]}
            start={{ x: 0, y: 1 }}
            end={{ x: 0, y: 0 }}
            style={StyleSheet.absoluteFill}
          />

          <View style={[styles.heroActions, { paddingTop: insets.top + 12 }]}>
            <HeroIconButton onPress={() => navigation.goBack()}>
              <ArrowLeftIcon size={20} color="#fff" />
            </HeroIconButton>

            <View style={styles.heroActionsRight}>
              <HeroIconButton onPress={() => setSaved((v) => !v)}>
                <HeartIcon size={19} color={saved ? "#F87171" : "#fff"} fill={saved ? "#F87171" : "none"} />
              </HeroIconButton>
              <HeroIconButton>
                <Share2Icon size={19} color="#fff" />
              </HeroIconButton>
              <HeroIconButton>
                <MoreVerticalIcon size={19} color="#fff" />
              </HeroIconButton>
            </View>
          </View>

          <View style={styles.heroContent}>
            <View style={styles.pillRow}>
              <Pill label="FOUND" variant="green" dot />
              <Pill label="Verified" variant="primary" />
            </View>
            <Text style={styles.title}>{item.title}</Text>
            <ProgressDots
              count={3}
              activeIndex={0}
              dotHeight={6}
              activeWidth={20}
              inactiveWidth={6}
              gap={6}
              inactiveColor="rgba(255,255,255,0.4)"
              style={styles.galleryDots}
            />
          </View>
        </View>

        <View style={styles.content}>
          <View style={styles.metaRow}>
            <View style={[styles.metaItem, styles.metaItemGrow]}>
              <MapPinIcon size={15} color={colors.danger} />
              <Text style={styles.metaLocation}>{item.location}</Text>
            </View>
            <View style={styles.metaDivider} />
            <View style={styles.metaItem}>
              <ClockIcon size={15} color={colors.subtle} />
              <Text style={styles.metaTime}>{item.time}</Text>
            </View>
          </View>

          <FinderCard finder={FINDER} />

          <StatusTimeline steps={STATUS_TIMELINE} />

          <View>
            <Text style={styles.sectionLabel}>Description</Text>
            <Text style={styles.description}>{ITEM_DESCRIPTION}</Text>
          </View>

          <Pressable style={styles.reportLink}>
            <FlagIcon size={15} color={colors.subtle} />
            <Text style={styles.reportText}>Report this listing as incorrect</Text>
          </Pressable>
        </View>
      </ScrollView>

      <View style={[styles.stickyCta, { paddingBottom: insets.bottom + 16 }]}>
        <Pressable style={styles.callButton} onPress={() => navigation.navigate("Chat")}>
          <PhoneIcon size={19} color={colors.ink2} />
        </Pressable>

        <Button
          size="md"
          fullWidth
          icon={<ShieldIcon size={18} color="#fff" />}
          onPress={() => navigation.navigate("ClaimVerification")}
          style={styles.claimButton}
        >
          Claim This Item
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  hero: {
    height: 320,
    backgroundColor: colors.surface,
  },
  heroActions: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingHorizontal: 20,
  },
  heroActionsRight: {
    flexDirection: "row",
    gap: 8,
  },
  heroContent: {
    position: "absolute",
    left: 20,
    right: 20,
    bottom: 20,
  },
  pillRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: -0.5,
    lineHeight: 26,
  },
  galleryDots: {
    marginTop: 12,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    gap: 20,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: colors.surface,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metaItemGrow: {
    flex: 1,
  },
  metaLocation: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.ink2,
  },
  metaDivider: {
    width: 1,
    height: 16,
    backgroundColor: colors.border,
  },
  metaTime: {
    fontSize: 14,
    color: colors.textLight,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.subtle,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: colors.ink2,
    lineHeight: 24,
  },
  reportLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  reportText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.subtle,
  },
  stickyCta: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: "rgba(255,255,255,0.95)",
  },
  callButton: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  claimButton: {
    flex: 1,
  },
});
