import React, { useMemo } from "react";
import { View, Text, FlatList, RefreshControl, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";

import { useTheme } from "../../context/ThemeContext";
import { useBlockedUsers } from "../../hooks/useBlockedUsers";
import { getInitials } from "../../utils/initials";

import Header from "../../components/Header/Header";
import StatusState from "../../components/common/StatusState";
import Card from "../../components/common/Card";
import Avatar from "../../components/Avatar/Avatar";
import Button from "../../components/Button/Button";

export default function BlockedUsersScreen() {
  const colors = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const navigation = useNavigation();
  const { users, loading, refreshing, error, unblockingId, refresh, unblock } = useBlockedUsers();
  const [actionError, setActionError] = React.useState("");

  const handleUnblock = async (userId) => {
    setActionError("");
    const result = await unblock(userId);
    if (!result.ok) setActionError(result.message);
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Header title="Blocked Users" onBack={() => navigation.goBack()} />

      {actionError ? <Text style={styles.actionError}>{actionError}</Text> : null}

      {loading ? (
        <StatusState loading />
      ) : error ? (
        <StatusState message={error} actionLabel="Retry" onAction={refresh} />
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Card style={styles.row}>
              <Avatar size={44} initials={getInitials(item)} source={item.avatar} />
              <Text style={styles.name} numberOfLines={1}>
                {item.firstName} {item.lastName}
              </Text>
              <Button
                variant="outline"
                size="sm"
                disabled={unblockingId === item.id}
                onPress={() => handleUnblock(item.id)}
              >
                {unblockingId === item.id ? "Unblocking…" : "Unblock"}
              </Button>
            </Card>
          )}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.primary} />}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={
            <StatusState
              message="You haven't blocked anyone. Blocked users can't message you or see your reports."
              tone="neutral"
              style={styles.empty}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  actionError: {
    fontSize: 12,
    fontWeight: "500",
    color: colors.danger,
    textAlign: "center",
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    flexGrow: 1,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
  },
  name: {
    flex: 1,
    minWidth: 0,
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
  },
  separator: {
    height: 10,
  },
  empty: {
    paddingTop: 60,
  },
});
