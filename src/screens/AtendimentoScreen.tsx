import React, { useEffect, useRef, useState } from "react";
import { KeyboardAvoidingView, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { StatusBar } from "expo-status-bar";

import { PoolReferencePhoto } from "../components/pool-reference-photo";
import { PrimaryButton } from "../components/primary-button";
import colors from "../theme/colors";
import type { AttendanceProductUsed, AttendanceRecord } from "../types/attendance";
import type { Client } from "../types/client";
import type { MissingProductItem } from "../types/product-request";

type ChecklistItem = {
  id: string;
  label: string;
};

const checklistItems: ChecklistItem[] = [
  { id: "measured-ph", label: "Medir pH" },
  { id: "measured-chlorine", label: "Medir Cloro" },
  { id: "vacuumed", label: "Aspirar piscina" },
  { id: "brushed-walls", label: "Escovar paredes" },
  { id: "cleaned-edge", label: "Limpar borda" },
  { id: "cleaned-baskets", label: "Limpar cestos" },
  { id: "backwashed-filter", label: "Retrolavar filtro" },
  { id: "completed-water-level", label: "Completar nivel da agua (quando necessario)" },
  { id: "checked-machine-room", label: "Verificar casa de maquinas" },
  { id: "checked-leaks", label: "Verificar vazamentos" },
  { id: "checked-equipment", label: "Conferir equipamentos" },
];

type AtendimentoScreenProps = {
  canViewCommercialData?: boolean;
  clients?: Client[];
  initialAddress?: string;
  initialAttendanceDate?: string;
  initialBairro?: string;
  initialClientId?: string;
  initialClientName?: string;
  initialEmpresaId?: string;
  initialPiscinaId?: string;
  initialPoolName?: string;
  initialPoolNotes?: string;
  initialReferencePhotoUri?: string;
  initialVisitId?: string;
  onBack: () => void;
  onSaveAttendance: (attendance: AttendanceRecord) => Promise<void> | void;
  onStartAttendance?: () => Promise<void> | void;
  responsibleName?: string;
};

export function AtendimentoScreen({
  canViewCommercialData = true,
  clients = [],
  initialAddress,
  initialAttendanceDate,
  initialBairro,
  initialClientId,
  initialClientName,
  initialEmpresaId,
  initialPiscinaId,
  initialPoolName,
  initialPoolNotes,
  initialReferencePhotoUri,
  initialVisitId,
  onBack,
  onSaveAttendance,
  onStartAttendance,
  responsibleName,
}: AtendimentoScreenProps) {
  const returnHomeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [clientName, setClientName] = useState(initialClientName ?? "Condominio Lago Azul");
  const [attendanceDate, setAttendanceDate] = useState(initialAttendanceDate ?? new Date().toLocaleDateString("pt-BR"));
  const [started, setStarted] = useState(!initialVisitId);
  const [completedItems, setCompletedItems] = useState<string[]>([]);
  const [ph, setPh] = useState("");
  const [chlorine, setChlorine] = useState("");
  const [alkalinity, setAlkalinity] = useState("");
  const [temperature, setTemperature] = useState("");
  const [usedProduct, setUsedProduct] = useState("");
  const [usedQuantity, setUsedQuantity] = useState("");
  const [usedUnit, setUsedUnit] = useState("");
  const [productsUsedItems, setProductsUsedItems] = useState<AttendanceProductUsed[]>([]);
  const [neededProduct, setNeededProduct] = useState("");
  const [neededQuantity, setNeededQuantity] = useState("");
  const [neededObservation, setNeededObservation] = useState("");
  const [neededProducts, setNeededProducts] = useState<MissingProductItem[]>([]);
  const [observations, setObservations] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [starting, setStarting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [attendanceRecord, setAttendanceRecord] = useState<AttendanceRecord | null>(null);
  const selectedClient = clients.find((client) => client.id === initialClientId || client.name === clientName);
  const lockedAgendaVisit = Boolean(initialVisitId);
  const referencePhotoUri = initialReferencePhotoUri ?? selectedClient?.referencePhotoUri;
  const address = initialAddress ?? selectedClient?.address ?? "Endereco nao informado";
  const neighborhood = initialBairro ?? selectedClient?.neighborhood ?? "Bairro nao informado";
  const poolName = initialPoolName ?? selectedClient?.poolName ?? "Piscina nao encontrada";
  const poolNotes = initialPoolNotes || selectedClient?.poolNotes || "Sem observacoes da piscina.";

  useEffect(() => {
    return () => {
      if (returnHomeTimerRef.current) {
        clearTimeout(returnHomeTimerRef.current);
      }
    };
  }, []);

  async function startAttendance() {
    setError("");
    setSuccessMessage("");
    setStarting(true);

    try {
      await onStartAttendance?.();
      setStarted(true);
      setSuccessMessage("Atendimento iniciado.");
    } catch (startError) {
      setError(startError instanceof Error ? startError.message : "Nao foi possivel iniciar o atendimento.");
    } finally {
      setStarting(false);
    }
  }

  function toggleChecklistItem(itemId: string) {
    setSuccessMessage("");
    setCompletedItems((currentItems) =>
      currentItems.includes(itemId)
        ? currentItems.filter((currentItem) => currentItem !== itemId)
        : [...currentItems, itemId],
    );
  }

  function addUsedProduct() {
    setSuccessMessage("");

    if (!usedProduct.trim() || !usedQuantity.trim()) {
      setError("Preencha o produto utilizado e a quantidade.");
      return;
    }

    setError("");
    setProductsUsedItems((currentItems) => [
      ...currentItems,
      {
        id: String(Date.now()),
        product: usedProduct.trim(),
        quantity: usedQuantity.trim(),
        unit: usedUnit.trim(),
      },
    ]);
    setUsedProduct("");
    setUsedQuantity("");
    setUsedUnit("");
  }

  function addNeededProduct() {
    setSuccessMessage("");

    if (!neededProduct.trim() || !neededQuantity.trim()) {
      setError("Preencha o produto necessario e a quantidade.");
      return;
    }

    setError("");
    setNeededProducts((currentProducts) => [
      ...currentProducts,
      {
        id: String(Date.now()),
        observation: neededObservation.trim(),
        product: neededProduct.trim(),
        quantity: neededQuantity.trim(),
      },
    ]);
    setNeededProduct("");
    setNeededQuantity("");
    setNeededObservation("");
  }

  function removeUsedProduct(productId: string) {
    setProductsUsedItems((currentProducts) => currentProducts.filter((product) => product.id !== productId));
  }

  function removeNeededProduct(productId: string) {
    setNeededProducts((currentProducts) => currentProducts.filter((product) => product.id !== productId));
  }

  async function finalizeAttendance() {
    setSuccessMessage("");

    if (!started) {
      setError("Inicie o atendimento antes de finalizar.");
      return;
    }

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
      const productsUsedText = productsUsedItems
        .map((item) => `${item.product} ${item.quantity}${item.unit ? ` ${item.unit}` : ""}`)
        .join(", ");
      const finishedAttendance: AttendanceRecord = {
        id: String(Date.now()),
        afterPhotoUri: "foto-depois-placeholder",
        alkalinity: alkalinity.trim(),
        attendanceDate: attendanceDate.trim(),
        beforePhotoUri: "foto-antes-placeholder",
        chlorine: chlorine.trim(),
        clienteId: initialClientId ?? selectedClient?.id,
        clientName: clientName.trim(),
        completedItems: completedLabels,
        empresaId: initialEmpresaId,
        missingProducts: neededProducts,
        observations: observations.trim(),
        ph: ph.trim(),
        piscinaId: initialPiscinaId ?? selectedClient?.piscinaId,
        poolName,
        productsUsed: productsUsedText,
        productsUsedItems,
        temperature: temperature.trim(),
        visitaId: initialVisitId,
        waterParameters: {
          alkalinity: alkalinity.trim(),
          chlorine: chlorine.trim(),
          ph: ph.trim(),
          temperature: temperature.trim(),
        },
      };

      await onSaveAttendance(finishedAttendance);
      setAttendanceRecord(finishedAttendance);
      setSuccessMessage("Atendimento finalizado. Voltando para a Home...");

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
            <Text style={styles.eyebrow}>Fluxo operacional</Text>
            <Text style={styles.title}>Atendimento da Piscina</Text>
            <Text selectable style={styles.subtitle}>
              Confira a piscina, inicie a visita e registre a limpeza completa.
            </Text>
          </View>

          <PrimaryButton onPress={onBack} style={styles.backButton} title="Voltar" variant="danger" />
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
          <PoolReferencePhoto size="banner" uri={referencePhotoUri} />
          <Text selectable style={styles.clientReferenceTitle}>
            {clientName || "Cliente nao encontrado"}
          </Text>
          <InfoLine label="Piscina" value={poolName} />
          <InfoLine label="Endereco" value={address} />
          <InfoLine label="Bairro" value={neighborhood} />
          <InfoLine label="Responsavel" value={responsibleName ?? "Sem responsavel"} />
          <InfoLine label="Data da visita" value={attendanceDate} />
          <InfoLine label="Observacoes da piscina" value={poolNotes} />
          {canViewCommercialData && selectedClient ? (
            <InfoLine label="Plano" value={selectedClient.plan} />
          ) : null}

          {!started ? (
            <PrimaryButton
              loading={starting}
              onPress={startAttendance}
              style={styles.startButton}
              title="Iniciar atendimento"
              variant="success"
            />
          ) : (
            <Text selectable style={styles.startedText}>
              Atendimento iniciado.
            </Text>
          )}
        </View>

        {clients.length > 0 && !lockedAgendaVisit ? (
          <View style={styles.card}>
            <Text style={styles.groupTitle}>Selecionar cliente</Text>
            <View style={styles.clientPicker}>
              {clients.map((client) => (
                <PrimaryButton
                  key={client.id}
                  onPress={() => {
                    setClientName(client.name);
                    setSuccessMessage("");
                  }}
                  style={[styles.clientPickerButton, clientName === client.name && styles.clientPickerButtonSelected]}
                  title={client.name}
                  variant={clientName === client.name ? "success" : "primary"}
                />
              ))}
            </View>
          </View>
        ) : null}

        {started ? (
          <>
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
              <Text style={styles.groupTitle}>Parametros da agua</Text>
              <View style={styles.measureGrid}>
                <FormField label="pH" onChangeText={setPh} placeholder="Ex: 7.2" value={ph} />
                <FormField label="Cloro" onChangeText={setChlorine} placeholder="Ex: 1.5 ppm" value={chlorine} />
                <FormField label="Alcalinidade (opcional)" onChangeText={setAlkalinity} placeholder="Ex: 90 ppm" value={alkalinity} />
                <FormField label="Temperatura (opcional)" onChangeText={setTemperature} placeholder="Ex: 27 C" value={temperature} />
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.groupTitle}>Produtos utilizados</Text>
              <FormField label="Produto" onChangeText={setUsedProduct} placeholder="Cloro" value={usedProduct} />
              <FormField label="Quantidade" onChangeText={setUsedQuantity} placeholder="2" value={usedQuantity} />
              <FormField label="Unidade" onChangeText={setUsedUnit} placeholder="kg, g, ml..." value={usedUnit} />
              <PrimaryButton onPress={addUsedProduct} style={styles.addButton} title="Adicionar produto" variant="success" />
              <ProductList items={productsUsedItems} onRemove={removeUsedProduct} />
            </View>

            <View style={styles.card}>
              <Text style={styles.groupTitle}>Produtos necessarios</Text>
              <Text selectable style={styles.helperText}>
                Estes itens ficam pendentes para aprovacao do Dono. Estoque ainda nao sera movimentado.
              </Text>
              <FormField label="Produto" onChangeText={setNeededProduct} placeholder="Barrilha" value={neededProduct} />
              <FormField label="Quantidade" onChangeText={setNeededQuantity} placeholder="500 g" value={neededQuantity} />
              <FormField
                label="Observacao"
                multiline
                onChangeText={setNeededObservation}
                placeholder="Motivo ou detalhe para aprovacao"
                value={neededObservation}
              />
              <PrimaryButton onPress={addNeededProduct} style={styles.addButton} title="Adicionar produto" variant="success" />
              <NeededProductList items={neededProducts} onRemove={removeNeededProduct} />
            </View>

            <View style={styles.card}>
              <FormField
                label="Observacoes da visita"
                multiline
                onChangeText={setObservations}
                placeholder="Ex: Piscina apresentou inicio de algas."
                value={observations}
              />
            </View>

            <View style={styles.card}>
              <Text style={styles.groupTitle}>Fotos</Text>
              <View style={styles.photoPlaceholder}>
                <Text selectable style={styles.photoPlaceholderText}>Foto Antes - placeholder</Text>
              </View>
              <View style={styles.photoPlaceholder}>
                <Text selectable style={styles.photoPlaceholderText}>Foto Depois - placeholder</Text>
              </View>
            </View>

            <PrimaryButton
              loading={saving}
              onPress={finalizeAttendance}
              style={styles.finalizeButton}
              title="Finalizar atendimento"
              variant="success"
            />
          </>
        ) : null}

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
  multiline?: boolean;
  onChangeText: (value: string) => void;
  placeholder: string;
  value: string;
};

function FormField({ editable = true, label, multiline = false, onChangeText, placeholder, value }: FormFieldProps) {
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

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoLine}>
      <Text style={styles.label}>{label}</Text>
      <Text selectable style={styles.infoValue}>
        {String(value ?? "")}
      </Text>
    </View>
  );
}

