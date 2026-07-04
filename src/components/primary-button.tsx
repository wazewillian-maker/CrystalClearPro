import React from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type GestureResponderEvent,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import colors from "../theme/colors";

type PrimaryButtonProps = {
  title: string;
  onPress: (event: GestureResponderEvent) => void;
  loading?: boolean;
  variant?: "primary" | "success" | "danger" | "secondary" | "warning";
  icon?: string;
  style?: StyleProp<ViewStyle>;
};

const variantColors = {
  danger: colors.danger,
  primary: colors.primary,
  secondary: colors.cardElevated,
  success: colors.success,
  warning: colors.warning,
};

export function PrimaryButton({
  title,
  onPress,
  loading = false,
  variant = "primary",
  icon,
  style,
}: PrimaryButtonProps) {
  return (
    <Pressable
      accessibilityLabel={title}
      accessibilityRole="button"
      disabled={loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: variantColors[variant],
          opacity: pressed ? 0.88 : 1,
          transform: [{ translateY: pressed ? 1 : 0 }],
        },
        loading && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={colors.white} />
      ) : (
        <View style={styles.content}>
          {icon ? <Text style={styles.icon}>{icon}</Text> : null}
          <Text style={styles.text}>{title}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    borderColor: "rgba(255, 255, 255, 0.14)",
    borderRadius: 12,
    borderCurve: "continuous",
    borderWidth: 1,
    boxShadow: "0 14px 28px rgba(0, 0, 0, 0.24)",
    height: 56,
    justifyContent: "center",
    paddingHorizontal: 16,
    width: "100%",
  },
  content: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    justifyContent: "center",
  },
  disabled: {
    opacity: 0.72,
  },
  icon: {
    color: colors.white,
    fontSize: 18,
    fontWeight: "800",
  },
  text: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "900",
  },
});
