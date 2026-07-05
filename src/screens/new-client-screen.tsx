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
import {
  clientFrequencyLabels,
  clientPlanLabels,
  weekDayLabels,
  type ClientFormData,
  type ClientFrequency,
  type ClientPlan,
  type WeekDay,
} from "../types/client";

const planOptions: ClientPlan[] = ["monthly", "biweekly", "weekly", "daily", "one-time"];
const frequencyOptions: ClientFrequency[] = ["once", "twice", "three-times", "daily", "custom"];
const weekDayOptions: WeekDay[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

const frequencyDayLimits: Partial<Record<ClientFrequency, number>> = {
  once: 1,
  twice: 2,
  "three-times": 3,
};

type NewClientScreenProps = {
  onBack: () => void;
  onSave: (client: ClientFormData) => Promise<void> | void;
};

export function NewClientScreen({ onBack, onSave }: NewClientScreenProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [address, setAddress] = useState("");
  const [poolType, setPoolType] = useState("");
  const [liters, setLiters] = useState("");
  const [notes, setNotes] = useState("");
  const [referencePhotoUri, setReferencePhotoUri] = useState("");
  const [monthlyValue, setMonthlyValue] = useState("");
  const [dueDay, setDueDay] = useState("");
  const [plan, setPlan] = useState<ClientPlan>("monthly");
  const [frequency, setFrequency] = useState<ClientFrequency>("once");
  const [weekDays, setWeekDays] = useState<WeekDay[]>([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function handleFrequencyChange(nextFrequency: ClientFrequency) {
    setFrequency(nextFrequency);
    setError("");

    if (nextFrequency === "daily") {
      setWeekDays(weekDayOptions);
      return;
    }

    if (nextFrequency === "custom") {
      return;
    }

    const limit = frequencyDayLimits[nextFrequency] ?? weekDayOptions.length;
    setWeekDays((currentDays) => currentDays.slice(0, limit));
  }

  function toggleWeekDay(day: WeekDay) {
    if (frequency === "daily") {
      setWeekDays(weekDayOptions);
      return;
    }

    setError("");
    setWeekDays((currentDays) => {
      if (currentDays.includes(day)) {
        return currentDays.filter((currentDay) => currentDay !== day);
      }

      const limit = frequencyDayLimits[frequency];
      if (limit && currentDays.length >= limit) {
        return currentDays;
      }

      return [...currentDays, day];
    });
  }

  async function handleSave() {
    const requiredFields = [
      name.trim(),
      phone.trim(),
      city.trim(),
      neighborhood.trim(),
      address.trim(),
    ];

    if (requiredFields.some((field) => field.length === 0)) {
      setError("Preencha todos os campos obrigatorios.");
      return;
    }

    if (weekDays.length === 0) {
      setError("Selecione pelo menos um dia da semana.");
      return;
    }

    const limit = frequencyDayLimits[frequency];
    if (limit && weekDays.length !== limit) {
      setError(`Selecione exatamente ${limit} dia${limit > 1 ? "s" : ""} da semana.`);
      return;
    }

    const parsedMonthlyValue = Number(monthlyValue.replace(",", "."));
    if (!Number.isFinite(parsedMonthlyValue) || parsedMonthlyValue < 0) {
      setError("Informe um valor mensal valido.");
      return;
    }

    const parsedDueDay = Number(dueDay);
    if (!Number.isInteger(parsedDueDay) || parsedDueDay < 1 || parsedDueDay > 31) {
      setError("Informe um dia de vencimento entre 1 e 31.");
      return;
    }

    const parsedLiters = liters.trim() ? Number(liters.replace(",", ".")) : undefined;
    if (parsedLiters !== undefined && (!Number.isFinite(parsedLiters) || parsedLiters < 0)) {
      setError("Informe uma quantidade de litros valida.");
      return;
    }

    setError("");
    setSaving(true);

    try {
      await onSave({
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        city: city.trim(),
        neighborhood: neighborhood.trim(),
        address: address.trim(),
        poolType: poolType.trim(),
        referencePhotoUri,
        liters: parsedLiters,
        notes: notes.trim(),
        plan,
        frequency,
        weekDays,
        valorMensal: parsedMonthlyValue,
        diaVencimento: parsedDueDay,
      });
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Nao foi possivel salvar o cliente.");
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
            <Text style={styles.title}>Novo Cliente</Text>
            <Text selectable style={styles.subtitle}>
              Complete a ficha para organizar o atendimento recorrente.
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
          <FormField label="Nome" onChangeText={setName} placeholder="Maria Oliveira" value={name} />
          <FormField
            keyboardType="phone-pad"
            label="Telefone"
            onChangeText={setPhone}
            placeholder="(11) 99999-0000"
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
          <FormField label="Cidade" onChangeText={setCity} placeholder="Sao Paulo" value={city} />
          <FormField
            label="Bairro"
            onChangeText={setNeighborhood}
            placeholder="Jardim Paulista"
            value={neighborhood}
          />
          <FormField
            label="Endereco"
            onChangeText={setAddress}
            placeholder="Rua das Aguas, 120"
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
              placeholder="Preferencias, acesso ao local ou cuidados especiais"
              placeholderTextColor={colors.muted}
              style={[styles.input, styles.textArea]}
              textAlignVertical="top"
              value={notes}
            />
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.groupTitle}>Plano de atendimento</Text>
          <View style={styles.optionGrid}>
            {planOptions.map((option) => (
              <OptionButton
                key={option}
                label={clientPlanLabels[option]}
                onPress={() => setPlan(option)}
                selected={plan === option}
                type="radio"
              />
            ))}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.groupTitle}>Frequencia</Text>
          <View style={styles.optionGrid}>
            {frequencyOptions.map((option) => (
              <OptionButton
                key={option}
                label={clientFrequencyLabels[option]}
                onPress={() => handleFrequencyChange(option)}
                selected={frequency === option}
                type="radio"
              />
            ))}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.groupTitle}>Dias da semana</Text>
          <View style={styles.optionGrid}>
            {weekDayOptions.map((day) => (
              <OptionButton
                key={day}
                label={weekDayLabels[day]}
                onPress={() => toggleWeekDay(day)}
                disabled={frequency === "daily"}
                selected={weekDays.includes(day)}
                type="checkbox"
              />
            ))}
          </View>
        </View>

        {error ? (
          <Text selectable style={styles.error}>
            {error}
          </Text>
        ) : null}

        <PrimaryButton icon="+" loading={saving} onPress={handleSave} title="Salvar Cliente" />
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

type OptionButtonProps = {
  label: string;
  onPress: () => void;
  selected: boolean;
  type: "radio" | "checkbox";
  disabled?: boolean;
};

function OptionButton({ disabled = false, label, onPress, selected, type }: OptionButtonProps) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole={type === "checkbox" ? "checkbox" : "radio"}
      disabled={disabled}
      accessibilityState={{ checked: selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.option,
        selected && styles.optionSelected,
        disabled && styles.optionDisabled,
        pressed && styles.optionPressed,
      ]}
    >
      <View style={[styles.control, type === "radio" && styles.radio, selected && styles.controlSelected]}>
        {selected ? <Text style={styles.controlMark}>{type === "radio" ? "" : "x"}</Text> : null}
      </View>
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
  control: {
    alignItems: "center",
    borderColor: colors.muted,
    borderRadius: 5,
    borderWidth: 2,
    height: 22,
    justifyContent: "center",
    width: 22,
  },
  controlMark: {
    color: colors.white,
    fontSize: 13,
    fontWeight: "900",
    lineHeight: 15,
  },
  controlSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  eyebrow: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "900",
    textTransform: "uppercase",
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
  field: {
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
  option: {
    alignItems: "center",
    backgroundColor: colors.input,
    borderColor: colors.border,
    borderRadius: 8,
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
  optionDisabled: {
    opacity: 0.78,
  },
  optionPressed: {
    opacity: 0.86,
  },
  optionSelected: {
    borderColor: colors.primary,
  },
  optionText: {
    color: colors.white,
    flex: 1,
    fontSize: 15,
    fontWeight: "800",
  },
  photoButton: {
    height: 50,
  },
  radio: {
    borderRadius: 999,
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
