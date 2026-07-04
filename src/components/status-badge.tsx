import React from "react";
import { StyleSheet, Text, View } from "react-native";

import colors from "../theme/colors";

export type StatusTone =
  | "pending"
  | "paid"
  | "approved"
  | "rejected"
  | "delivered"
  | "completed"
  | "info";

type StatusBadgeProps = {
  label: string;
  tone?: StatusTone;
};

export function StatusBadge({ label, tone = "info" }: StatusBadgeProps) {
  return (
    <View style={[styles.badge, toneStyles[tone]]}>
      <Text style={styles.text}>{label}</Text>
    </View>
  );
}

const toneStyles = {
  approved: {
    backgroundColor: "rgba(34, 197, 94, 0.2)",
    borderColor: "rgba(34, 197, 94, 0.52)",
  },
  completed: {
    backgroundColor: "rgba(34, 197, 94, 0.2)",
    borderColor: "rgba(34, 197, 94, 0.52)",
  },
  delivered: {
    backgroundColor: "rgba(30, 139, 255, 0.22)",
    borderColor: "rgba(30, 139, 255, 0.56)",
  },
  info: {
    backgroundColor: "rgba(30, 139, 255, 0.18)",
    borderColor: "rgba(30, 139, 255, 0.44)",
  },
  paid: {
    backgroundColor: "rgba(34, 197, 94, 0.2)",
    borderColor: "rgba(34, 197, 94, 0.52)",
  },
  pending: {
    backgroundColor: "rgba(245, 158, 11, 0.2)",
    borderColor: "rgba(245, 158, 11, 0.52)",
  },
  rejected: {
    backgroundColor: "rgba(239, 68, 68, 0.2)",
    borderColor: "rgba(239, 68, 68, 0.52)",
  },
};

const styles = StyleSheet.create({
  badge: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 11,
    paddingVertical: 7,
  },
  text: {
    color: colors.white,
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
  },
});
