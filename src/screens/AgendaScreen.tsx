import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";

import { AppCard } from "../components/app-card";
import { AppTextInput } from "../components/app-text-input";
import { PoolReferencePhoto } from "../components/pool-reference-photo";
import { PrimaryButton } from "../components/primary-button";
import { ScreenHeader } from "../components/screen-header";
import { StatusBadge } from "../components/status-badge";
import colors from "../theme/colors";
import { agendaStatusLabels, type AgendaItem, type AgendaStatus } from "../types/agenda";
import { clientPlanLabels, type Client } from "../types/client";
import { employeeRoleLabels, type Employee } from "../types/employee";

const statusOptions: AgendaStatus[] = ["pending", "in-progress", "finished"];
const filterStatusOptions: Array<"all" | AgendaStatus | "late"> = ["all", "pending", "in-progress", "finished", "late"];
const sectionOptions = ["today", "tomorrow", "week", "late", "unassigned"] as const;

type AgendaSectionId = (typeof sectionOptions)[number];
type AgendaStatusFilter = (typeof filterStatusOptions)[number];

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
  const [activeSection, setActiveSection] = useState<AgendaSectionId>("today");
  const [employeeFilter, setEmployeeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<AgendaStatusFilter>("all");
  const [dateFilter, setDateFilter] = useState("");

  const selectedClient = clients.find((client) => client.id === selectedClientId);
  const orderedItems = useMemo(() => {
    try {
      return sortAgendaItemsByDate(Array.isArray(agendaItems) ? agendaItems : []);
    } catch (error) {
      console.error("[Agenda] Falha ao ordenar visitas.", error);
      return [];
    }
  }, [agendaItems]);
  const filteredItems = useMemo(
    () => {
      try {
        return filterAgendaItems(orderedItems, activeSection, employeeFilter, statusFilter, dateFilter);
      } catch (error) {
        console.error("[Agenda] Falha ao filtrar visitas.", error);
        return orderedItems;
      }
    },
    [activeSection, dateFilter, employeeFilter, orderedItems, statusFilter],
  );
  const sectionCounts = useMemo(() => {
    try {
      return getAgendaSectionCounts(orderedItems);
    } catch (error) {
      console.error("[Agenda] Falha ao calcular secoes.", error);
      return emptySectionCounts();
    }
  }, [orderedItems]);
  const pendingCount = orderedItems.filter((item) => item.status !== "finished").length;

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
          subtitle="Visitas organizadas por data, status e responsavel."
          title="Agenda Inteligente"
        />

        <AppCard style={styles.summary}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryMetric}>
              <Text style={styles.summaryNumber}>{orderedItems.length}</Text>
              <Text style={styles.summaryLabel}>Visitas</Text>
            </View>
            <View style={styles.summaryMetric}>
              <Text style={styles.summaryNumber}>{pendingCount}</Text>
              <Text style={styles.summaryLabel}>Em aberto</Text>
            </View>
            <View style={styles.summaryMetric}>
              <Text style={styles.summaryNumber}>{sectionCounts.unassigned}</Text>
              <Text style={styles.summaryLabel}>Sem resp.</Text>
            </View>
          </View>
          <Text selectable style={styles.summaryText}>
            {loading ? "Carregando visitas do Firestore..." : "Toque em uma visita para iniciar o atendimento da piscina."}
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

            <AppTextInput label="Data da visita" onChangeText={setVisitDate} placeholder="15/07/2026" value={visitDate} />

            <View style={styles.clientPicker}>
              <Text style={styles.groupLabel}>Cliente</Text>
              {clients.length > 0 ? (
                <View style={styles.clientOptions}>
                  {clients.map((client) => {
                    const selected = selectedClientId === client.id;

                    return (
                      <Pressable
                        accessibilityLabel={`Selecionar ${safeText(client.name, "cliente")}`}
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
                              ? `${safeText(client.neighborhood, "Bairro nao informado")} - ${safeText(clientPlanLabels[client.plan], "Plano nao informado")}`
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

            <PrimaryButton icon="+" loading={saving} onPress={handleAddAgendaItem} title="Adicionar piscina ao dia" />
          </AppCard>
        ) : null}

        <AppCard style={styles.filtersCard}>
          <Text style={styles.summaryTitle}>Organizacao da agenda</Text>

          <View style={styles.tabs}>
            {sectionOptions.map((section) => {
              const selected = activeSection === section;

              return (
                <Pressable
                  accessibilityLabel={`Abrir ${sectionLabels[section]}`}
                  accessibilityRole="tab"
                  accessibilityState={{ selected }}
                  key={section}
                  onPress={() => setActiveSection(section)}
                  style={({ pressed }) => [styles.tab, selected && styles.tabSelected, pressed && styles.tabPressed]}
                >
                  <Text style={[styles.tabText, selected && styles.tabTextSelected]}>{sectionLabels[section]}</Text>
                  <Text style={[styles.tabCount, selected && styles.tabTextSelected]}>{sectionCounts[section]}</Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.filterGroup}>
            <Text style={styles.groupLabel}>Funcionario</Text>
            <View style={styles.filterChips}>
              <FilterChip label="Todos" selected={employeeFilter === "all"} onPress={() => setEmployeeFilter("all")} />
              <FilterChip
                label="Sem responsavel"
                selected={employeeFilter === "unassigned"}
                onPress={() => setEmployeeFilter("unassigned")}
              />
              {employees.map((employee) => (
                <FilterChip
                  key={employee.id}
                  label={safeText(employee.name, "Funcionario")}
                  selected={employeeFilter === employee.id}
                  onPress={() => setEmployeeFilter(employee.id)}
                />
              ))}
            </View>
          </View>

          <View style={styles.filterGroup}>
            <Text style={styles.groupLabel}>Status</Text>
            <View style={styles.filterChips}>
              {filterStatusOptions.map((status) => (
                <FilterChip
                  key={status}
                  label={statusFilterLabels[status]}
                  selected={statusFilter === status}
                  onPress={() => setStatusFilter(status)}
                />
              ))}
            </View>
          </View>

          <AppTextInput
            label="Filtrar por data"
            onChangeText={setDateFilter}
            placeholder="Ex: 15/07/2026"
            value={dateFilter}
          />
        </AppCard>

        <View style={styles.agendaList}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>{sectionLabels[activeSection]}</Text>
              <Text style={styles.sectionSubtitle}>{filteredItems.length} visita(s) encontrada(s)</Text>
            </View>
          </View>

          {filteredItems.length === 0 ? (
            <AppCard style={styles.emptySectionCard}>
              <Text selectable style={styles.summaryText}>
                Nenhuma visita encontrada com os filtros atuais.
              </Text>
            </AppCard>
          ) : (
            filteredItems.map((item) => {
              const agendaClient = clients.find((client) => client.id === item.clientId || client.name === item.clientName);
              const visualStatus = getVisualStatus(item);

              return (
                <AppCard key={item.id} style={styles.agendaCard} tone={visualStatus === "late" ? "warning" : "default"}>
                  <Pressable
                    accessibilityLabel={`Abrir atendimento de ${safeText(item.clientName, "cliente")}`}
                    accessibilityRole="button"
                    onPress={() => onStartAttendance(item)}
                    style={({ pressed }) => [styles.itemHeaderButton, pressed && styles.itemHeaderButtonPressed]}
                  >
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
                    </View>

                    <StatusBadge label={getVisualStatusLabel(item)} tone={getStatusTone(item)} />
                  </Pressable>

                  <View style={styles.infoGrid}>
                    <InfoPill label="Dia" value={formatAgendaDate(item.data ?? item.visitDate)} />
                    <InfoPill label="Responsavel" value={safeText(item.assignedEmployeeName, "Sem responsavel")} />
                    <InfoPill label="Bairro" value={safeText(item.neighborhood, "Bairro nao informado")} />
                  </View>

                  <View style={styles.addressBox}>
                    <Text selectable style={styles.addressLabel}>
                      Endereco
                    </Text>
                    <Text selectable style={styles.address}>
                      {safeText(item.address, "Endereco nao informado")}
                    </Text>
                  </View>

                  {canViewCommercialData && agendaClient?.plan ? (
                    <Text selectable style={styles.planText}>
                      Plano: {safeText(clientPlanLabels[agendaClient.plan], "Nao informado")}
                    </Text>
                  ) : null}

                  <View style={styles.statusGroup}>
                    <Text style={styles.groupLabel}>Alterar status</Text>
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
                            <Text style={[styles.statusOptionText, selected && styles.statusOptionTextSelected]}>
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
                              <Text style={styles.employeeRoleText}>{safeText(employeeRoleLabels[employee.role], "Funcionario")}</Text>
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
      </ScrollView>
    </View>
  );
}

type FilterChipProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
};

function FilterChip({ label, selected, onPress }: FilterChipProps) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [styles.filterChip, selected && styles.filterChipSelected, pressed && styles.filterChipPressed]}
    >
      <Text style={[styles.filterChipText, selected && styles.filterChipTextSelected]}>{label}</Text>
    </Pressable>
  );
}

type InfoPillProps = {
  label: string;
  value: string;
};

function InfoPill({ label, value }: InfoPillProps) {
  return (
    <View style={styles.infoPill}>
      <Text style={styles.infoPillLabel}>{label}</Text>
      <Text selectable style={styles.infoPillValue}>
        {value}
      </Text>
    </View>
  );
}

function filterAgendaItems(
  items: AgendaItem[],
  activeSection: AgendaSectionId,
  employeeFilter: string,
  statusFilter: AgendaStatusFilter,
  dateFilter: string,
) {
  const normalizedDateFilter = normalizeSearch(dateFilter);

  return items.filter((item) => {
    if (!isItemInSection(item, activeSection)) {
      return false;
    }

    if (employeeFilter === "unassigned" && hasResponsible(item)) {
      return false;
    }

    if (employeeFilter !== "all" && employeeFilter !== "unassigned") {
      const responsibleId = item.assignedEmployeeId ?? item.funcionarioId ?? "";
      if (responsibleId !== employeeFilter) {
        return false;
      }
    }

    if (statusFilter === "late" && getVisualStatus(item) !== "late") {
      return false;
    }

    if (statusFilter !== "all" && statusFilter !== "late" && item.status !== statusFilter) {
      return false;
    }

    if (normalizedDateFilter && !normalizeSearch(formatAgendaDate(item.data ?? item.visitDate)).includes(normalizedDateFilter)) {
      return false;
    }

    return true;
  });
}

function getAgendaSectionCounts(items: AgendaItem[]): Record<AgendaSectionId, number> {
  return sectionOptions.reduce(
    (counts, section) => ({
      ...counts,
      [section]: items.filter((item) => isItemInSection(item, section)).length,
    }),
    {} as Record<AgendaSectionId, number>,
  );
}

function emptySectionCounts(): Record<AgendaSectionId, number> {
  return sectionOptions.reduce(
    (counts, section) => ({
      ...counts,
      [section]: 0,
    }),
    {} as Record<AgendaSectionId, number>,
  );
}

function isItemInSection(item: AgendaItem, section: AgendaSectionId) {
  if (section === "unassigned") {
    return !hasResponsible(item);
  }

  const visitDate = parseAgendaDate(item.data ?? item.visitDate);
  const today = startOfDay(new Date());
  const tomorrow = addDays(today, 1);
  const weekEnd = addDays(today, 6);

  if (section === "late") {
    return Boolean(visitDate && visitDate < today && item.status !== "finished");
  }

  if (!visitDate) {
    return section === "week";
  }

  if (section === "today") {
    return sameDay(visitDate, today);
  }

  if (section === "tomorrow") {
    return sameDay(visitDate, tomorrow);
  }

  return visitDate > tomorrow && visitDate <= weekEnd;
}

function sortAgendaItemsByDate(items: AgendaItem[]) {
  return [...items].sort((left, right) => {
    const leftDate = parseAgendaDate(left.data ?? left.visitDate)?.getTime() ?? Number.MAX_SAFE_INTEGER;
    const rightDate = parseAgendaDate(right.data ?? right.visitDate)?.getTime() ?? Number.MAX_SAFE_INTEGER;

    if (leftDate !== rightDate) {
      return leftDate - rightDate;
    }

    return safeText(left.clientName).localeCompare(safeText(right.clientName));
  });
}

function getVisualStatus(item: AgendaItem): AgendaStatus | "late" {
  const visitDate = parseAgendaDate(item.data ?? item.visitDate);

  if (visitDate && visitDate < startOfDay(new Date()) && item.status !== "finished") {
    return "late";
  }

  return item.status;
}

function getStatusTone(item: AgendaItem) {
  const visualStatus = getVisualStatus(item);

  if (visualStatus === "late") {
    return "rejected";
  }

  if (visualStatus === "finished") {
    return "completed";
  }

  if (visualStatus === "in-progress") {
    return "info";
  }

  return "pending";
}

function getVisualStatusLabel(item: AgendaItem) {
  const visualStatus = getVisualStatus(item);
  return visualStatus === "late" ? "Atrasada" : getAgendaStatusLabel(visualStatus);
}

function getAgendaStatusLabel(status: AgendaStatus) {
  return agendaStatusLabels[status] ?? "Pendente";
}

function formatAgendaDate(value?: string) {
  const date = parseAgendaDate(value);
  return date ? date.toLocaleDateString("pt-BR") : safeText(value, "Data nao informada");
}

function hasResponsible(item: AgendaItem) {
  return Boolean(item.assignedEmployeeId || item.funcionarioId || safeText(item.assignedEmployeeName));
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

function normalizeSearch(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
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

const sectionLabels: Record<AgendaSectionId, string> = {
  late: "Atrasadas",
  today: "Hoje",
  tomorrow: "Amanha",
  unassigned: "Sem responsavel",
  week: "Esta semana",
};

const statusFilterLabels: Record<AgendaStatusFilter, string> = {
  all: "Todos",
  finished: "Concluida",
  "in-progress": "Em andamento",
  late: "Atrasada",
  pending: "Pendente",
};

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
  addressBox: {
    backgroundColor: colors.input,
    borderColor: colors.border,
    borderRadius: 10,
    borderWidth: 1,
    gap: 4,
    padding: 12,
  },
  addressLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  agendaCard: {
    gap: 16,
  },
  agendaList: {
    gap: 12,
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
  employeeRoleText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: "800",
  },
  emptySectionCard: {
    padding: 14,
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
  filterChip: {
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    borderColor: "rgba(255, 255, 255, 0.12)",
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 13,
    paddingVertical: 9,
  },
  filterChipPressed: {
    opacity: 0.84,
  },
  filterChipSelected: {
    backgroundColor: "rgba(21, 101, 255, 0.3)",
    borderColor: colors.primaryLight,
  },
  filterChipText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: "900",
  },
  filterChipTextSelected: {
    color: colors.white,
  },
  filterChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  filterGroup: {
    gap: 10,
  },
  filtersCard: {
    gap: 16,
  },
  formMessage: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: "800",
    lineHeight: 20,
  },
  groupLabel: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  infoPill: {
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    borderColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 10,
    borderWidth: 1,
    flexGrow: 1,
    gap: 4,
    minWidth: 132,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  infoPillLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  infoPillValue: {
    color: colors.white,
    fontSize: 13,
    fontWeight: "900",
    lineHeight: 18,
  },
  itemHeaderButton: {
    alignItems: "flex-start",
    borderRadius: 10,
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
  },
  itemHeaderButtonPressed: {
    opacity: 0.86,
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
  root: {
    backgroundColor: colors.background,
    flex: 1,
  },
  sectionHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  sectionSubtitle: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "800",
    marginTop: 3,
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
    justifyContent: "center",
    minHeight: 42,
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
    gap: 14,
  },
  summaryLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  summaryMetric: {
    backgroundColor: colors.input,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    gap: 3,
    minWidth: 92,
    padding: 12,
  },
  summaryNumber: {
    color: colors.white,
    fontSize: 24,
    fontWeight: "900",
  },
  summaryRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
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
  tab: {
    alignItems: "center",
    backgroundColor: colors.input,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  tabCount: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "900",
  },
  tabPressed: {
    opacity: 0.86,
  },
  tabSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryLight,
  },
  tabText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: "900",
  },
  tabTextSelected: {
    color: colors.white,
  },
  tabs: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
});
