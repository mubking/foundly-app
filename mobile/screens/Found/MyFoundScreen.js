import React from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";

import colors from "../../constants/colors";
import { MY_FOUND_ITEMS, SUMMARY_STATS } from "../../constants/myFoundMockData";

import Header from "../../components/Header/Header";
import Button from "../../components/Button/Button";
import PlusIcon from "../../components/common/PlusIcon";
import UploadIcon from "../../components/common/UploadIcon";
import Card from "../../components/common/Card";
import StatusItemRow from "../../components/common/StatusItemRow";

export default function MyFoundScreen() {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Header
        title="My Found Items"
        onBack={() => navigation.goBack()}
        right={
          <Button
            variant="green"
            size="xs"
            icon={<PlusIcon size={14} color="#fff" />}
            onPress={() => navigation.navigate("UploadFound")}
          >
            Add
          </Button>
        }
      />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.summaryRow}>
          {SUMMARY_STATS.map((stat) => (
            <Card key={stat.label} style={styles.summaryCard}>
              <Text style={[styles.summaryValue, { color: colors[stat.colorKey] }]}>{stat.value}</Text>
              <Text style={styles.summaryLabel}>{stat.label}</Text>
            </Card>
          ))}
        </View>

        <View style={styles.list}>
          {MY_FOUND_ITEMS.map((item, index) => {
            const isPending = item.status === "claim_pending";
            return (
              <StatusItemRow
                key={index}
                image={item.image}
                title={item.title}
                statusLabel={isPending ? "Claim Pending" : "Returned ✓"}
                statusVariant={isPending ? "amber" : "green"}
                location={item.location}
                timeLabel={item.foundDays === 0 ? "Today" : `${item.foundDays}d ago`}
                onPress={() => navigation.navigate("ItemDetails")}
              />
            );
          })}
        </View>

        <Button
          variant="green"
          fullWidth
          icon={<UploadIcon size={18} color="#fff" />}
          onPress={() => navigation.navigate("UploadFound")}
          style={styles.newButton}
        >
          Upload New Found Item
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  summaryRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 20,
  },
  summaryCard: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: "900",
  },
  summaryLabel: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: 2,
  },
  list: {
    gap: 10,
  },
  newButton: {
    marginTop: 20,
  },
});
