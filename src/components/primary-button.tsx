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
  disabled?: boolean;
  variant?: "primary" | "success" | "danger" | "secondary" | "warning";
  icon?: string;
  style?: StyleProp<ViewStyle>;
};

const variantColors = {
  danger: colors.danger,
  primary: colors.primary,
  secondary: "rgba(10, 27, 46, 0.72)",
  success: colors.success,
  warning: colors.warning,
};

const variantBorders = {
  danger: "rgba(255, 255, 255, 0.18)",
  primary: "rgba(0, 212, 255, 0.42)",
  secondary: "rgba(0, 212, 255, 0.32)",
  success: "rgba(255, 255, 255, 0.18)",
  warning: "rgba(255, 255, 255, 0.18)",
};

export function PrimaryButton({
  title,
  onPress,
  disabled = false,
  loading = false,
  variant = "primary",
  icon,
  style,
}: PrimaryButtonProps) {
  return (
    <Pressable
      accessibilityLabel={title}
      accessibilityRole="button"
      disabled={loading || disabled}
      onPress={onPress}
      style={(state) => {
        const hovered = "hovered" in state && Boolean(state.hovered);

        return [
          styles.button,
          {
            backgroundColor: variantColors[variant],
            borderColor: variantBorders[variant],
          },
          variant === "secondary" && styles.secondaryButton,
          hovered && styles.hovered,
          state.pressed && styles.pressed,
          (loading || disabled) && styles.disabled,
          style,
        ];
      }}
    >
      <View pointerEvents="none" style={styles.glow} />
      <View pointerEvents="none" style={styles.shine} />
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
    borderRadius: 8,
    borderCurve: "continuous",
    borderWidth: 1,
    boxShadow: "0 10px 22px rgba(21, 101, 255, 0.24)",
    height: 48,
    justifyContent: "center",
    overflow: "hidden",
    paddingHorizontal: 20,
    position: "relative",
    width: "100%",
  },
  content: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    justifyContent: "center",
    position: "relative",
    zIndex: 2,
  },
  disabled: {
    opacity: 0.72,
  },
  glow: {
    backgroundColor: "rgba(0, 212, 255, 0.22)",
    borderRadius: 32,
    height: 42,
    position: "absolute",
    right: -18,
    top: -26,
    width: 92,
  },
  hovered: {
    boxShadow: "0 14px 28px rgba(21, 101, 255, 0.34)",
    transform: [{ translateY: -1 }, { scale: 1.01 }],
  },
  icon: {
    color: colors.white,
    fontSize: 18,
    fontWeight: "800",
  },
  pressed: {
    boxShadow: "0 10px 22px rgba(0, 0, 0, 0.28)",
    opacity: 0.9,
    transform: [{ translateY: 1 }, { scale: 0.985 }],
  },
  secondaryButton: {
    boxShadow: "0 12px 24px rgba(0, 0, 0, 0.24)",
  },
  shine: {
    backgroundColor: "rgba(255, 255, 255, 0.13)",
    height: "48%",
    left: 1,
    position: "absolute",
    right: 1,
    top: 1,
  },
  text: {
    color: colors.white,
    fontFamily: "Inter",
    fontSize: 14,
    fontWeight: "900",
  },
});
