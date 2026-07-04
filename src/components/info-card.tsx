import React from "react";
import { StyleSheet, Text, View, type ColorValue } from "react-native";

import colors from "../theme/colors";

type InfoCardProps = {
  label: string;
  value: string;
  helper?: string;
  tone?: ColorValue;
};

export function InfoCard({ label, value, helper, tone = colors.primary }: InfoCardProps) {
  return (
    <View style={styles.card}>
      <View style={[styles.marker, { backgroundColor: tone }]} />
      <Text style={styles.label}>{label}</Text>
      <Text selectable style={styles.value}>
        {value}
      </Text>
      {helper ? (
        <Text selectable style={styles.helper}>
          {helper}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderColor: "rgba(255, 255, 255, 0.12)",
    borderRadius: 8,
    borderWidth: 1,
    boxShadow: "0 8px 18px rgba(0, 0, 0, 0.14)",
    flex: 1,
    gap: 8,
    minWidth: 148,
    padding: 16,
  },
  helper: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  label: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  marker: {
    borderRadius: 999,
    height: 8,
    width: 40,
  },
  value: {
    color: colors.white,
    fontSize: 28,
    fontVariant: ["tabular-nums"],
    fontWeight: "900",
  },
});
