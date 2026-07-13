import { StyleSheet, Text, View } from "react-native";

import colors from "../theme/colors";
import { BrandLogo } from "./brand";
import { PrimaryButton } from "./primary-button";

type ScreenHeaderProps = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  backTitle?: string;
  onBack?: () => void;
};

export function ScreenHeader({
  eyebrow,
  title,
  subtitle,
  backTitle = "Voltar",
  onBack,
}: ScreenHeaderProps) {
  return (
    <View style={styles.header}>
      <BrandLogo size="small" />
      <View style={styles.headerText}>
        {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
        <Text selectable style={styles.title}>
          {title}
        </Text>
        {subtitle ? (
          <Text selectable style={styles.subtitle}>
            {subtitle}
          </Text>
        ) : null}
      </View>

      {onBack ? (
        <PrimaryButton
          onPress={onBack}
          style={styles.backButton}
          title={backTitle}
          variant="secondary"
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  backButton: {
    alignSelf: "flex-start",
    height: 44,
    paddingHorizontal: 18,
    width: 132,
  },
  eyebrow: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  header: {
    alignItems: "flex-start",
    gap: 18,
  },
  headerText: {
    gap: 8,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 16,
    lineHeight: 23,
  },
  title: {
    color: colors.white,
    fontSize: 32,
    fontWeight: "900",
    lineHeight: 38,
  },
});
