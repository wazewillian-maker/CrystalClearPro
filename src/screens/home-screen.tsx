import { ScrollView, StyleSheet, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";

import { AppCard } from "../components/app-card";
import { BrandFooter, BrandLogo } from "../components/brand";
import { InfoCard } from "../components/info-card";
import { PoolReferencePhoto } from "../components/pool-reference-photo";
import { PrimaryButton } from "../components/primary-button";
import { StatusBadge } from "../components/status-badge";
import colors from "../theme/colors";
import { agendaStatusLabels, type AgendaItem } from "../types/agenda";
import { clientPlanLabels, type Client } from "../types/client";

export type DashboardMetric = {
  helper?: string;
  id: string;
  label: string;
  tone?: string;
  value: string;
};

export type HomeCompletionSummary = {
  approvedProducts: number;
  completedAttendances: number;
  registeredPhotos: number;
  requestedProducts: number;
};

export type EmployeeSummary = {
  assigned: number;
  completed: number;
  employeeName: string;
  pending: number;
};

type HomeScreenProps = {
  agendaItems: AgendaItem[];
  canAccessAdmin: boolean;
  canAccessClients: boolean;
  canManageTeam: boolean;
  canAccessFinance: boolean;
  canOpenStandaloneAttendance?: boolean;
  canViewCommercialData: boolean;
  clients: Client[];
  completionSummary: HomeCompletionSummary;
  dashboardMetrics: DashboardMetric[];
  employeeSummaries: EmployeeSummary[];
  noticeMessage?: string;
  onOpenClients: () => void;
  onOpenProducts: () => void;
  onOpenAttendance: () => void;
  onOpenHistory: () => void;
  onOpenAgenda: () => void;
  onOpenAdmin: () => void;
  onOpenFinance: () => void;
  onOpenFirebaseDiagnostics: () => void;
  onOpenClientArea: () => void;
  onOpenTeam: () => void;
  onStartAttendance: (agendaItem: AgendaItem) => void;
  onSwitchProfile: () => void;
  onLogout: () => void;
  profileLabel: string;
};

export function HomeScreen({
  agendaItems,
  canAccessAdmin,
  canAccessClients,
  canManageTeam,
  canAccessFinance,
  canOpenStandaloneAttendance = true,
  canViewCommercialData,
  clients,
  completionSummary,
  dashboardMetrics,
  employeeSummaries,
  noticeMessage,
  onOpenClients,
  onOpenProducts,
  onOpenAttendance,
  onOpenHistory,
  onOpenAgenda,
  onOpenAdmin,
  onOpenFinance,
  onOpenFirebaseDiagnostics,
  onOpenClientArea,
  onOpenTeam,
  onStartAttendance,
  onSwitchProfile,
  onLogout,
  profileLabel,
}: HomeScreenProps) {
  const metricPressHandlers: Record<string, () => void> = {
    agenda: onOpenAgenda,
    "client-area": onOpenClientArea,
    completed: onOpenHistory,
    payments: onOpenFinance,
    products: onOpenProducts,
  };
  const orderedPendingAgendaItems = sortAgendaItemsByDate(agendaItems.filter((item) => item.status !== "finished"));
  const todayAgendaItems = orderedPendingAgendaItems.filter(isAgendaItemToday);
  const nextAgendaItem = orderedPendingAgendaItems[0];
  const nextAgendaClient = clients.find((client) => client.id === nextAgendaItem?.clientId || client.name === nextAgendaItem?.clientName);

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.content} contentInsetAdjustmentBehavior="automatic">
        <View style={styles.header}>
          <BrandLogo showSubtitle size="small" />
          <View style={styles.headerText}>
            <Text style={styles.eyebrow}>Resumo do dia</Text>
            <Text style={styles.title}>Ola, Willian 👋</Text>
            <Text selectable style={styles.subtitle}>
              Modo de teste: {profileLabel}. Resumo do dia e proximas visitas.
            </Text>
          </View>
        </View>

        {noticeMessage ? (
          <AppCard style={styles.noticeCard}>
            <Text selectable style={styles.noticeText}>
              {noticeMessage}
            </Text>
          </AppCard>
        ) : null}

        {nextAgendaItem ? (
          <AppCard style={styles.nextPoolCard}>
            <View style={styles.nextPoolImageWrap}>
              <PoolReferencePhoto size="banner" uri={nextAgendaClient?.referencePhotoUri} />
            </View>

            <View style={styles.nextPoolContent}>
              <View style={styles.nextPoolTopline}>
                <View style={styles.nextPoolTitleBlock}>
                  <Text style={styles.nextPoolEyebrow}>Proxima piscina</Text>
                  <Text selectable style={styles.nextPoolName}>
                    {safeText(nextAgendaItem.clientName, "Cliente nao encontrado")}
                  </Text>
                </View>
                <StatusBadge
                  label={getAgendaStatusLabel(nextAgendaItem.status)}
                  tone={nextAgendaItem.status === "pending" ? "pending" : "info"}
                />
              </View>

              <View style={styles.nextPoolDetails}>
                <Text selectable style={styles.nextPoolDetail}>
                  Bairro: {safeText(nextAgendaClient?.neighborhood || nextAgendaItem.neighborhood, "Bairro nao informado")}
                </Text>
                {nextAgendaClient?.address || nextAgendaItem.address ? (
                  <Text selectable style={styles.nextPoolDetail}>
                    Endereco: {safeText(nextAgendaClient?.address || nextAgendaItem.address, "Endereco nao informado")}
                  </Text>
                ) : null}
                {nextAgendaClient?.poolType ? (
                  <Text selectable style={styles.nextPoolDetail}>
                    Tipo da piscina: {safeText(nextAgendaClient.poolType)}
                  </Text>
                ) : null}
                {canViewCommercialData && nextAgendaClient?.plan ? (
                  <Text selectable style={styles.nextPoolDetail}>
                    Plano: {clientPlanLabels[nextAgendaClient.plan]}
                  </Text>
                ) : null}
                <Text selectable style={styles.nextPoolDetail}>
                  Data da visita: {safeText(nextAgendaItem.visitDate ?? nextAgendaItem.data, "Hoje")}
                </Text>
              </View>

              <PrimaryButton
                icon=">"
                onPress={() => onStartAttendance(nextAgendaItem)}
                style={styles.nextPoolButton}
                title="Iniciar atendimento"
              />
            </View>
          </AppCard>
        ) : (
          <AppCard style={styles.completionCard} tone="success">
            <Text style={styles.completionTitle}>
              Parabens! Todas as piscinas de hoje foram concluidas.
            </Text>
            <View style={styles.completionGrid}>
              <SummaryItem label="Atendimentos concluidos" value={completionSummary.completedAttendances} />
              <SummaryItem label="Produtos solicitados" value={completionSummary.requestedProducts} />
              <SummaryItem label="Produtos aprovados" value={completionSummary.approvedProducts} />
              <SummaryItem label="Fotos registradas" value={completionSummary.registeredPhotos} />
            </View>
          </AppCard>
        )}

        <View style={styles.metricsGrid}>
          {dashboardMetrics.map((metric) => (
            <InfoCard
              helper={metric.helper}
              key={metric.id}
              label={metric.label}
              onPress={metricPressHandlers[metric.id]}
              tone={metric.tone}
              value={metric.value}
            />
          ))}
        </View>

        {employeeSummaries.length > 0 ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Distribuicao da equipe</Text>
              <Text style={styles.sectionCount}>{employeeSummaries.length} membros</Text>
            </View>
            <View style={styles.employeeGrid}>
              {employeeSummaries.map((summary) => (
                <AppCard key={summary.employeeName} style={styles.employeeCard}>
                  <Text selectable style={styles.employeeName}>
                    {safeText(summary.employeeName, "Funcionario")}
                  </Text>
                  <View style={styles.employeeMetricRow}>
                    <SummaryItem label="Atribuidas" value={summary.assigned} />
                    <SummaryItem label="Pendentes" value={summary.pending} />
                    <SummaryItem label="Concluidas" value={summary.completed} />
                  </View>
                </AppCard>
              ))}
            </View>
          </View>
        ) : null}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Piscinas de hoje</Text>
            <Text style={styles.sectionCount}>{todayAgendaItems.length} itens</Text>
          </View>

          <View style={styles.taskList}>
            {todayAgendaItems.slice(0, 4).map((item, index) => {
              const agendaClient = clients.find((client) => client.id === item.clientId || client.name === item.clientName);
              const agendaItemKey = getAgendaItemKey(item, index);
              const locationText = `${safeText(item.neighborhood, "Bairro nao informado")} - ${safeText(
                item.address,
                "Endereco nao informado",
              )}`;
              const visitDateText = `Data: ${safeText(item.visitDate ?? item.data, "Hoje")}`;
              const planDateText =
                canViewCommercialData && agendaClient?.plan
                  ? `Plano: ${clientPlanLabels[agendaClient.plan]} - ${visitDateText}`
                  : visitDateText;

              return (
                <AppCard key={agendaItemKey} style={styles.agendaCard}>
                  <View style={styles.agendaHeader}>
                    <PoolReferencePhoto uri={agendaClient?.referencePhotoUri} />
                    <View style={styles.agendaText}>
                      <Text selectable style={styles.agendaClient}>
                        {safeText(item.clientName, "Cliente nao encontrado")}
                      </Text>
                      <Text selectable style={styles.agendaDetail}>
                        {locationText}
                      </Text>
                      <Text selectable style={styles.agendaDetail}>
                        {planDateText}
                      </Text>
                    </View>
                    <StatusBadge
                      label={getAgendaStatusLabel(item.status)}
                      tone={item.status === "finished" ? "completed" : item.status === "pending" ? "pending" : "info"}
                    />
                  </View>
                </AppCard>
              );
            })}
          </View>
        </View>

        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>Acoes principais</Text>
          <View style={styles.actionRow}>
            {canAccessClients ? (
              <PrimaryButton icon="+" onPress={onOpenClients} style={styles.headerButton} title="Clientes" />
            ) : null}
            <PrimaryButton
              icon=">"
              onPress={onOpenProducts}
              style={styles.productsButton}
              title="Produtos Pendentes"
              variant="success"
            />
            {canOpenStandaloneAttendance ? (
              <PrimaryButton
                icon=">"
                onPress={onOpenAttendance}
                style={styles.attendanceButton}
                title="Atendimento"
              />
            ) : null}
            <PrimaryButton icon=">" onPress={onOpenAgenda} style={styles.headerButton} title="Agenda" />
            <PrimaryButton
              icon=">"
              onPress={onOpenHistory}
              style={styles.historyButton}
              title="Historico"
              variant="success"
            />
            {canAccessFinance ? (
              <PrimaryButton icon=">" onPress={onOpenFinance} style={styles.financeButton} title="Financeiro" />
            ) : null}
            {canManageTeam ? (
              <PrimaryButton
                icon="+"
                onPress={canAccessAdmin ? onOpenAdmin : onOpenTeam}
                style={styles.headerButton}
                title="Funcionarios"
              />
            ) : null}
            {canAccessAdmin ? (
              <PrimaryButton
                icon=">"
                onPress={onOpenAdmin}
                style={styles.adminButton}
                title="Administração"
                variant="secondary"
              />
            ) : null}
            {canAccessAdmin ? (
              <PrimaryButton
                icon="~"
                onPress={onOpenFirebaseDiagnostics}
                style={styles.diagnosticsButton}
                title="Diagnostico Firebase"
                variant="secondary"
              />
            ) : null}
            <PrimaryButton icon="~" onPress={onSwitchProfile} style={styles.clientAreaButton} title="Trocar Perfil" />
            <PrimaryButton icon="x" onPress={onLogout} style={styles.headerButton} title="Sair" variant="danger" />
          </View>
        </View>

        <AppCard style={styles.summary} tone="success">
          <Text style={styles.summaryTitle}>Resumo rapido</Text>
          <Text selectable style={styles.summaryText}>
            Use a Agenda para iniciar atendimentos, o Financeiro para acompanhar recebimentos
            e a Area do Cliente para aprovar produtos faltando antes da entrega.
          </Text>
        </AppCard>

        <BrandFooter />
      </ScrollView>
    </View>
  );
}

