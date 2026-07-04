import React from "react";
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";

import colors from "../theme/colors";

type AppCardProps = {
  accessibilityLabel?: string;
  children: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  tone?: "default" | "success" | "warning" | "danger";
};

export function AppCard({
  accessibilityLabel,
  children,
  onPress,
  style,
  tone = "default",
}: AppCardProps) {
  const cardStyle = [styles.card, toneStyles[tone], style];

  if (onPress) {
    return (
      <Pressable
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="button"
        onPress={onPress}
        style={({ pressed }) => [cardStyle, pressed && styles.cardPressed]}
      >
        {children}
      </Pressable>
    );
  }

  return <View style={cardStyle}>{children}</View>;
}

const toneStyles = {
  danger: {
    backgroundColor: "rgba(239, 68, 68, 0.16)",
    borderColor: "rgba(239, 68, 68, 0.42)",
  },
  default: {},
  success: {
    backgroundColor: "rgba(34, 197, 94, 0.16)",
    borderColor: "rgba(34, 197, 94, 0.42)",
  },
  warning: {
    backgroundColor: "rgba(245, 158, 11, 0.16)",
    borderColor: "rgba(245, 158, 11, 0.42)",
  },
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.cardElevated,
    borderColor: colors.border,
    borderRadius: 12,
    borderCurve: "continuous",
    borderWidth: 1,
    boxShadow: "0 18px 36px rgba(0, 0, 0, 0.26)",
    gap: 14,
    padding: 16,
  },
  cardPressed: {
    opacity: 0.88,
    transform: [{ translateY: 1 }],
  },
});
