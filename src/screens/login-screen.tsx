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

        <AppCard style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Entrar</Text>
            <Text style={styles.cardSubtitle}>Use dados ficticios para visualizar a demo.</Text>
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
            title="Acessar painel"
            onPress={() => onLogin(selectedRole)}
          />

          <Text selectable style={styles.demoHint}>
            Demo local, sem autenticacao real e sem Firebase.
          </Text>
        </AppCard>
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
    gap: 20,
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
  form: {
    gap: 14,
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
    borderRadius: 28,
    borderWidth: 1,
    boxShadow: "0 18px 36px rgba(30, 139, 255, 0.28)",
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
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    borderColor: "rgba(255, 255, 255, 0.12)",
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
    padding: 12,
  },
  roleOptionPressed: {
    opacity: 0.84,
  },
  roleOptionSelected: {
    backgroundColor: "rgba(39, 174, 96, 0.24)",
    borderColor: "rgba(39, 174, 96, 0.6)",
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
    fontSize: 34,
    fontWeight: "900",
    textAlign: "center",
  },
});
