import React, { useEffect, useState } from "react";
import { KeyboardAvoidingView, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { StatusBar } from "expo-status-bar";

import { PoolReferencePhoto } from "../components/pool-reference-photo";
import { PrimaryButton } from "../components/primary-button";
import colors from "../theme/colors";
import { weekDayLabels, type Client, type WeekDay } from "../types/client";
import {
  frequenciaSemanalLabels,
  planoAtendimentoLabels,
  type FrequenciaSemanal,
  type Piscina,
  type PiscinaFormData,
  type PlanoAtendimento,
} from "../types/piscina";

const planOptions: PlanoAtendimento[] = ["mensal", "quinzenal", "semanal", "todo_dia", "avulso"];
const frequencyOptions: FrequenciaSemanal[] = [1, 2, 3, 4, 5, 6, 7];
const weekDayOptions: WeekDay[] = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

type NewPoolScreenProps = {
  canViewContactData?: boolean;
  clients: Client[];
  errorMessage?: string;
  editingPool?: Piscina;
  initialClientId?: string;
  loadingClients?: boolean;
  onBack: () => void;
  onSave: (pool: PiscinaFormData) => Promise<void> | void;
};

export function NewPoolScreen({
  canViewContactData = true,
  clients,
  errorMessage,
  editingPool,
  initialClientId,
  loadingClients = false,
  onBack,
  onSave,
}: NewPoolScreenProps) {
  const [clienteId, setClienteId] = useState(editingPool?.clienteId ?? initialClientId ?? clients[0]?.id ?? "");
  const [name, setName] = useState(editingPool?.nome ?? "Piscina principal");
  const [poolType, setPoolType] = useState(editingPool?.tipo ?? "");
  const [liters, setLiters] = useState(
    typeof editingPool?.litros === "number" && Number.isFinite(editingPool.litros) ? String(editingPool.litros) : "",
  );
  const [referencePhotoUri, setReferencePhotoUri] = useState(editingPool?.fotoReferenciaUrl ?? "");
  const [plan, setPlan] = useState<PlanoAtendimento>(editingPool?.planoAtendimento ?? "mensal");
  const [monthlyValue, setMonthlyValue] = useState(
    typeof editingPool?.valorMensal === "number" && Number.isFinite(editingPool.valorMensal)
      ? String(editingPool.valorMensal)
      : "",
  );
  const [dueDay, setDueDay] = useState(
    typeof editingPool?.diaVencimento === "number" && Number.isFinite(editingPool.diaVencimento)
      ? String(editingPool.diaVencimento)
      : "",
  );
  const [serviceMonthDay, setServiceMonthDay] = useState(
    typeof (editingPool?.diaMensal ?? editingPool?.diaMesAtendimento) === "number" &&
      Number.isFinite(editingPool?.diaMensal ?? editingPool?.diaMesAtendimento)
      ? String(editingPool?.diaMensal ?? editingPool?.diaMesAtendimento)
      : "",
  );
  const [singleServiceDate, setSingleServiceDate] = useState(editingPool?.dataAvulsa ?? editingPool?.dataAtendimentoAvulso ?? "");
  const [weeklyFrequency, setWeeklyFrequency] = useState<FrequenciaSemanal>(editingPool?.frequenciaSemanal ?? 1);
  const [serviceWeekDays, setServiceWeekDays] = useState<WeekDay[]>(editingPool?.diasAtendimento ?? []);
  const [observations, setObservations] = useState(editingPool?.observacoes ?? "");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editingPool?.clienteId && clients.some((client) => client.id === editingPool.clienteId)) {
      setClienteId(editingPool.clienteId);
      return;
    }

    if (initialClientId && clients.some((client) => client.id === initialClientId)) {
      setClienteId(initialClientId);
      return;
    }

    if (!clienteId && clients[0]?.id) {
      setClienteId(clients[0].id);
    }
  }, [clienteId, clients, editingPool?.clienteId, initialClientId]);

  function toggleWeekDay(day: WeekDay) {
    setError("");
    setServiceWeekDays((currentDays) =>
      currentDays.includes(day)
        ? currentDays.filter((currentDay) => currentDay !== day)
        : currentDays.length < weeklyFrequency
          ? [...currentDays, day]
          : currentDays,
    );
  }

  function handlePlanChange(nextPlan: PlanoAtendimento) {
    setPlan(nextPlan);
    setError("");

    if (nextPlan === "todo_dia") {
      setWeeklyFrequency(7);
      setServiceWeekDays(weekDayOptions);
    }
  }

  function handleFrequencyChange(nextFrequency: FrequenciaSemanal) {
    setWeeklyFrequency(nextFrequency);
    setError("");
    setServiceWeekDays((currentDays) => currentDays.slice(0, nextFrequency));
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

    if (!pickerResult.canceled) {
      setReferencePhotoUri(pickerResult.assets[0]?.uri ?? "");
    }
  }

  async function handleSave() {
    if (clients.length === 0) {
      setError("Cadastre um cliente na Administração antes de adicionar uma piscina.");
      return;
    }

    if (!clienteId) {
      setError("Selecione o cliente vinculado.");
      return;
    }

    if (!name.trim()) {
      setError("Informe o nome da piscina.");
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

    const needsWeekDays = plan === "semanal" || plan === "quinzenal" || plan === "todo_dia";
    if (needsWeekDays && serviceWeekDays.length === 0) {
      setError("Selecione pelo menos um dia de atendimento.");
      return;
    }
    if (needsWeekDays && serviceWeekDays.length > weeklyFrequency) {
      setError(`Selecione no maximo ${weeklyFrequency} dia${weeklyFrequency > 1 ? "s" : ""} de atendimento.`);
      return;
    }

    const parsedServiceMonthDay = serviceMonthDay.trim() ? Number(serviceMonthDay) : undefined;
    const validServiceMonthDay =
      typeof parsedServiceMonthDay === "number" &&
      Number.isInteger(parsedServiceMonthDay) &&
      parsedServiceMonthDay >= 1 &&
      parsedServiceMonthDay <= 31;
    if (plan === "mensal" && !validServiceMonthDay) {
      setError("Informe um dia do mes para o atendimento entre 1 e 31.");
      return;
    }

    if (plan === "avulso" && !singleServiceDate.trim()) {
      setError("Informe a data do atendimento avulso.");
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
        clienteId,
        diaVencimento: parsedDueDay,
        fotoReferenciaUrl: referencePhotoUri,
        litros: parsedLiters,
        nome: name.trim(),
        observacoes: observations.trim(),
        planoAtendimento: plan,
        dataAvulsa: plan === "avulso" ? singleServiceDate.trim() : "",
        diaMensal: plan === "mensal" ? parsedServiceMonthDay : undefined,
        frequenciaSemanal: needsWeekDays ? weeklyFrequency : undefined,
        diasAtendimento: needsWeekDays ? serviceWeekDays : [],
        tipo: poolType.trim(),
        valorMensal: parsedMonthlyValue,
      });
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Nao foi possivel salvar a piscina.");
    } finally {
      setSaving(false);
    }
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
            <Text style={styles.eyebrow}>Piscinas</Text>
            <Text style={styles.title}>{editingPool ? "Editar piscina" : "Adicionar piscina"}</Text>
            <Text selectable style={styles.subtitle}>
              {editingPool ? "Atualize os dados e a agenda desta piscina." : "Vincule uma nova piscina a um cliente existente."}
            </Text>
          </View>

          <PrimaryButton onPress={onBack} style={styles.backButton} title="Voltar" variant="danger" />
        </View>

        <View style={styles.card}>
          <Text style={styles.groupTitle}>Cliente vinculado</Text>
          {loadingClients ? (
            <Text selectable style={styles.emptyText}>
              Carregando clientes reais do Firestore...
            </Text>
          ) : errorMessage ? (
            <Text selectable style={styles.emptyText}>
              {errorMessage}
            </Text>
          ) : clients.length === 0 ? (
            <Text selectable style={styles.emptyText}>
              Cadastre um cliente na Administração antes de adicionar uma piscina.
            </Text>
          ) : (
            <View style={styles.optionGrid}>
              {clients.map((client) => (
                <Pressable
                  accessibilityLabel={`Selecionar ${client.name}`}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: clienteId === client.id }}
                  key={client.id}
                onPress={() => {
                  setClienteId(client.id);
                  setError("");
                }}
                disabled={Boolean(editingPool)}
                  style={({ pressed }) => [
                  styles.option,
                  clienteId === client.id && styles.optionSelected,
                  editingPool && styles.optionDisabled,
                  pressed && styles.optionPressed,
                  ]}
                >
                  <PoolReferencePhoto uri={client.referencePhotoUri} />
                  <View style={styles.optionTextGroup}>
                    <Text selectable style={styles.optionTitle}>
                      {client.name}
                    </Text>
                    <Text selectable style={styles.optionSubtitle}>
                      {client.neighborhood || "Bairro nao informado"} - {client.address || "Endereco nao informado"}
                    </Text>
                    {canViewContactData ? (
                      <Text selectable style={styles.optionSubtitle}>
                        {client.phone || "Telefone nao informado"} {client.email ? `- ${client.email}` : ""}
                      </Text>
                    ) : null}
                  </View>
                </Pressable>
              ))}
            </View>
          )}
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
          <FormField label="Nome da piscina" onChangeText={setName} placeholder="Piscina principal" value={name} />
          <FormField
            label="Tipo da piscina"
            onChangeText={setPoolType}
            placeholder="Fibra, vinil ou alvenaria"
            value={poolType}
          />
          <FormField keyboardType="decimal-pad" label="Litros" onChangeText={setLiters} placeholder="30000" value={liters} />
          <FormField
            keyboardType="decimal-pad"
            label="Valor mensal"
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
              onChangeText={setObservations}
              placeholder="Cuidados tecnicos, acesso ou detalhes da estrutura"
              placeholderTextColor={colors.muted}
              style={[styles.input, styles.textArea]}
              textAlignVertical="top"
              value={observations}
            />
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.groupTitle}>Plano de atendimento</Text>
          <View style={styles.optionGrid}>
            {planOptions.map((option) => (
              <Pressable
                accessibilityLabel={`Plano ${planoAtendimentoLabels[option]}`}
                accessibilityRole="radio"
                accessibilityState={{ checked: plan === option }}
                key={option}
                onPress={() => handlePlanChange(option)}
                style={({ pressed }) => [
                  styles.planOption,
                  plan === option && styles.optionSelected,
                  pressed && styles.optionPressed,
                ]}
              >
                <Text style={styles.optionTitle}>{planoAtendimentoLabels[option]}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {(plan === "semanal" || plan === "quinzenal" || plan === "todo_dia") ? (
          <View style={styles.card}>
            <Text style={styles.groupTitle}>Frequência</Text>
            <View style={styles.optionGrid}>
              {frequencyOptions.map((option) => (
                <Pressable
                  accessibilityLabel={frequenciaSemanalLabels[option]}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: weeklyFrequency === option }}
                  disabled={plan === "todo_dia"}
                  key={option}
                  onPress={() => handleFrequencyChange(option)}
                  style={({ pressed }) => [
                    styles.planOption,
                    weeklyFrequency === option && styles.optionSelected,
                    plan === "todo_dia" && styles.optionDisabled,
                    pressed && styles.optionPressed,
                  ]}
                >
                  <Text style={styles.optionTitle}>{frequenciaSemanalLabels[option]}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}

        {(plan === "semanal" || plan === "quinzenal" || plan === "todo_dia") ? (
          <View style={styles.card}>
            <Text style={styles.groupTitle}>Dias da semana</Text>
            <Text selectable style={styles.helperText}>
              {plan === "todo_dia"
                ? "Todos os dias foram selecionados automaticamente."
                : `Selecione ate ${weeklyFrequency} dia${weeklyFrequency > 1 ? "s" : ""}.`}
            </Text>
            <View style={styles.optionGrid}>
              {weekDayOptions.map((day) => (
                <Pressable
                  accessibilityLabel={weekDayLabels[day]}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: serviceWeekDays.includes(day) }}
                  disabled={plan === "todo_dia"}
                  key={day}
                  onPress={() => toggleWeekDay(day)}
                  style={({ pressed }) => [
                    styles.planOption,
                    serviceWeekDays.includes(day) && styles.optionSelected,
                    plan === "todo_dia" && styles.optionDisabled,
                    pressed && styles.optionPressed,
                  ]}
                >
                  <Text style={styles.optionTitle}>{weekDayLabels[day]}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}

        {plan === "mensal" ? (
          <View style={styles.card}>
            <FormField
              keyboardType="number-pad"
              label="Dia do mês para atendimento"
              onChangeText={setServiceMonthDay}
              placeholder="5, 15 ou 30"
              value={serviceMonthDay}
            />
          </View>
        ) : null}

        {plan === "avulso" ? (
          <View style={styles.card}>
            <FormField
              label="Data do atendimento avulso"
              onChangeText={setSingleServiceDate}
              placeholder="15/07/2026"
              value={singleServiceDate}
            />
          </View>
        ) : null}

        {error ? (
          <Text selectable style={styles.error}>
            {error}
          </Text>
        ) : null}

        <PrimaryButton
          disabled={clients.length === 0 || loadingClients}
          icon="+"
          loading={saving}
          onPress={handleSave}
          title={editingPool ? "Salvar alterações" : "Salvar piscina"}
          variant="success"
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

type FormFieldProps = {
  label: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  value: string;
  keyboardType?: "default" | "decimal-pad" | "number-pad";
};

function FormField({ label, onChangeText, placeholder, value, keyboardType = "default" }: FormFieldProps) {
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
  emptyText: {
    color: colors.textSecondary,
    fontSize: 15,
    fontWeight: "800",
    lineHeight: 22,
  },
  field: {
    gap: 8,
  },
  groupTitle: {
    color: colors.white,
    fontSize: 18,
    fontWeight: "900",
  },
  header: {
    alignItems: "flex-start",
    gap: 18,
  },
  headerText: {
    gap: 8,
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
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    padding: 12,
  },
  optionGrid: {
    gap: 10,
  },
  optionPressed: {
    opacity: 0.86,
  },
  optionDisabled: {
    opacity: 0.72,
  },
  optionSelected: {
    backgroundColor: "rgba(45, 125, 255, 0.18)",
    borderColor: colors.primaryLight,
  },
  optionSubtitle: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  optionTextGroup: {
    flex: 1,
    gap: 4,
  },
  optionTitle: {
    color: colors.white,
    fontSize: 15,
    fontWeight: "900",
  },
  photoButton: {
    height: 50,
  },
  planOption: {
    backgroundColor: colors.input,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 48,
    paddingHorizontal: 14,
    paddingVertical: 12,
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
