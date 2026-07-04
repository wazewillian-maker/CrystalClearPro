import React from "react";
import {
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";

import { AppCard } from "../components/app-card";
import { AppTextInput } from "../components/app-text-input";
import { BrandFooter, BrandLogo } from "../components/brand";
import { PrimaryButton } from "../components/primary-button";
import colors from "../theme/colors";

export type TestUserRole = "owner" | "staff" | "client";

type LoginScreenProps = {
  onLogin: (role: TestUserRole) => void;
};

const roleOptions: Array<{
  description: string;
  label: string;
  value: TestUserRole;
}> = [
  {
    description: "Acesso total ao aplicativo.",
    label: "Dono",
    value: "owner",
  },
  {
    description: "Funcoes operacionais sem Financeiro.",
    label: "Socio/Funcionario",
    value: "staff",
  },
  {
    description: "Area exclusiva para historico e aprovacoes.",
    label: "Cliente (Teste)",
    value: "client",
  },
];

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const [selectedRole, setSelectedRole] = React.useState<TestUserRole>("owner");

  return (
    <KeyboardAvoidingView behavior="padding" style={styles.root}>
      <StatusBar style="light" />
      <View pointerEvents="none" style={styles.backgroundGlowTop} />
      <View pointerEvents="none" style={styles.backgroundGlowBottom} />
      <ScrollView
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.brand}>
          <BrandLogo align="center" showText={false} size="large" />
          <Text style={styles.title}>Crystal Clear Pro</Text>
          <Text style={styles.subtitle}>Gestao Inteligente para Piscinas</Text>
        </View>

        <AppCard style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Entrar</Text>
            <Text style={styles.cardSubtitle}>Acesse o painel operacional em modo de teste.</Text>
          </View>

          <View style={styles.form}>
            <AppTextInput
              autoCapitalize="none"
              keyboardType="email-address"
              label="E-mail"
              placeholder="tecnico@crystalclear.com"
            />

            <AppTextInput label="Senha" placeholder="********" secureTextEntry />
          </View>

          <View style={styles.roleSection}>
            <Text style={styles.label}>Entrar como</Text>
            <View style={styles.roleOptions}>
              {roleOptions.map((option) => {
                const selected = option.value === selectedRole;

                return (
                  <Pressable
                    accessibilityLabel={`Entrar como ${option.label}`}
                    accessibilityRole="button"
                    key={option.value}
                    onPress={() => setSelectedRole(option.value)}
                    style={({ pressed }) => [
                      styles.roleOption,
                      selected && styles.roleOptionSelected,
                      pressed && styles.roleOptionPressed,
                    ]}
                  >
                    <Text style={styles.roleLabel}>{option.label}</Text>
                    <Text selectable style={styles.roleDescription}>
                      {option.description}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <PrimaryButton
            icon=">"
            title="Entrar"
            onPress={() => onLogin(selectedRole)}
          />

          <PrimaryButton
            icon="~"
            onPress={() => onLogin("owner")}
            title="Modo Teste"
            variant="secondary"
          />

          <Text selectable style={styles.demoHint}>
            Demo local, sem autenticacao real e sem Firebase.
          </Text>
        </AppCard>

        <BrandFooter />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  backgroundGlowBottom: {
    backgroundColor: "rgba(21, 101, 255, 0.18)",
    borderRadius: 220,
    bottom: -120,
    height: 280,
    position: "absolute",
    right: -120,
    width: 280,
  },
  backgroundGlowTop: {
    backgroundColor: "rgba(0, 212, 255, 0.16)",
    borderRadius: 260,
    height: 340,
    left: -170,
    position: "absolute",
    top: -150,
    width: 340,
  },
  brand: {
    alignItems: "center",
    gap: 8,
    paddingTop: 10,
  },
  card: {
    backgroundColor: "rgba(13, 43, 77, 0.72)",
    borderColor: colors.border,
    gap: 16,
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
    fontFamily: "Poppins",
    fontSize: 22,
    fontWeight: "900",
  },
  content: {
    flexGrow: 1,
    gap: 28,
    justifyContent: "center",
    padding: 24,
  },
  demoHint: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    textAlign: "center",
  },
  form: {
    gap: 14,
  },
  label: {
    color: colors.white,
    fontFamily: "Inter",
    fontSize: 14,
    fontWeight: "800",
  },
  root: {
    backgroundColor: colors.background,
    flex: 1,
  },
  roleDescription: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  roleLabel: {
    color: colors.white,
    fontSize: 15,
    fontWeight: "900",
  },
  roleOption: {
    backgroundColor: colors.input,
    borderColor: colors.border,
    borderCurve: "continuous",
    borderRadius: 16,
    borderWidth: 1,
    gap: 4,
    padding: 12,
  },
  roleOptionPressed: {
    opacity: 0.84,
  },
  roleOptionSelected: {
    backgroundColor: "rgba(21, 101, 255, 0.28)",
    borderColor: colors.primaryLight,
  },
  roleOptions: {
    gap: 8,
  },
  roleSection: {
    gap: 10,
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
    fontFamily: "Poppins",
    fontSize: 30,
    fontWeight: "900",
    letterSpacing: 3,
    textAlign: "center",
    textTransform: "uppercase",
  },
});