function ProductList({ items, onRemove }: { items: AttendanceProductUsed[]; onRemove: (id: string) => void }) {
  if (items.length === 0) {
    return null;
  }

  return (
    <View style={styles.list}>
      {items.map((item) => (
        <View key={item.id} style={styles.listItem}>
          <View style={styles.listItemText}>
            <Text selectable style={styles.listItemTitle}>{item.product}</Text>
            <Text selectable style={styles.listItemDetail}>
              {item.quantity} {item.unit}
            </Text>
          </View>
          <RemoveButton label={item.product} onPress={() => onRemove(item.id)} />
        </View>
      ))}
    </View>
  );
}

function NeededProductList({ items, onRemove }: { items: MissingProductItem[]; onRemove: (id: string) => void }) {
  if (items.length === 0) {
    return null;
  }

  return (
    <View style={styles.list}>
      {items.map((item) => (
        <View key={item.id} style={styles.listItem}>
          <View style={styles.listItemText}>
            <Text selectable style={styles.listItemTitle}>{item.product}</Text>
            <Text selectable style={styles.listItemDetail}>Quantidade: {item.quantity}</Text>
            {item.observation ? (
              <Text selectable style={styles.listItemDetail}>{item.observation}</Text>
            ) : null}
          </View>
          <RemoveButton label={item.product} onPress={() => onRemove(item.id)} />
        </View>
      ))}
    </View>
  );
}

function RemoveButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityLabel={`Remover ${label}`}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.removeButton, pressed && styles.removeButtonPressed]}
    >
      <Text style={styles.removeButtonText}>Remover</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  addButton: {
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
  clientPicker: {
    gap: 8,
  },
  clientPickerButton: {
    height: 44,
  },
  clientPickerButtonSelected: {
    borderColor: "rgba(255, 255, 255, 0.22)",
    borderWidth: 1,
  },
  clientReferenceTitle: {
    color: colors.white,
    fontSize: 22,
    fontWeight: "900",
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
    flexBasis: 180,
    flexGrow: 1,
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
  infoLine: {
    gap: 5,
  },
  infoValue: {
    color: colors.white,
    fontSize: 16,
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
  list: {
    gap: 10,
  },
  listItem: {
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
  listItemDetail: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  listItemText: {
    flex: 1,
    gap: 4,
  },
  listItemTitle: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "900",
  },
  measureGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  photoPlaceholder: {
    alignItems: "center",
    backgroundColor: colors.input,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 120,
    justifyContent: "center",
    padding: 18,
  },
  photoPlaceholderText: {
    color: colors.textSecondary,
    fontSize: 15,
    fontWeight: "900",
  },
  removeButton: {
    backgroundColor: "rgba(231, 76, 60, 0.22)",
    borderColor: "rgba(231, 76, 60, 0.44)",
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  removeButtonPressed: {
    opacity: 0.82,
  },
  removeButtonText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: "900",
  },
  root: {
    backgroundColor: colors.background,
    flex: 1,
  },
  startButton: {
    height: 52,
  },
  startedText: {
    color: colors.success,
    fontSize: 15,
    fontWeight: "900",
    lineHeight: 21,
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
    minHeight: 120,
    paddingTop: 14,
  },
  title: {
    color: colors.white,
    fontSize: 31,
    fontWeight: "900",
    lineHeight: 37,
  },
});
