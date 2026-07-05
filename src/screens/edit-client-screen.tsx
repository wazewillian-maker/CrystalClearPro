import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { StatusBar } from "expo-status-bar";

import { PoolReferencePhoto } from "../components/pool-reference-photo";
import { PrimaryButton } from "../components/primary-button";
import colors from "../theme/colors";
import { clientPlanLabels, type Client, type ClientFormData, type ClientPlan } from "../types/client";

const planOptions: ClientPlan[] = ["monthly", "biweekly", "weekly", "daily", "one-time"];

type EditClientScreenProps = {
  client: Client;
  onBack: () => void;
  onSave: (client: ClientFormData) => Promise<void> | void;
};

export function EditClientScreen({ client, onBack, onSave }: EditClientScreenProps) {
  const [name, setName] = useState(client.name);
  const [neighborhood, setNeighborhood] = useState(client.neighborhood);
  const [address, setAddress] = useState(client.address);
  const [phone, setPhone] = useState(client.phone);
  const [email, setEmail] = useState(client.email ?? "");
  const [poolName, setPoolName] = useState(client.poolName ?? "Piscina principal");
  const [poolType, setPoolType] = useState(client.poolType ?? "");
  const [liters, setLiters] = useState(
    typeof client.liters === "number" && Number.isFinite(client.liters)
      ? String(client.liters)
      : "",
  );
  const [notes, setNotes] = useState(client.notes);
  const [poolNotes, setPoolNotes] = useState(client.poolNotes ?? "");
  const [referencePhotoUri, setReferencePhotoUri] = useState(client.referencePhotoUri ?? "");
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
  const [plan, setPlan] = useState<ClientPlan>(client.plan);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
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
    setSaving(true);

    try {
      await onSave({
        ...client,
        name: name.trim(),
        neighborhood: neighborhood.trim(),
        address: address.trim(),
        phone: phone.trim(),
        email: email.trim(),
        poolName: poolName.trim(),
        poolType: poolType.trim(),
        referencePhotoUri,
        liters: parsedLiters,
        notes: notes.trim(),
        poolNotes: poolNotes.trim(),
        plan,
        valorMensal: parsedMonthlyValue,
        diaVencimento: parsedDueDay,
      });
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Nao foi possivel salvar as alteracoes.");
    } finally {
      setSaving(false);
    }
  }

  async function pickReferencePhoto() {
    setError("");

    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      setError("Permita o acesso as imagens para adicionar a foto de referencia.");
      return;
    }

    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: false,
      mediaTypes: ["images"],
      quality: 1,
    });

    if (pickerResult.canceled) {
      return;
    }

    const selectedPhotoUri = pickerResult.assets[0]?.uri;

    if (!selectedPhotoUri) {
      setError("Nao foi possivel carregar a imagem selecionada.");
      return;
    }

    setReferencePhotoUri(selectedPhotoUri);
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
          <Text style={styles.groupTitle}>Foto de Referencia da Piscina</Text>
          <Text selectable style={styles.helperText}>
            Essa foto sera usada para identificar esta piscina em todo o aplicativo.
          </Text>
          <PoolReferencePhoto size="banner" uri={referencePhotoUri} />
          <PrimaryButton
            onPress={pickReferencePhoto}
            style={styles.photoButton}
            title={referencePhotoUri ? "Alterar foto" : "Selecionar imagem"}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.groupTitle}>Plano de atendimento</Text>
          <View style={styles.optionGrid}>
            {planOptions.map((option) => (
              <PlanOption
                key={option}
                label={clientPlanLabels[option]}
                onPress={() => setPlan(option)}
                selected={plan === option}
              />
            ))}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.groupTitle}>Dados do cliente</Text>
          <FormField label="Nome" onChangeText={setName} placeholder="Nome" value={name} />
          <FormField
            keyboardType="phone-pad"
            label="Telefone"
            onChangeText={setPhone}
            placeholder="Telefone"
            value={phone}
          />
          <FormField
            autoCapitalize="none"
            keyboardType="email-address"
            label="E-mail"
            onChangeText={setEmail}
            placeholder="cliente@email.com"
            value={email}
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
          <View style={styles.field}>
            <Text style={styles.label}>Observacoes do cliente</Text>
            <TextInput
              multiline
              onChangeText={setNotes}
              placeholder="Observacoes do cliente"
              placeholderTextColor={colors.muted}
              style={[styles.input, styles.textArea]}
              textAlignVertical="top"
              value={notes}
            />
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.groupTitle}>Piscina principal</Text>
          <FormField
            label="Nome da piscina"
            onChangeText={setPoolName}
            placeholder="Piscina principal"
            value={poolName}
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
            <Text style={styles.label}>Observacoes da piscina</Text>
            <TextInput
              multiline
              onChangeText={setPoolNotes}
              placeholder="Observacoes da piscina"
              placeholderTextColor={colors.muted}
              style={[styles.input, styles.textArea]}
              textAlignVertical="top"
              value={poolNotes}
            />
          </View>
        </View>

        {error ? (
          <Text selectable style={styles.error}>
            {error}
          </Text>
        ) : null}

        <PrimaryButton loading={saving} onPress={handleSave} title="Salvar alterações" variant="success" />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

type FormFieldProps = {
  label: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  value: string;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  keyboardType?: "default" | "phone-pad" | "decimal-pad" | "number-pad" | "email-address";
};

function FormField({
  autoCapitalize,
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
        autoCapitalize={autoCapitalize}
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

type PlanOptionProps = {
  label: string;
  onPress: () => void;
  selected: boolean;
};

function PlanOption({ label, onPress, selected }: PlanOptionProps) {
  return (
    <Pressable
      accessibilityLabel={`Plano ${label}`}
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.option,
        selected && styles.optionSelected,
        pressed && styles.optionPressed,
      ]}
    >
      <View style={[styles.radioControl, selected && styles.radioControlSelected]} />
      <Text style={styles.optionText}>{label}</Text>
    </Pressable>
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
  groupTitle: {
    color: colors.white,
    fontSize: 18,
    fontWeight: "900",
  },
  helperText: {
    color: colors.textSecondary,
    fontSize: 15,
    lineHeight: 22,
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
  option: {
    alignItems: "center",
    backgroundColor: colors.input,
    borderColor: colors.border,
    borderCurve: "continuous",
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    minHeight: 48,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  optionGrid: {
    gap: 10,
  },
  optionPressed: {
    opacity: 0.86,
  },
  optionSelected: {
    backgroundColor: "rgba(45, 125, 255, 0.18)",
    borderColor: colors.primaryLight,
  },
  optionText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: "900",
  },
  photoButton: {
    height: 50,
  },
  root: {
    backgroundColor: colors.background,
    flex: 1,
  },
  radioControl: {
    borderColor: colors.muted,
    borderRadius: 999,
    borderWidth: 2,
    height: 18,
    width: 18,
  },
  radioControlSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryLight,
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
