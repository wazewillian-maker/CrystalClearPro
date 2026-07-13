import { Image, StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";

import colors from "../theme/colors";

const brandIcon = require("../../assets/branding/icon.png");
const brandLogo = require("../../assets/branding/logo.png");

type BrandLogoProps = {
  align?: "left" | "center";
  showSubtitle?: boolean;
  showText?: boolean;
  size?: "small" | "medium" | "large";
  style?: StyleProp<ViewStyle>;
};

export function BrandLogo({
  align = "left",
  showSubtitle = false,
  showText = true,
  size = "medium",
  style,
}: BrandLogoProps) {
  const centered = align === "center";
  const compact = size === "small";
  const large = size === "large";

  return (
    <View style={[styles.logoRow, centered && styles.logoCentered, style]}>
      <Image
        accessibilityLabel="Logo Crystal Clear Pro"
        source={large ? brandLogo : brandIcon}
        style={[styles.logoImage, compact && styles.logoImageSmall, large && styles.logoImageLarge]}
      />
      {showText && !large ? (
        <View style={[styles.logoTextBlock, centered && styles.logoTextCentered]}>
          <Text style={[styles.brandName, compact && styles.brandNameSmall]}>Crystal Clear Pro</Text>
          {showSubtitle ? (
            <Text style={styles.brandSubtitle}>Gestao Inteligente para Piscinas</Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

export function BrandFooter() {
  return (
    <View style={styles.footer}>
      <Text style={styles.footerText}>Crystal Clear Pro</Text>
      <Text style={styles.footerVersion}>Versao 1.0 Beta</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  brandName: {
    color: colors.white,
    fontFamily: "Poppins",
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: 4,
    textTransform: "uppercase",
  },
  brandNameSmall: {
    fontSize: 16,
  },
  brandSubtitle: {
    color: colors.textSecondary,
    fontFamily: "Inter",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 1,
  },
  footer: {
    alignItems: "center",
    gap: 3,
    paddingVertical: 4,
  },
  footerText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: "900",
  },
  footerVersion: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "700",
  },
  logoCentered: {
    alignItems: "center",
    flexDirection: "column",
  },
  logoImage: {
    borderRadius: 12,
    height: 56,
    width: 56,
  },
  logoImageLarge: {
    borderRadius: 0,
    height: 150,
    resizeMode: "contain",
    width: 304,
  },
  logoImageSmall: {
    borderRadius: 10,
    height: 34,
    width: 34,
  },
  logoRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
  },
  logoTextBlock: {
    gap: 3,
  },
  logoTextCentered: {
    alignItems: "center",
  },
});
