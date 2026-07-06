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
  const [imageFailed, setImageFailed] = React.useState(false);
  const safeUri = getSafeImageUri(uri);

  React.useEffect(() => {
    setImageFailed(false);
  }, [safeUri]);

  return (
    <View style={[styles.frame, styles[size], style]}>
      {safeUri && !imageFailed ? (
        <Image
          accessibilityLabel="Foto de referencia da piscina"
          onError={() => setImageFailed(true)}
          source={{ uri: safeUri }}
          style={styles.image}
        />
      ) : (
        <View style={styles.placeholder}>
          <Text style={styles.placeholderIcon}>◊</Text>
          <Text style={styles.placeholderText}>Sem foto cadastrada</Text>
        </View>
      )}
    </View>
  );
}

function getSafeImageUri(uri?: string) {
  if (typeof uri !== "string") {
    return "";
  }

  const trimmedUri = uri.trim();

  if (!trimmedUri || isTemporaryLocalUri(trimmedUri)) {
    return "";
  }

  return trimmedUri;
}

function isTemporaryLocalUri(uri: string) {
  return (
    uri.startsWith("blob:") ||
    uri.startsWith("file:") ||
    uri.startsWith("data:") ||
    uri.startsWith("content:") ||
    uri.startsWith("asset:")
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
