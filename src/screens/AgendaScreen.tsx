import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";

import { AppCard } from "../components/app-card";
import { AppTextInput } from "../components/app-text-input";
import { PoolReferencePhoto } from "../components/pool-reference-photo";
import { PrimaryButton } from "../components/primary-button";
import { ScreenHeader } from "../components/screen-header";
import { StatusBadge } from "../components/status-badge";
import colors from "../theme/colors";
import {
  agendaStatusLabels,
  type AgendaItem,
  type AgendaStatus,
} from "../types/agenda";
import { clientPlanLabels, type Client } from "../types/client";
import { employeeRoleLabels, type Employee } from "../types/employee";

const statusOptions: AgendaStatus[] = ["pending", "in-progress", "finished"];

type AgendaScreenProps = {
  agendaItems: AgendaItem[];
  clients: Client[];
  employees: Employee[];
  canDistribute: boolean;
  canViewCommercialData?: boolean;
  errorMessage?: string;
  loading?: boolean;
  onBack: () => void;
  onAddAgendaItem: (client: Client, visitDate: string) => Promise<void> | void;
  onAssignAgendaItem: (agendaItemId: string, employeeId: string) => Promise<void> | void;
  onStartAttendance: (agendaItem: AgendaItem) => void;
  onUpdateStatus: (agendaItemId: string, status: AgendaStatus) => Promise<void> | void;
};

