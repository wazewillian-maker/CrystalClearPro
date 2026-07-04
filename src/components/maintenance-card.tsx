import React from "react";
import { StyleSheet, Text, View } from "react-native";

import colors from "../theme/colors";
import type { MaintenanceTask } from "../types/maintenance";

type MaintenanceCardProps = {
  task: MaintenanceTask;
};

const statusColors: Record<MaintenanceTask["status"], string> = {
  scheduled: colors.primary,
  urgent: colors.danger,
  done: colors.success,
};

const statusLabels: Record<MaintenanceTask["status"], string> = {
  scheduled: "Agendada",
  urgent: "Urgente",
  done: "Concluida",
};

export function MaintenanceCard({ task }: MaintenanceCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleGroup}>
          <Text selectable style={styles.poolName}>
            {task.poolName}
          </Text>
          <Text selectable style={styles.address}>
            {task.address}
          </Text>
        </View>
        <View style={[styles.badge, { backgroundColor: statusColors[task.status] }]}>
          <Text style={styles.badgeText}>{statusLabels[task.status]}</Text>
        </View>
      </View>

      <View style={styles.details}>
        <Text selectable style={styles.detail}>
          {task.service}
        </Text>
        <Text selectable style={styles.time}>
          {task.time}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  address: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  badgeText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: "800",
  },
  card: {
    backgroundColor: colors.card,
    borderColor: "rgba(255, 255, 255, 0.12)",
    borderRadius: 8,
    borderWidth: 1,
    gap: 14,
    padding: 16,
  },
  detail: {
    color: colors.white,
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 21,
  },
  details: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
  },
  header: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
  },
  poolName: {
    color: colors.white,
    fontSize: 18,
    fontWeight: "900",
  },
  time: {
    color: colors.muted,
    fontSize: 15,
    fontVariant: ["tabular-nums"],
    fontWeight: "800",
  },
  titleGroup: {
    flex: 1,
    gap: 4,
  },
});
