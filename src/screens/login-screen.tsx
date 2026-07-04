import React from "react";
import {
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";

import { PrimaryButton } from "../components/primary-button";
import colors from "../theme/colors";

type LoginScreenProps = {
  onLogin: () => void;
};

export function LoginScreen({ onLogin }: LoginScreenProps) {
  return (
    <KeyboardAvoidingView behavior="padding" style={styles.root}>
      <StatusBar style="light" />
      <ScrollView
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.brand}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>CC</Text>
          </View>
          <Text style={styles.title}>Crystal Clear Pro</Text>
          <Text style={styles.subtitle}>
            Gestao de manutencao de piscinas com rotina clara, alertas e agenda do dia.
          </Text>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Entrar</Text>
            <Text style={styles.cardSubtitle}>Use dados ficticios para visualizar a demo.</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.field}>
              <Text style={styles.label}>E-mail</Text>
              <TextInput
                autoCapitalize="none"
                keyboardType="email-address"
                placeholder="tecnico@crystalclear.com"
                placeholderTextColor={colors.muted}
                style={styles.input}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Senha</Text>
              <TextInput
                placeholder="********"
                placeholderTextColor={colors.muted}
                secureTextEntry
                style={styles.input}
              />
            </View>
          </View>

          <PrimaryButton icon=">" title="Acessar painel" onPress={onLogin} />

          <Text selectable style={styles.demoHint}>
            Demo local, sem autenticacao real e sem Firebase.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  brand: {
    alignItems: "center",
    gap: 12,
    paddingTop: 22,
  },
  card: {
    backgroundColor: colors.card,
    borderColor: "rgba(255, 255, 255, 0.14)",
    borderRadius: 8,
    borderWidth: 1,
    boxShadow: "0 12px 26px rgba(0, 0, 0, 0.2)",
    gap: 20,
    padding: 20,
    width: "100%",
  },
  cardHeader: {
    gap: 6,
  },
  cardSubtitle: {
    color: colors.textSecondary,
    fontSize: 15,
    lineHeight: 21,
  },
  cardTitle: {
    color: colors.white,
    fontSize: 24,
    fontWeight: "900",
  },
  content: {
    flexGrow: 1,
    gap: 34,
    justifyContent: "center",
    padding: 24,
  },
  demoHint: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    textAlign: "center",
  },
  field: {
    gap: 8,
  },
  form: {
    gap: 14,
  },
  input: {
    backgroundColor: colors.input,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    color: colors.white,
    fontSize: 16,
    height: 52,
    paddingHorizontal: 14,
  },
  label: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "800",
  },
  logo: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderColor: "rgba(255, 255, 255, 0.28)",
    borderRadius: 24,
    borderWidth: 1,
    height: 78,
    justifyContent: "center",
    width: 78,
  },
  logoText: {
    color: colors.white,
    fontSize: 27,
    fontWeight: "900",
  },
  root: {
    backgroundColor: colors.background,
    flex: 1,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 16,
    lineHeight: 23,
    maxWidth: 360,
    textAlign: "center",
  },
  title: {
    color: colors.white,
    fontSize: 34,
    fontWeight: "900",
    textAlign: "center",
  },
});
