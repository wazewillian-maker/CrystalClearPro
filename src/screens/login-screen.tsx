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
  onFirebaseLogin: (email: string, senha: string) => Promise<void>;
  onLogin: (role: TestUserRole) => void;
  onPasswordReset: (email: string) => Promise<void>;
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

export function LoginScreen({ onFirebaseLogin, onLogin, onPasswordReset }: LoginScreenProps) {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [feedbackMessage, setFeedbackMessage] = React.useState<string | null>(null);
  const [feedbackTone, setFeedbackTone] = React.useState<"error" | "success">("error");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isResettingPassword, setIsResettingPassword] = React.useState(false);
  const [selectedRole, setSelectedRole] = React.useState<TestUserRole>("owner");

  async function handleFirebaseLogin() {
    setFeedbackMessage(null);
    setIsSubmitting(true);

    try {
      await onFirebaseLogin(email.trim(), password);
    } catch (error) {
      setFeedbackTone("error");
      setFeedbackMessage(error instanceof Error ? error.message : "Nao foi possivel entrar.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handlePasswordReset() {
    setFeedbackMessage(null);

    if (!email.trim()) {
      setFeedbackTone("error");
      setFeedbackMessage("Informe o e-mail para receber o link de redefinicao de senha.");
      return;
    }

    setIsResettingPassword(true);

    try {
      await onPasswordReset(email.trim());
      setFeedbackTone("success");
      setFeedbackMessage("Enviamos um e-mail para redefinir sua senha.");
    } catch (error) {
      setFeedbackTone("error");
      setFeedbackMessage(error instanceof Error ? error.message : "Nao foi possivel enviar o reset de senha.");
    } finally {
      setIsResettingPassword(false);
    }
  }

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
              autoComplete="email"
              keyboardType="email-address"
              label="E-mail"
              onChangeText={setEmail}
              placeholder="tecnico@crystalclear.com"
              value={email}
            />

            <AppTextInput
              autoComplete="password"
              label="Senha"
              onChangeText={setPassword}
              placeholder="********"
              secureTextEntry
              value={password}
            />
          </View>

          {feedbackMessage ? (
            <Text
              selectable
              style={[styles.feedback, feedbackTone === "success" ? styles.feedbackSuccess : styles.feedbackError]}
            >
              {feedbackMessage}
            </Text>
          ) : null}

          <PrimaryButton
            icon=">"
            loading={isSubmitting}
            title="Entrar"
            onPress={handleFirebaseLogin}
          />

          <PrimaryButton
            icon="?"
            loading={isResettingPassword}
            onPress={handlePasswordReset}
            title="Esqueci minha senha"
            variant="secondary"
          />

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
            icon="~"
            onPress={() => onLogin(selectedRole)}
            title="Modo Teste"
            variant="secondary"
          />

          <Text selectable style={styles.demoHint}>
            Use o Modo Teste enquanto o login real esta sendo validado.
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
  feedback: {
    borderCurve: "continuous",
    borderRadius: 14,
    borderWidth: 1,
    fontSize: 14,
    fontWeight: "800",
    lineHeight: 20,
    padding: 12,
  },
  feedbackError: {
    backgroundColor: "rgba(239, 68, 68, 0.12)",
    borderColor: "rgba(239, 68, 68, 0.36)",
    color: colors.textSecondary,
  },
  feedbackSuccess: {
    backgroundColor: "rgba(34, 197, 94, 0.12)",
    borderColor: "rgba(34, 197, 94, 0.38)",
    color: colors.textSecondary,
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
