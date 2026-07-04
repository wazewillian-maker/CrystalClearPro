import React, { useState } from "react";
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
import type { Client, ClientFormData } from "../types/client";

type EditClientScreenProps = {
  client: Client;
  onBack: () => void;
  onSave: (client: ClientFormData) => void;
};

export function EditClientScreen({ client, onBack, onSave }: EditClientScreenProps) {
  const [name, setName] = useState(client.name);
  const [neighborhood, setNeighborhood] = useState(client.neighborhood);
  const [address, setAddress] = useState(client.address);
  const [phone, setPhone] = useState(client.phone);
  const [poolType, setPoolType] = useState(client.poolType ?? "");
  const [liters, setLiters] = useState(
    typeof client.liters === "number" && Number.isFinite(client.liters)
      ? String(client.liters)
      : "",
  );
  const [notes, setNotes] = useState(client.notes);
  const [monthlyValue, setMonthlyValue] = useState(
    typeof client.valorMensal === "number" && Number.isFinite(client.valorMensal)
      ? String(client.valorMensal)
      : "",
  );
  const [dueDay, setDueDay] = useState(
    typeof client.diaVencimento === "number" && Number.isFinite(client.diaVencimento)
      ? String(client.diaVencimento)
      : "",
  );
  const [error, setError] = useState("");

  function handleSave() {
    if (!name.trim()) {
      setError("Nome e obrigatorio.");
      return;
    }

    const parsedMonthlyValue = Number(monthlyValue.replace(",", "."));
    if (!Number.isFinite(parsedMonthlyValue) || parsedMonthlyValue < 0) {
      setError("Valor mensal deve ser numero.");
      return;
    }

    const parsedDueDay = Number(dueDay);
    if (!Number.isInteger(parsedDueDay) || parsedDueDay < 1 || parsedDueDay > 31) {
      setError("Dia de vencimento deve estar entre 1 e 31.");
      return;
    }

    const parsedLiters = liters.trim() ? Number(liters.replace(",", ".")) : undefined;
    if (parsedLiters !== undefined && (!Number.isFinite(parsedLiters) || parsedLiters < 0)) {
      setError("Litros deve ser numero.");
      return;
    }

    setError("");
    onSave({
      ...client,
      name: name.trim(),
      neighborhood: neighborhood.trim(),
      address: address.trim(),
      phone: phone.trim(),
      poolType: poolType.trim(),
      liters: parsedLiters,
      notes: notes.trim(),
      valorMensal: parsedMonthlyValue,
      diaVencimento: parsedDueDay,
    });
  }

  return (
    <KeyboardAvoidingView behavior="padding" style={styles.root}>
      <StatusBar style="light" />
      <ScrollView
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.eyebrow}>Clientes</Text>
            <Text style={styles.title}>Editar cliente</Text>
            <Text selectable style={styles.subtitle}>
              Atualize os dados cadastrais, da piscina e da cobrança mensal.
            </Text>
          </View>

          <PrimaryButton
            onPress={onBack}
            style={styles.backButton}
            title="Voltar"
            variant="danger"
          />
        </View>

        <View style={styles.card}>
          <FormField label="Nome" onChangeText={setName} placeholder="Nome" value={name} />
          <FormField
            keyboardType="phone-pad"
            label="Telefone"
            onChangeText={setPhone}
            placeholder="Telefone"
            value={phone}
          />
          <FormField
            label="Bairro"
            onChangeText={setNeighborhood}
            placeholder="Bairro"
            value={neighborhood}
          />
          <FormField
            label="Endereco"
            onChangeText={setAddress}
            placeholder="Endereco"
            value={address}
          />
          <FormField
            label="Tipo da piscina"
            onChangeText={setPoolType}
            placeholder="Fibra, vinil ou alvenaria"
            value={poolType}
          />
          <FormField
            keyboardType="decimal-pad"
            label="Litros"
            onChangeText={setLiters}
            placeholder="30000"
            value={liters}
          />
          <FormField
            keyboardType="decimal-pad"
            label="Valor mensal da limpeza"
            onChangeText={setMonthlyValue}
            placeholder="350,00"
            value={monthlyValue}
          />
          <FormField
            keyboardType="number-pad"
            label="Dia de vencimento"
            onChangeText={setDueDay}
            placeholder="10"
            value={dueDay}
          />

          <View style={styles.field}>
            <Text style={styles.label}>Observacoes</Text>
            <TextInput
              multiline
              onChangeText={setNotes}
              placeholder="Observacoes"
              placeholderTextColor={colors.muted}
              style={[styles.input, styles.textArea]}
              textAlignVertical="top"
              value={notes}
            />
          </View>
        </View>

        {error ? (
          <Text selectable style={styles.error}>
            {error}
          </Text>
        ) : null}

        <PrimaryButton onPress={handleSave} title="Salvar alterações" variant="success" />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

type FormFieldProps = {
  label: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  value: string;
  keyboardType?: "default" | "phone-pad" | "decimal-pad" | "number-pad";
};

function FormField({
  label,
  onChangeText,
  placeholder,
  value,
  keyboardType = "default",
}: FormFieldProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        keyboardType={keyboardType}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        style={styles.input}
        value={value}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  backButton: {
    alignSelf: "flex-start",
    height: 44,
    paddingHorizontal: 18,
    width: 118,
  },
  card: {
    backgroundColor: colors.card,
    borderColor: "rgba(255, 255, 255, 0.12)",
    borderRadius: 8,
    borderWidth: 1,
    gap: 16,
    padding: 18,
  },
  content: {
    gap: 18,
    padding: 20,
    paddingTop: 28,
  },
  error: {
    backgroundColor: "rgba(231, 76, 60, 0.18)",
    borderColor: "rgba(231, 76, 60, 0.44)",
    borderRadius: 8,
    borderWidth: 1,
    color: colors.white,
    fontSize: 14,
    fontWeight: "800",
    lineHeight: 20,
    padding: 14,
  },
  eyebrow: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  field: {
    gap: 8,
  },
  header: {
    alignItems: "flex-start",
    gap: 18,
  },
  headerText: {
    gap: 8,
  },
  input: {
    backgroundColor: colors.input,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    color: colors.white,
    fontSize: 16,
    minHeight: 52,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  label: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "800",
  },
  root: {
    backgroundColor: colors.background,
    flex: 1,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 16,
    lineHeight: 23,
  },
  textArea: {
    minHeight: 112,
  },
  title: {
    color: colors.white,
    fontSize: 31,
    fontWeight: "900",
    lineHeight: 37,
  },
});
