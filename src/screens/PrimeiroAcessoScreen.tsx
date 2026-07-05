import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";

import { AppCard } from "../components/app-card";
import { AppTextInput } from "../components/app-text-input";
import { BrandFooter } from "../components/brand";
import { PrimaryButton } from "../components/primary-button";
import { ScreenHeader } from "../components/screen-header";
import { firstAccessService } from "../services/first-access-service";
import colors from "../theme/colors";

type PrimeiroAcessoScreenProps = {
  onBack: () => void;
  onConfigured: () => void;
};

export function PrimeiroAcessoScreen({ onBack, onConfigured }: PrimeiroAcessoScreenProps) {
  const [companyName, setCompanyName] = React.useState("");
  const [ownerName, setOwnerName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  function validate() {
    if (!companyName.trim()) {
      return "Informe o nome da empresa.";
    }

    if (!ownerName.trim()) {
      return "Informe o nome do dono.";
    }

    if (!email.trim()) {
      return "Informe o e-mail.";
    }

    if (!phone.trim()) {
      return "Informe o telefone.";
    }

    if (password.length < 6) {
      return "A senha precisa ter pelo menos 6 caracteres.";
    }

    if (password !== confirmPassword) {
      return "As senhas nÃ£o conferem.";
    }

    return "";
  }

  async function handleSave() {
    const validationMessage = validate();

    if (validationMessage) {
      setMessage(validationMessage);
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      await firstAccessService.createFirstOwner({
        companyName,
        email,
        ownerName,
        password,
        phone,
      });
      onConfigured();
    } catch (error) {
      setMessage(getFirstAccessErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.content} contentInsetAdjustmentBehavior="automatic">
        <ScreenHeader
          eyebrow="Primeiro acesso"
          onBack={onBack}
          subtitle="Configure a primeira empresa e o primeiro usuÃ¡rio Dono do Crystal Clear Pro."
          title="Primeiro Acesso"
        />

        <AppCard style={styles.card}>
          <Text style={styles.sectionTitle}>Dados da empresa</Text>
          <AppTextInput
            icon="â—†"
            label="Nome da empresa"
            onChangeText={setCompanyName}
            placeholder="Crystal Clear Piscinas"
            value={companyName}
          />

          <Text style={styles.sectionTitle}>Dados do dono</Text>
          <View style={styles.grid}>
            <AppTextInput
              icon="ðŸ‘¤"
              label="Nome do dono"
              onChangeText={setOwnerName}
              placeholder="Willian"
              style={styles.input}
              value={ownerName}
            />
            <AppTextInput
              autoCapitalize="none"
              icon="@"
              keyboardType="email-address"
              label="E-mail"
              onChangeText={setEmail}
              placeholder="willian@empresa.com"
              style={styles.input}
              value={email}
            />
            <AppTextInput
              icon="â˜Ž"
              label="Telefone"
              onChangeText={setPhone}
              placeholder="(11) 99999-0000"
              style={styles.input}
              value={phone}
            />
          </View>

          <Text style={styles.sectionTitle}>Senha de acesso</Text>
          <View style={styles.grid}>
            <AppTextInput
              icon="ðŸ”"
              label="Senha"
              onChangeText={setPassword}
              secureTextEntry
              style={styles.input}
              value={password}
            />
            <AppTextInput
              icon="ðŸ”"
              label="Confirmar senha"
              onChangeText={setConfirmPassword}
              secureTextEntry
              style={styles.input}
              value={confirmPassword}
            />
          </View>

          {message ? (
            <Text selectable style={styles.message}>
              {message}
            </Text>
          ) : null}

          <View style={styles.actions}>
            <PrimaryButton loading={saving} onPress={handleSave} title="Criar primeiro acesso" />
            <PrimaryButton onPress={onBack} title="Voltar" variant="secondary" />
          </View>
        </AppCard>

        <BrandFooter />
      </ScrollView>
    </View>
  );
}

function getFirstAccessErrorMessage(error: unknown) {
  const code =
    typeof error === "object" && error !== null && "code" in error
      ? (error as { code?: unknown }).code
      : "";
  const message = error instanceof Error ? error.message : "";

  const messages: Record<string, string> = {
    "auth/email-already-in-use": "E-mail já cadastrado.",
    "permission-denied": message || "Permissão negada no Firestore.",
    timeout: message || "Tempo esgotado ao criar o primeiro acesso. Verifique sua conexão e tente novamente.",
    EMAIL_EXISTS: "E-mail já cadastrado.",
    INVALID_EMAIL: "Informe um e-mail válido.",
    OPERATION_NOT_ALLOWED: "Login por e-mail e senha não está habilitado no Firebase Authentication.",
    WEAK_PASSWORD: "A senha precisa ter pelo menos 6 caracteres.",
  };

  if (typeof code === "string" && messages[code]) {
    return messages[code];
  }

  if (messages[message]) {
    return messages[message];
  }

  return message || "Não foi possível configurar o primeiro acesso.";
}
const styles = StyleSheet.create({
  actions: {
    gap: 10,
  },
  card: {
    gap: 16,
  },
  content: {
    gap: 24,
    padding: 20,
    paddingTop: 28,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  input: {
    minWidth: 240,
  },
  message: {
    backgroundColor: "rgba(239, 68, 68, 0.12)",
    borderColor: "rgba(239, 68, 68, 0.36)",
    borderCurve: "continuous",
    borderRadius: 14,
    borderWidth: 1,
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: "800",
    lineHeight: 20,
    padding: 12,
  },
  root: {
    backgroundColor: colors.background,
    flex: 1,
  },
  sectionTitle: {
    color: colors.white,
    fontFamily: "Poppins",
    fontSize: 18,
    fontWeight: "900",
  },
});
