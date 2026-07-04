import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";

import { BrandLogo } from "../components/brand";
import colors from "../theme/colors";

type SplashScreenProps = {
  onFinish: () => void;
};

export function SplashScreen({ onFinish }: SplashScreenProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.96)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        duration: 650,
        toValue: 1,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        duration: 650,
        toValue: 1,
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(onFinish, 1350);

    return () => clearTimeout(timer);
  }, [onFinish, opacity, scale]);

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <Animated.View style={[styles.content, { opacity, transform: [{ scale }] }]}>
        <BrandLogo align="center" showText={false} size="large" />
        <View style={styles.textBlock}>
          <Text style={styles.title}>Crystal Clear Pro</Text>
          <Text style={styles.subtitle}>Gestao Inteligente para Piscinas</Text>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    alignItems: "center",
    gap: 22,
  },
  root: {
    alignItems: "center",
    backgroundColor: colors.background,
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 17,
    fontWeight: "700",
    textAlign: "center",
  },
  textBlock: {
    alignItems: "center",
    gap: 8,
  },
  title: {
    color: colors.white,
    fontFamily: "Poppins",
    fontSize: 34,
    fontWeight: "900",
    letterSpacing: 3,
    textAlign: "center",
    textTransform: "uppercase",
  },
});
