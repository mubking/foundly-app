import React from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";

import colors from "../../constants/colors";
import { MY_LOST_ITEMS, STATUS_CONFIG, SUMMARY_STATS } from "../../constants/myLostMockData";

import Header from "../../components/Header/Header";
import Button from "../../components/Button/Button";
import PlusIcon from "../../components/common/PlusIcon";
import Card from "../../components/common/Card";
import StatusItemRow from "../../components/common/StatusItemRow";

export default function MyLostScreen() {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Header
        title="My Lost Items"
        onBack={() => navigation.goBack()}
        right={
          <Button
            variant="primary"
            size="xs"
            icon={<PlusIcon size={14} color="#fff" />}
            onPress={() => navigation.navigate("ReportLost")}
          >
            New
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
          {MY_LOST_ITEMS.map((item, index) => {
            const config = STATUS_CONFIG[item.status];
            return (
              <StatusItemRow
                key={index}
                image={item.image}
                title={item.title}
                statusLabel={config.label}
                statusVariant={config.variant}
                reward={item.reward}
                location={item.location}
                timeLabel={`${item.daysAgo}d ago`}
                onPress={() => navigation.navigate("ItemDetails")}
              />
            );
          })}
        </View>

        <Button
          fullWidth
          icon={<PlusIcon size={18} color="#fff" />}
          onPress={() => navigation.navigate("ReportLost")}
          style={styles.newButton}
        >
          Report New Lost Item
        </Button>

        <View style={styles.tipCard}>
          <Text style={styles.tipTitle}>💡 Pro tip</Text>
          <Text style={styles.tipBody}>
            Items with photos get <Text style={styles.tipEmphasis}>3× more</Text> responses. Items with rewards get{" "}
            <Text style={styles.tipEmphasis}>5× more</Text>.
          </Text>
        </View>
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
  tipCard: {
    marginTop: 24,
    padding: 16,
    borderRadius: 16,
    backgroundColor: colors.surface,
  },
  tipTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textLight,
    marginBottom: 4,
  },
  tipBody: {
    fontSize: 12,
    lineHeight: 18,
    color: colors.subtle,
  },
  tipEmphasis: {
    fontWeight: "700",
    color: colors.text,
  },
});
