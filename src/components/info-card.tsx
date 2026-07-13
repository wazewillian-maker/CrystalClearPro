import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type ColorValue,
  type GestureResponderEvent,
} from "react-native";

import colors from "../theme/colors";

type InfoCardProps = {
  label: string;
  value: string;
  helper?: string;
  tone?: ColorValue;
  onPress?: (event: GestureResponderEvent) => void;
};

export function InfoCard({
  label,
  value,
  helper,
  tone = colors.primary,
  onPress,
}: InfoCardProps) {
  const content = (
    <>
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
    </>
  );

  if (onPress) {
    return (
      <Pressable
        accessibilityLabel={label}
        accessibilityRole="button"
        onPress={onPress}
        style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      >
        {content}
      </Pressable>
    );
  }

  return <View style={styles.card}>{content}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.cardElevated,
    borderColor: "rgba(255, 255, 255, 0.14)",
    borderRadius: 14,
    borderCurve: "continuous",
    borderWidth: 1,
    boxShadow: "0 18px 34px rgba(0, 0, 0, 0.24)",
    flex: 1,
    gap: 10,
    minWidth: 148,
    padding: 18,
  },
  cardPressed: {
    opacity: 0.84,
  },
  helper: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  label: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  marker: {
    borderRadius: 999,
    height: 8,
    width: 40,
  },
  value: {
    color: colors.white,
    fontSize: 30,
    fontVariant: ["tabular-nums"],
    fontWeight: "900",
  },
});
