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
  variant?: "primary" | "success" | "danger";
  icon?: string;
  style?: StyleProp<ViewStyle>;
};

const variantColors = {
  primary: colors.primary,
  success: colors.success,
  danger: colors.danger,
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
        { backgroundColor: variantColors[variant], opacity: pressed ? 0.86 : 1 },
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
    borderRadius: 14,
    borderCurve: "continuous",
    boxShadow: "0 8px 18px rgba(0, 0, 0, 0.18)",
    height: 56,
    justifyContent: "center",
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
    fontSize: 17,
    fontWeight: "800",
  },
});
