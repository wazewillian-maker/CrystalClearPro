import React from "react";
import { Image, StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";

import colors from "../theme/colors";

type PoolReferencePhotoProps = {
  size?: "thumbnail" | "banner" | "hero";
  style?: StyleProp<ViewStyle>;
  uri?: string;
};

export function PoolReferencePhoto({
  size = "thumbnail",
  style,
  uri,
}: PoolReferencePhotoProps) {
  return (
    <View style={[styles.frame, styles[size], style]}>
      {uri ? (
        <Image accessibilityLabel="Foto de referencia da piscina" source={{ uri }} style={styles.image} />
      ) : (
        <View style={styles.placeholder}>
          <Text style={styles.placeholderIcon}>◊</Text>
          <Text style={styles.placeholderText}>Sem foto cadastrada</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    height: 150,
    width: "100%",
  },
  frame: {
    backgroundColor: colors.input,
    borderColor: colors.border,
    borderRadius: 12,
    borderCurve: "continuous",
    borderWidth: 1,
    overflow: "hidden",
  },
  hero: {
    height: 220,
    width: "100%",
  },
  image: {
    height: "100%",
    width: "100%",
  },
  placeholder: {
    alignItems: "center",
    flex: 1,
    gap: 6,
    justifyContent: "center",
    padding: 10,
  },
  placeholderIcon: {
    color: colors.primaryLight,
    fontSize: 28,
    fontWeight: "900",
  },
  placeholderText: {
    color: colors.textSecondary,
    fontFamily: "Inter",
    fontSize: 12,
    fontWeight: "900",
    textAlign: "center",
    textTransform: "uppercase",
  },
  thumbnail: {
    height: 72,
    width: 72,
  },
});