function getAgendaItemKey(item: AgendaItem, index: number) {
  if (item.id) {
    return item.id;
  }

  return `${safeText(item.clientId ?? item.clientName, "agenda")}-${safeText(item.piscinaId, "pool")}-${safeText(
    item.data ?? item.visitDate,
    "date",
  )}-${index}`;
}

function SummaryItem({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.completionItem}>
      <Text style={styles.completionValue}>{value}</Text>
      <Text style={styles.completionLabel}>{label}</Text>
    </View>
  );
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

function getAgendaStatusLabel(status: AgendaItem["status"]) {
  return agendaStatusLabels[status] ?? "Pendente";
}

function sortAgendaItemsByDate(items: AgendaItem[]) {
  return [...items].sort((left, right) => {
    const leftTime = parseAgendaDate(left.data ?? left.visitDate)?.getTime() ?? Number.MAX_SAFE_INTEGER;
    const rightTime = parseAgendaDate(right.data ?? right.visitDate)?.getTime() ?? Number.MAX_SAFE_INTEGER;

    if (leftTime !== rightTime) {
      return leftTime - rightTime;
    }

    return safeText(left.clientName).localeCompare(safeText(right.clientName));
  });
}

function isAgendaItemToday(item: AgendaItem) {
  const visitDate = parseAgendaDate(item.data ?? item.visitDate);
  return Boolean(visitDate && visitDate.getTime() === startOfDay(new Date()).getTime());
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

const styles = StyleSheet.create({
  actionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  actionsSection: {
    gap: 14,
  },
  adminButton: {
    alignSelf: "flex-start",
    height: 44,
    paddingHorizontal: 18,
    width: 178,
  },
  agendaCard: {
    padding: 14,
  },
  agendaClient: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "900",
  },
  agendaDetail: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  agendaHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between",
  },
  agendaText: {
    flex: 1,
    gap: 5,
  },
  attendanceButton: {
    alignSelf: "flex-start",
    height: 44,
    paddingHorizontal: 18,
    width: 168,
  },
  clientAreaButton: {
    alignSelf: "flex-start",
    height: 44,
    paddingHorizontal: 18,
    width: 178,
  },
  completionCard: {
    backgroundColor: "rgba(13, 43, 77, 0.9)",
    gap: 18,
  },
  completionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  completionItem: {
    backgroundColor: colors.input,
    borderColor: colors.border,
    borderCurve: "continuous",
    borderRadius: 16,
    borderWidth: 1,
    flexBasis: 150,
    flexGrow: 1,
    gap: 5,
    padding: 14,
  },
  completionLabel: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 18,
  },
  completionTitle: {
    color: colors.white,
    fontFamily: "Poppins",
    fontSize: 22,
    fontWeight: "900",
    lineHeight: 28,
  },
  completionValue: {
    color: colors.white,
    fontSize: 28,
    fontWeight: "900",
  },
  content: {
    gap: 24,
    padding: 20,
    paddingTop: 28,
  },
  eyebrow: {
    color: colors.primaryLight,
    fontFamily: "Inter",
    fontSize: 13,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  employeeCard: {
    flexBasis: 220,
    flexGrow: 1,
    gap: 12,
  },
  employeeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  employeeMetricRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  employeeName: {
    color: colors.white,
    fontFamily: "Poppins",
    fontSize: 17,
    fontWeight: "900",
  },
  financeButton: {
    alignSelf: "flex-start",
    height: 44,
    paddingHorizontal: 18,
    width: 164,
  },
  diagnosticsButton: {
    alignSelf: "flex-start",
    height: 44,
    paddingHorizontal: 18,
    width: 214,
  },
  header: {
    alignItems: "flex-start",
    gap: 18,
  },
  headerButton: {
    alignSelf: "flex-start",
    height: 44,
    paddingHorizontal: 18,
    width: 132,
  },
  headerText: {
    gap: 8,
  },
  historyButton: {
    alignSelf: "flex-start",
    height: 44,
    paddingHorizontal: 18,
    width: 142,
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  nextPoolButton: {
    maxWidth: 260,
  },
  nextPoolCard: {
    backgroundColor: "rgba(13, 43, 77, 0.92)",
    borderColor: colors.border,
    boxShadow: "0 18px 40px rgba(0, 0, 0, 0.32)",
    gap: 16,
    overflow: "hidden",
    padding: 16,
  },
  nextPoolContent: {
    gap: 16,
  },
  nextPoolDetail: {
    color: colors.textSecondary,
    fontSize: 15,
    lineHeight: 22,
  },
  nextPoolDetails: {
    gap: 6,
  },
  nextPoolEyebrow: {
    color: colors.primaryLight,
    fontFamily: "Inter",
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  nextPoolImageWrap: {
    borderCurve: "continuous",
    borderRadius: 18,
    overflow: "hidden",
  },
  nextPoolName: {
    color: colors.white,
    fontFamily: "Poppins",
    fontSize: 26,
    fontWeight: "900",
    lineHeight: 31,
  },
  nextPoolTitleBlock: {
    flex: 1,
    gap: 5,
  },
  nextPoolTopline: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
  },
  noticeCard: {
    backgroundColor: "rgba(255, 193, 7, 0.12)",
    borderColor: "rgba(255, 193, 7, 0.35)",
  },
  noticeText: {
    color: colors.warning,
    fontSize: 14,
    fontWeight: "900",
    lineHeight: 20,
  },
  productsButton: {
    alignSelf: "flex-start",
    height: 44,
    paddingHorizontal: 18,
    width: 202,
  },
  root: {
    backgroundColor: colors.background,
    flex: 1,
  },
  section: {
    gap: 14,
  },
  sectionCount: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: "800",
  },
  sectionHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  sectionTitle: {
    color: colors.white,
    fontFamily: "Poppins",
    fontSize: 22,
    fontWeight: "900",
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 16,
    lineHeight: 23,
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
  taskList: {
    gap: 12,
  },
  title: {
    color: colors.white,
    fontFamily: "Poppins",
    fontSize: 31,
    fontWeight: "900",
    lineHeight: 37,
  },
});
