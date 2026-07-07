import React, { useEffect, useRef, useState } from "react";
import {
  Image,
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
import type { AttendanceRecord } from "../types/attendance";
import { clientPlanLabels, type Client } from "../types/client";
import type { MissingProductItem } from "../types/product-request";

type ChecklistItem = {
  id: string;
  label: string;
};

const checklistItems: ChecklistItem[] = [
  { id: "vacuumed", label: "Aspiracao" },
  { id: "brushed-edges", label: "Escovacao das bordas" },
  { id: "cleaned-prefilter", label: "Limpeza do pre-filtro" },
  { id: "measured-ph", label: "Medicao de pH" },
  { id: "measured-chlorine", label: "Medicao de cloro" },
  { id: "applied-product", label: "Aplicacao de produto" },
  { id: "washed-filter", label: "Lavagem do filtro" },
];

type AtendimentoScreenProps = {
  canViewCommercialData?: boolean;
  clients?: Client[];
  initialAttendanceDate?: string;
  onBack: () => void;
  onSaveAttendance: (attendance: AttendanceRecord) => Promise<void> | void;
  initialClientId?: string;
  initialClientName?: string;
  initialEmpresaId?: string;
  initialPiscinaId?: string;
  initialPoolName?: string;
  initialVisitId?: string;
  responsibleName?: string;
};

export function AtendimentoScreen({
  canViewCommercialData = true,
  clients = [],
  initialAttendanceDate,
  onBack,
  onSaveAttendance,
  initialClientId,
  initialClientName,
  initialEmpresaId,
  initialPiscinaId,
  initialPoolName,
  initialVisitId,
  responsibleName,
}: AtendimentoScreenProps) {
  const returnHomeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [clientName, setClientName] = useState(initialClientName ?? "Condominio Lago Azul");
  const [attendanceDate, setAttendanceDate] = useState(initialAttendanceDate ?? new Date().toLocaleDateString("pt-BR"));
  const [completedItems, setCompletedItems] = useState<string[]>([]);
  const [productsUsed, setProductsUsed] = useState("Cloro granulado, clarificante");
  const [ph, setPh] = useState("");
  const [chlorine, setChlorine] = useState("");
  const [observations, setObservations] = useState("");
  const [missingProduct, setMissingProduct] = useState("");
  const [missingQuantity, setMissingQuantity] = useState("");
  const [missingObservation, setMissingObservation] = useState("");
  const [missingProducts, setMissingProducts] = useState<MissingProductItem[]>([]);
  const [beforePhotoUri, setBeforePhotoUri] = useState("");
  const [afterPhotoUri, setAfterPhotoUri] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [attendanceRecord, setAttendanceRecord] = useState<AttendanceRecord | null>(null);
  const selectedClient = clients.find((client) => client.id === initialClientId || client.name === clientName);
  const lockedAgendaVisit = Boolean(initialVisitId);

  useEffect(() => {
    return () => {
      if (returnHomeTimerRef.current) {
        clearTimeout(returnHomeTimerRef.current);
      }
    };
  }, []);

  function toggleChecklistItem(itemId: string) {
    setSuccessMessage("");
    setCompletedItems((currentItems) => {
      if (currentItems.includes(itemId)) {
        return currentItems.filter((currentItem) => currentItem !== itemId);
      }

      return [...currentItems, itemId];
    });
  }

  async function pickPhoto(photoType: "before" | "after") {
    setError("");
    setSuccessMessage("");

    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      setError("Permita o acesso as imagens para adicionar a foto do atendimento.");
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

    if (photoType === "before") {
      setBeforePhotoUri(selectedPhotoUri);
      return;
    }

    setAfterPhotoUri(selectedPhotoUri);
  }

  function addMissingProduct() {
    setSuccessMessage("");

    if (!missingProduct.trim() || !missingQuantity.trim()) {
      setError("Preencha o produto/item faltando e a quantidade.");
      return;
    }

    setError("");
    setMissingProducts((currentProducts) => [
      ...currentProducts,
      {
        id: String(Date.now()),
        observation: missingObservation.trim(),
        product: missingProduct.trim(),
        quantity: missingQuantity.trim(),
      },
    ]);
    setMissingProduct("");
    setMissingQuantity("");
    setMissingObservation("");
  }

  function removeMissingProduct(productId: string) {
    setMissingProducts((currentProducts) =>
      currentProducts.filter((product) => product.id !== productId),
    );
  }

  async function finalizeAttendance() {
    setSuccessMessage("");

    if (!clientName.trim() || !attendanceDate.trim()) {
      setError("Preencha o nome do cliente e a data do atendimento.");
      return;
    }

    setError("");
    setSaving(true);

    try {
      const completedLabels = completedItems.map((itemId) => {
        const checklistItem = checklistItems.find((item) => item.id === itemId);
        return checklistItem?.label ?? itemId;
      });

      const finishedAttendance: AttendanceRecord = {
        id: String(Date.now()),
        attendanceDate: attendanceDate.trim(),
        beforePhotoUri,
        chlorine: chlorine.trim(),
        clienteId: initialClientId ?? selectedClient?.id,
        clientName: clientName.trim(),
        completedItems: completedLabels,
        empresaId: initialEmpresaId,
        missingProducts,
        observations: observations.trim(),
        ph: ph.trim(),
        piscinaId: initialPiscinaId ?? selectedClient?.piscinaId,
        poolName: initialPoolName ?? selectedClient?.poolName,
        productsUsed: productsUsed.trim(),
        visitaId: initialVisitId,
        afterPhotoUri,
      };

      await onSaveAttendance(finishedAttendance);
      setAttendanceRecord(finishedAttendance);
      setSuccessMessage(
        missingProducts.length > 0
          ? "Limpeza concluida. Produtos faltando registrados. Voltando para a Home..."
          : "Limpeza concluida. Voltando para a Home...",
      );

      returnHomeTimerRef.current = setTimeout(() => {
        onBack();
      }, 1500);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Nao foi possivel finalizar o atendimento.");
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
            <Text style={styles.eyebrow}>Piscina</Text>
            <Text style={styles.title}>Atendimento da Piscina</Text>
            <Text selectable style={styles.subtitle}>
              Registre a visita, os cuidados realizados e as fotos do atendimento.
            </Text>
          </View>

          <PrimaryButton
            onPress={onBack}
            style={styles.backButton}
            title="Voltar"
            variant="danger"
          />
        </View>

        {successMessage ? (
          <View style={styles.successBox}>
            <Text selectable style={styles.successText}>
              {successMessage}
            </Text>
          </View>
        ) : null}

        {error ? (
          <View style={styles.errorBox}>
            <Text selectable style={styles.errorText}>
              {error}
            </Text>
          </View>
        ) : null}

        <View style={styles.card}>
          <PoolReferencePhoto size="banner" uri={selectedClient?.referencePhotoUri} />
          <Text selectable style={styles.clientReferenceTitle}>
            {clientName || "Piscina em atendimento"}
          </Text>
          <Text selectable style={styles.responsibleText}>
            Piscina: {initialPoolName ?? selectedClient?.poolName ?? "Piscina nao encontrada"}
          </Text>
          <Text selectable style={styles.responsibleText}>
            Responsavel: {responsibleName ?? "Nao atribuido"}
          </Text>
          <Text selectable style={styles.responsibleText}>
            Data da visita: {attendanceDate}
          </Text>
          <Text selectable style={styles.helperText}>
            {selectedClient
              ? `${selectedClient.poolType || "Tipo nao informado"} - ${
                  typeof selectedClient.liters === "number" ? `${selectedClient.liters} litros` : "volume nao informado"
                } - ${selectedClient.city}${
                  canViewCommercialData ? ` - Plano: ${clientPlanLabels[selectedClient.plan]}` : ""
                }`
              : "Foto de referencia usada apenas para identificar a piscina."}
          </Text>
        </View>

        <View style={styles.card}>
          {clients.length > 0 && !lockedAgendaVisit ? (
            <View style={styles.field}>
              <Text style={styles.label}>Selecionar cliente</Text>
              <View style={styles.clientPicker}>
                {clients.map((client) => (
                  <PrimaryButton
                    key={client.id}
                    onPress={() => {
                      setClientName(client.name);
                      setSuccessMessage("");
                    }}
                    style={[
                      styles.clientPickerButton,
                      clientName === client.name && styles.clientPickerButtonSelected,
                    ]}
                    title={client.name}
                    variant={clientName === client.name ? "success" : "primary"}
                  />
                ))}
              </View>
            </View>
          ) : null}
          <FormField
            label="Nome do cliente"
            editable={!lockedAgendaVisit}
            onChangeText={(text) => {
              setClientName(text);
              setSuccessMessage("");
            }}
            placeholder="Nome do cliente"
            value={clientName}
          />
          <FormField
            label="Data do atendimento"
            editable={!lockedAgendaVisit}
            onChangeText={(text) => {
              setAttendanceDate(text);
              setSuccessMessage("");
            }}
            placeholder="04/07/2026"
            value={attendanceDate}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.groupTitle}>Checklist</Text>
          <View style={styles.checklist}>
            {checklistItems.map((item) => {
              const selected = completedItems.includes(item.id);

              return (
                <Pressable
                  accessibilityLabel={item.label}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: selected }}
                  key={item.id}
                  onPress={() => toggleChecklistItem(item.id)}
                  style={({ pressed }) => [
                    styles.checkItem,
                    selected && styles.checkItemSelected,
                    pressed && styles.checkItemPressed,
                  ]}
                >
                  <View style={[styles.checkbox, selected && styles.checkboxSelected]}>
                    <Text style={styles.checkboxText}>{selected ? "x" : ""}</Text>
                  </View>
                  <Text style={styles.checkLabel}>{item.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.measureGrid}>
            <FormField
              label="pH"
              onChangeText={(text) => {
                setPh(text);
                setSuccessMessage("");
              }}
              placeholder="Ex: 7.2"
              value={ph}
            />
            <FormField
              label="Cloro"
              onChangeText={(text) => {
                setChlorine(text);
                setSuccessMessage("");
              }}
              placeholder="Ex: 1.5 ppm"
              value={chlorine}
            />
          </View>
          <FormField
            label="Produtos utilizados"
            multiline
            onChangeText={(text) => {
              setProductsUsed(text);
              setSuccessMessage("");
            }}
            placeholder="Produtos e quantidades utilizadas"
            value={productsUsed}
          />
          <FormField
            label="Observacoes"
            multiline
            onChangeText={(text) => {
              setObservations(text);
              setSuccessMessage("");
            }}
            placeholder="Detalhes importantes do atendimento"
            value={observations}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.groupTitle}>Produtos faltando</Text>
          <Text selectable style={styles.helperText}>
            Registre itens que precisam ser aprovados pelo cliente antes de separar para levar.
          </Text>

          <FormField
            label="Produto/item"
            onChangeText={(text) => {
              setMissingProduct(text);
              setSuccessMessage("");
            }}
            placeholder="Peneira, cloro, mangueira..."
            value={missingProduct}
          />
          <FormField
            label="Quantidade"
            onChangeText={(text) => {
              setMissingQuantity(text);
              setSuccessMessage("");
            }}
            placeholder="1 unidade, 2 kg, 500 ml..."
            value={missingQuantity}
          />
          <FormField
            label="Observacao opcional"
            multiline
            onChangeText={(text) => {
              setMissingObservation(text);
              setSuccessMessage("");
            }}
            placeholder="Motivo ou detalhe para o cliente"
            value={missingObservation}
          />

          <PrimaryButton
            onPress={addMissingProduct}
            style={styles.addMissingButton}
            title="Adicionar produto faltando"
            variant="success"
          />

          {missingProducts.length > 0 ? (
            <View style={styles.missingList}>
              {missingProducts.map((item) => (
                <View key={item.id} style={styles.missingItem}>
                  <View style={styles.missingText}>
                    <Text selectable style={styles.missingTitle}>
                      {item.product}
                    </Text>
                    <Text selectable style={styles.missingDetail}>
                      Quantidade: {item.quantity}
                    </Text>
                    {item.observation ? (
                      <Text selectable style={styles.missingDetail}>
                        {item.observation}
                      </Text>
                    ) : null}
                  </View>
                  <Pressable
                    accessibilityLabel={`Remover ${item.product}`}
                    accessibilityRole="button"
                    onPress={() => removeMissingProduct(item.id)}
                    style={({ pressed }) => [
                      styles.removeMissingButton,
                      pressed && styles.removeMissingButtonPressed,
                    ]}
                  >
                    <Text style={styles.removeMissingText}>Remover</Text>
                  </Pressable>
                </View>
              ))}
            </View>
          ) : null}
        </View>

        <View style={styles.card}>
          <Text style={styles.groupTitle}>Fotos</Text>
          <View style={styles.photoActions}>
            <PrimaryButton
              onPress={() => pickPhoto("before")}
              style={[styles.photoButton, beforePhotoUri && styles.photoButtonAdded]}
              title={beforePhotoUri ? "Trocar foto do antes" : "Adicionar foto do antes"}
              variant={beforePhotoUri ? "success" : "primary"}
            />
            {beforePhotoUri ? (
              <View style={styles.photoPreviewWrapper}>
                <Image
                  accessibilityLabel="Previa da foto do antes"
                  source={{ uri: beforePhotoUri }}
                  style={styles.photoPreview}
                />
                <Text selectable style={styles.photoStatus}>
                  Foto do antes adicionada
                </Text>
              </View>
            ) : null}

            <PrimaryButton
              onPress={() => pickPhoto("after")}
              style={[styles.photoButton, afterPhotoUri && styles.photoButtonAdded]}
              title={afterPhotoUri ? "Trocar foto do depois" : "Adicionar foto do depois"}
              variant={afterPhotoUri ? "success" : "primary"}
            />
            {afterPhotoUri ? (
              <View style={styles.photoPreviewWrapper}>
                <Image
                  accessibilityLabel="Previa da foto do depois"
                  source={{ uri: afterPhotoUri }}
                  style={styles.photoPreview}
                />
                <Text selectable style={styles.photoStatus}>
                  Foto do depois adicionada
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        <PrimaryButton
          loading={saving}
          onPress={finalizeAttendance}
          style={styles.finalizeButton}
          title="Finalizar atendimento"
          variant="success"
        />

        {attendanceRecord ? (
          <View style={styles.summary}>
            <Text style={styles.summaryTitle}>Ultimo atendimento registrado</Text>
            <Text selectable style={styles.summaryText}>
              {attendanceRecord.clientName} - {attendanceRecord.attendanceDate}
            </Text>
            <Text selectable style={styles.summaryText}>
              {attendanceRecord.completedItems.length} item(ns) do checklist concluido(s).
            </Text>
          </View>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

type FormFieldProps = {
  editable?: boolean;
  label: string;
  value: string;
  placeholder: string;
  onChangeText: (value: string) => void;
  multiline?: boolean;
};

function FormField({
  editable = true,
  label,
  value,
  placeholder,
  onChangeText,
  multiline = false,
}: FormFieldProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        editable={editable}
        multiline={multiline}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        style={[styles.input, !editable && styles.inputDisabled, multiline && styles.textArea]}
        textAlignVertical={multiline ? "top" : "center"}
        value={value}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  addMissingButton: {
    height: 50,
  },
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
    padding: 16,
  },
  clientPicker: {
    gap: 8,
  },
  clientReferenceTitle: {
    color: colors.white,
    fontSize: 20,
    fontWeight: "900",
  },
  clientPickerButton: {
    height: 44,
  },
  clientPickerButtonSelected: {
    borderColor: "rgba(255, 255, 255, 0.22)",
    borderWidth: 1,
  },
  checkItem: {
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    borderColor: "rgba(255, 255, 255, 0.12)",
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    minHeight: 48,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  checkItemPressed: {
    opacity: 0.86,
  },
  checkItemSelected: {
    backgroundColor: "rgba(39, 174, 96, 0.24)",
    borderColor: "rgba(39, 174, 96, 0.6)",
  },
  checkLabel: {
    color: colors.white,
    flex: 1,
    fontSize: 16,
    fontWeight: "800",
    lineHeight: 22,
  },
  checkbox: {
    alignItems: "center",
    borderColor: colors.muted,
    borderRadius: 6,
    borderWidth: 2,
    height: 24,
    justifyContent: "center",
    width: 24,
  },
  checkboxSelected: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  checkboxText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: "900",
    lineHeight: 18,
  },
  checklist: {
    gap: 10,
  },
  content: {
    gap: 20,
    padding: 20,
    paddingTop: 28,
  },
  errorBox: {
    backgroundColor: "rgba(231, 76, 60, 0.18)",
    borderColor: "rgba(231, 76, 60, 0.44)",
    borderRadius: 8,
    borderWidth: 1,
    padding: 14,
  },
  errorText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: "800",
    lineHeight: 21,
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
  finalizeButton: {
    height: 54,
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
  },
  inputDisabled: {
    opacity: 0.72,
  },
  label: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  missingDetail: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  missingItem: {
    alignItems: "flex-start",
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    borderColor: "rgba(255, 255, 255, 0.12)",
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
    padding: 12,
  },
  missingList: {
    gap: 10,
  },
  missingText: {
    flex: 1,
    gap: 4,
  },
  missingTitle: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "900",
  },
  measureGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  photoActions: {
    gap: 12,
  },
  photoButton: {
    height: 50,
  },
  photoButtonAdded: {
    borderColor: "rgba(255, 255, 255, 0.22)",
    borderWidth: 1,
  },
  photoPreview: {
    backgroundColor: colors.input,
    borderRadius: 8,
    height: 180,
    width: "100%",
  },
  photoPreviewWrapper: {
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    borderColor: "rgba(255, 255, 255, 0.12)",
    borderRadius: 8,
    borderWidth: 1,
    gap: 10,
    padding: 10,
  },
  photoStatus: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: "800",
  },
  root: {
    backgroundColor: colors.background,
    flex: 1,
  },
  responsibleText: {
    color: colors.primaryLight,
    fontSize: 14,
    fontWeight: "900",
    lineHeight: 20,
  },
  removeMissingButton: {
    backgroundColor: "rgba(231, 76, 60, 0.22)",
    borderColor: "rgba(231, 76, 60, 0.44)",
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  removeMissingButtonPressed: {
    opacity: 0.82,
  },
  removeMissingText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: "900",
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 16,
    lineHeight: 23,
  },
  successBox: {
    backgroundColor: "rgba(39, 174, 96, 0.2)",
    borderColor: "rgba(39, 174, 96, 0.52)",
    borderRadius: 8,
    borderWidth: 1,
    padding: 14,
  },
  successText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "900",
    lineHeight: 22,
  },
  summary: {
    backgroundColor: "rgba(46, 134, 222, 0.22)",
    borderColor: "rgba(255, 255, 255, 0.12)",
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
    padding: 16,
  },
  summaryText: {
    color: colors.textSecondary,
    fontSize: 15,
    lineHeight: 22,
  },
  summaryTitle: {
    color: colors.white,
    fontSize: 18,
    fontWeight: "900",
  },
  textArea: {
    minHeight: 96,
    paddingTop: 14,
  },
  title: {
    color: colors.white,
    fontSize: 31,
    fontWeight: "900",
    lineHeight: 37,
  },
});