export function AgendaScreen({
  agendaItems,
  clients,
  employees,
  canDistribute,
  canViewCommercialData = true,
  errorMessage,
  loading = false,
  onBack,
  onAddAgendaItem,
  onAssignAgendaItem,
  onStartAttendance,
  onUpdateStatus,
}: AgendaScreenProps) {
  const [selectedClientId, setSelectedClientId] = useState(clients[0]?.id ?? "");
  const [visitDate, setVisitDate] = useState(new Date().toLocaleDateString("pt-BR"));
  const [formMessage, setFormMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const pendingCount = agendaItems.filter((item) => item.status !== "finished").length;
  const selectedClient = clients.find((client) => client.id === selectedClientId);
  const groupedAgendaItems = groupAgendaItems(agendaItems);

  async function handleAddAgendaItem() {
    if (!selectedClient) {
      setFormMessage("Cadastre um cliente antes de adicionar uma piscina ao dia.");
      return;
    }

    if (!visitDate.trim()) {
      setFormMessage("Informe a data da visita.");
      return;
    }

    setSaving(true);
    try {
      await onAddAgendaItem(selectedClient, visitDate.trim());
      setFormMessage("Piscina adicionada ao dia.");
    } catch (error) {
      setFormMessage(error instanceof Error ? error.message : "Nao foi possivel adicionar a piscina ao dia.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.content} contentInsetAdjustmentBehavior="automatic">
        <ScreenHeader
          eyebrow="Agenda"
          onBack={onBack}
          subtitle="Organize as piscinas que precisam de atendimento hoje, sem horarios."
          title="Atendimentos do dia"
        />

        <AppCard style={styles.summary}>
          <Text style={styles.summaryTitle}>{pendingCount} atendimento(s) em aberto</Text>
          <Text selectable style={styles.summaryText}>
            {loading ? "Carregando visitas do Firestore..." : "Atualize o status conforme o trabalho avanca e inicie o atendimento pelo cliente."}
          </Text>
        </AppCard>

        {errorMessage ? (
          <AppCard style={styles.errorCard}>
            <Text selectable style={styles.errorText}>
              {errorMessage}
            </Text>
          </AppCard>
        ) : null}

        {canDistribute ? (
          <AppCard style={styles.addCard}>
            <View style={styles.addHeader}>
              <Text style={styles.summaryTitle}>Adicionar piscina ao dia</Text>
              <Text selectable style={styles.summaryText}>
                Inclua manualmente uma piscina na agenda sem definir horario.
              </Text>
            </View>

            <AppTextInput
              label="Data da visita"
              onChangeText={setVisitDate}
              placeholder="15/07/2026"
              value={visitDate}
            />

            <View style={styles.clientPicker}>
              <Text style={styles.groupLabel}>Cliente</Text>
              {clients.length > 0 ? (
                <View style={styles.clientOptions}>
                  {clients.map((client) => {
                    const selected = selectedClientId === client.id;

                    return (
                      <Pressable
                        accessibilityLabel={`Selecionar ${client.name}`}
                        accessibilityRole="button"
                        key={client.id}
                        onPress={() => {
                          setSelectedClientId(client.id);
                          setFormMessage("");
                        }}
                        style={({ pressed }) => [
                          styles.clientOption,
                          selected && styles.clientOptionSelected,
                          pressed && styles.clientOptionPressed,
                        ]}
                      >
                        <PoolReferencePhoto style={styles.clientOptionPhoto} uri={client.referencePhotoUri} />
                        <View style={styles.clientOptionText}>
                          <Text selectable style={styles.clientOptionName}>
                            {safeText(client.name, "Cliente nao encontrado")}
                          </Text>
                          <Text selectable style={styles.clientOptionDetail}>
                            {canViewCommercialData
                              ? `${safeText(client.neighborhood, "Bairro nao informado")} - ${clientPlanLabels[client.plan]}`
                              : safeText(client.neighborhood, "Bairro nao informado")}
                          </Text>
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              ) : (
                <Text selectable style={styles.summaryText}>
                  Nenhum cliente cadastrado.
                </Text>
              )}
            </View>

            {formMessage ? (
              <Text selectable style={styles.formMessage}>
                {formMessage}
              </Text>
            ) : null}

            <PrimaryButton
              icon="+"
              loading={saving}
              onPress={handleAddAgendaItem}
              title="Adicionar piscina ao dia"
            />
          </AppCard>
        ) : null}

        <View style={styles.agendaList}>
          {groupedAgendaItems.map((section) => (
            <View key={section.title} style={styles.agendaSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{section.title}</Text>
                <Text style={styles.sectionCount}>{section.items.length}</Text>
              </View>

              {section.items.length === 0 ? (
                <AppCard style={styles.emptySectionCard}>
                  <Text selectable style={styles.summaryText}>
                    Nenhuma visita nesta seção.
                  </Text>
                </AppCard>
              ) : (
                section.items.map((item) => {
                  const agendaClient = clients.find((client) => client.id === item.clientId || client.name === item.clientName);

                  return (
                    <AppCard key={item.id} style={styles.agendaCard}>
                      <View style={styles.itemHeader}>
                        <PoolReferencePhoto uri={agendaClient?.referencePhotoUri} />
                        <View style={styles.itemHeaderText}>
                          <Text selectable style={styles.clientName}>
                            {safeText(item.clientName, "Cliente nao encontrado")}
                          </Text>
                          <Text selectable style={styles.poolName}>
                            {safeText(item.poolName, "Piscina principal")}
                          </Text>
                          <Text selectable style={styles.neighborhood}>
                            {safeText(item.neighborhood, "Bairro nao informado")}
                          </Text>
                          {canViewCommercialData && agendaClient?.plan ? (
                            <Text selectable style={styles.planText}>
                              Plano: {clientPlanLabels[agendaClient.plan]}
                            </Text>
                          ) : null}
                        </View>

                        <StatusBadge label={getAgendaStatusLabel(item.status)} tone={getStatusTone(item.status)} />
                      </View>

                      <Text selectable style={styles.address}>
                        {safeText(item.address, "Endereco nao informado")}
                      </Text>
                      <Text selectable style={styles.visitDate}>
                        Data da visita: {safeText(item.visitDate, "Hoje")}
                      </Text>
                      <Text selectable style={styles.responsibleText}>
                        Responsavel: {safeText(item.assignedEmployeeName, "Sem responsavel")}
                      </Text>

                      <View style={styles.statusGroup}>
                        <Text style={styles.groupLabel}>Status</Text>
                        <View style={styles.statusOptions}>
                          {statusOptions.map((status) => {
                            const selected = item.status === status;

                            return (
                              <Pressable
                                accessibilityLabel={`Alterar status para ${agendaStatusLabels[status]}`}
                                accessibilityRole="button"
                                key={status}
                                onPress={() => onUpdateStatus(item.id, status)}
                                style={({ pressed }) => [
                                  styles.statusOption,
                                  selected && styles.statusOptionSelected,
                                  pressed && styles.statusOptionPressed,
                                ]}
                              >
                                <Text
                                  style={[
                                    styles.statusOptionText,
                                    selected && styles.statusOptionTextSelected,
                                  ]}
                                >
                                {getAgendaStatusLabel(status)}
                                </Text>
                              </Pressable>
                            );
                          })}
                        </View>
                      </View>

                      {canDistribute ? (
                        <View style={styles.distributionGroup}>
                          <Text style={styles.groupLabel}>Distribuir piscinas</Text>
                          <View style={styles.employeeOptions}>
                            {employees.map((employee) => {
                              const selected = item.assignedEmployeeId === employee.id;

                              return (
                                <Pressable
                                  accessibilityLabel={`Atribuir para ${employee.name}`}
                                  accessibilityRole="button"
                                  key={employee.id}
                                  onPress={() => onAssignAgendaItem(item.id, employee.id)}
                                  style={({ pressed }) => [
                                    styles.employeeOption,
                                    selected && styles.employeeOptionSelected,
                                    pressed && styles.employeeOptionPressed,
                                  ]}
                                >
                                  <Text style={styles.employeeOptionText}>{safeText(employee.name, "Funcionario")}</Text>
                                  <Text style={styles.employeeRoleText}>{employeeRoleLabels[employee.role] ?? "Funcionario"}</Text>
                                </Pressable>
                              );
                            })}
                          </View>
                        </View>
                      ) : null}

                      <PrimaryButton
                        onPress={() => onStartAttendance(item)}
                        style={styles.startButton}
                        title="Iniciar atendimento"
                        variant={item.status === "finished" ? "primary" : "success"}
                      />
                    </AppCard>
                  );
                })
              )}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

function getStatusTone(status: AgendaStatus) {
  if (status === "finished") {
    return "completed";
  }

  if (status === "in-progress") {
    return "info";
  }

  return "pending";
}

function getAgendaStatusLabel(status: AgendaStatus) {
  return agendaStatusLabels[status] ?? "Pendente";
}

function safeText(value: unknown, fallback = "") {
  if (value === null || value === undefined) {
    return fallback;
  }

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  return fallback;
}

function groupAgendaItems(items: AgendaItem[]) {
  const today = startOfDay(new Date());
  const tomorrow = addDays(today, 1);
  const weekEnd = addDays(today, 6);
  const groups = [
    { title: "Hoje", items: [] as AgendaItem[] },
    { title: "Amanhã", items: [] as AgendaItem[] },
    { title: "Esta semana", items: [] as AgendaItem[] },
    { title: "Atrasadas", items: [] as AgendaItem[] },
  ];

  items.forEach((item) => {
    const visitDate = parseAgendaDate(item.data ?? item.visitDate);

    if (!visitDate) {
      groups[2].items.push(item);
      return;
    }

    if (visitDate < today && item.status !== "finished") {
      groups[3].items.push(item);
      return;
    }

    if (sameDay(visitDate, today)) {
      groups[0].items.push(item);
      return;
    }

    if (sameDay(visitDate, tomorrow)) {
      groups[1].items.push(item);
      return;
    }

    if (visitDate > tomorrow && visitDate <= weekEnd) {
      groups[2].items.push(item);
    }
  });

  return groups;
}

function parseAgendaDate(value?: string) {
  if (!value || value === "Hoje") {
    return value === "Hoje" ? startOfDay(new Date()) : null;
  }

  const brDate = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);

  if (brDate) {
    return startOfDay(new Date(Number(brDate[3]), Number(brDate[2]) - 1, Number(brDate[1])));
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : startOfDay(parsed);
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, days: number) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return startOfDay(nextDate);
}

function sameDay(left: Date, right: Date) {
  return left.getTime() === right.getTime();
}

const styles = StyleSheet.create({
  addCard: {
    gap: 16,
  },
  addHeader: {
    gap: 8,
  },
  address: {
    color: colors.textSecondary,
    fontSize: 15,
    lineHeight: 22,
  },
  agendaCard: {
    gap: 16,
  },
  agendaList: {
    gap: 12,
  },
  agendaSection: {
    gap: 10,
  },
  clientName: {
    color: colors.white,
    fontSize: 19,
    fontWeight: "900",
    lineHeight: 25,
  },
  clientOption: {
    alignItems: "center",
    backgroundColor: colors.input,
    borderColor: colors.border,
    borderCurve: "continuous",
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    padding: 10,
  },
  clientOptionDetail: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 18,
  },
  clientOptionName: {
    color: colors.white,
    fontSize: 15,
    fontWeight: "900",
  },
  clientOptionPhoto: {
    height: 54,
    width: 54,
  },
  clientOptionPressed: {
    opacity: 0.86,
  },
  clientOptionSelected: {
    backgroundColor: "rgba(45, 125, 255, 0.18)",
    borderColor: colors.primaryLight,
  },
  clientOptionText: {
    flex: 1,
    gap: 3,
  },
  clientOptions: {
    gap: 10,
  },
  clientPicker: {
    gap: 10,
  },
  content: {
    gap: 24,
    padding: 20,
    paddingTop: 28,
  },
  groupLabel: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  formMessage: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: "800",
    lineHeight: 20,
  },
  distributionGroup: {
    gap: 10,
  },
  employeeOption: {
    backgroundColor: colors.input,
    borderColor: colors.border,
    borderCurve: "continuous",
    borderRadius: 8,
    borderWidth: 1,
    gap: 3,
    minWidth: 138,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  employeeOptionPressed: {
    opacity: 0.86,
  },
  employeeOptionSelected: {
    backgroundColor: "rgba(21, 101, 255, 0.28)",
    borderColor: colors.primaryLight,
  },
  employeeOptionText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: "900",
  },
  employeeOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  emptySectionCard: {
    padding: 14,
  },
  employeeRoleText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: "800",
  },
  errorCard: {
    backgroundColor: "rgba(239, 68, 68, 0.12)",
    borderColor: "rgba(239, 68, 68, 0.36)",
  },
  errorText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: "900",
    lineHeight: 20,
  },
  itemHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
  },
  itemHeaderText: {
    flex: 1,
    gap: 4,
  },
  neighborhood: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: "800",
  },
  planText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 18,
  },
  poolName: {
    color: colors.primaryLight,
    fontSize: 13,
    fontWeight: "900",
  },
  responsibleText: {
    color: colors.primaryLight,
    fontSize: 14,
    fontWeight: "900",
    lineHeight: 20,
  },
  root: {
    backgroundColor: colors.background,
    flex: 1,
  },
  sectionCount: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: "900",
  },
  sectionHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  sectionTitle: {
    color: colors.white,
    fontFamily: "Poppins",
    fontSize: 18,
    fontWeight: "900",
  },
  startButton: {
    height: 50,
  },
  statusGroup: {
    gap: 10,
  },
  statusOption: {
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    borderColor: "rgba(255, 255, 255, 0.12)",
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 42,
    justifyContent: "center",
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  statusOptionPressed: {
    opacity: 0.86,
  },
  statusOptionSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.muted,
  },
  statusOptionText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: "800",
  },
  statusOptionTextSelected: {
    color: colors.white,
  },
  statusOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  summary: {
    gap: 8,
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
  visitDate: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: "800",
    lineHeight: 20,
  },
});
