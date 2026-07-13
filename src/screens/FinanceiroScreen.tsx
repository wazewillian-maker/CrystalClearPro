import { ScrollView, StyleSheet, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";

import { AppCard } from "../components/app-card";
import { PoolReferencePhoto } from "../components/pool-reference-photo";
import { PrimaryButton } from "../components/primary-button";
import { StatusBadge } from "../components/status-badge";
import colors from "../theme/colors";
import { clientPlanLabels, type Client } from "../types/client";
import type { PaymentStatus, PaymentStatuses } from "../types/finance";

type FinanceiroScreenProps = {
  clients: Client[];
  onBack: () => void;
  onMarkAsPaid: (clientId: string) => void;
  paymentStatuses: PaymentStatuses;
};

type FinancialClient = {
  client: Client;
  dueDayLabel: string;
  monthlyValue: number;
  monthlyValueLabel: string;
  status: PaymentStatus;
};

const paymentStatusLabels: Record<PaymentStatus, string> = {
  overdue: "Em atraso",
  paid: "Pago",
  pending: "Pendente",
};

export function FinanceiroScreen({
  clients,
  onBack,
  onMarkAsPaid,
  paymentStatuses,
}: FinanceiroScreenProps) {
  const safeClients = Array.isArray(clients) ? clients : [];
  const financialClients = safeClients.map((client) => toFinancialClient(client, paymentStatuses));
  const totalReceived = financialClients
    .filter((item) => item.status === "paid")
    .reduce((total, item) => total + item.monthlyValue, 0);
  const totalPending = financialClients
    .filter((item) => item.status !== "paid")
    .reduce((total, item) => total + item.monthlyValue, 0);
  const overdueCount = financialClients.filter((item) => item.status === "overdue").length;

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.content} contentInsetAdjustmentBehavior="automatic">
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.eyebrow}>Financeiro</Text>
            <Text style={styles.title}>Cobrancas mensais</Text>
            <Text selectable style={styles.subtitle}>
              Acompanhe pagamentos, pendencias e atrasos dos clientes ativos.
            </Text>
          </View>

          <PrimaryButton
            onPress={onBack}
            style={styles.backButton}
            title="Voltar"
            variant="secondary"
          />
        </View>

        <View style={styles.metricsGrid}>
          <FinanceMetric label="Recebido no mes" tone="success" value={formatCurrency(totalReceived)} />
          <FinanceMetric label="Total pendente" tone="warning" value={formatCurrency(totalPending)} />
          <FinanceMetric label="Clientes em atraso" tone="danger" value={String(overdueCount)} />
          <FinanceMetric label="Clientes ativos" value={String(safeClients.length)} />
        </View>

        {safeClients.length === 0 ? (
          <AppCard style={styles.emptyState}>
            <Text selectable style={styles.emptyTitle}>
              Nenhum cliente cadastrado para cobranca.
            </Text>
          </AppCard>
        ) : (
          <View style={styles.chargeList}>
            {financialClients.map(({ client, dueDayLabel, monthlyValueLabel, status }) => {
              const isPaid = status === "paid";

              return (
                <AppCard key={client.id} style={styles.chargeCard} tone={getCardTone(status)}>
                  <View style={styles.chargeHeader}>
                    <PoolReferencePhoto uri={client.referencePhotoUri} />
                    <View style={styles.clientInfo}>
                      <Text selectable style={styles.clientName}>
                        {safeText(client.name, "Cliente sem nome")}
                      </Text>
                      <Text selectable style={styles.neighborhood}>
                        {safeText(client.neighborhood, "Bairro nao informado")}
                      </Text>
                    </View>

                    <StatusBadge label={paymentStatusLabels[status]} tone={getPaymentStatusTone(status)} />
                  </View>

                  <View style={styles.detailGroup}>
                    <DetailRow label="Plano de atendimento" value={clientPlanLabels[client.plan] ?? "Nao informado"} />
                    <DetailRow label="Valor mensal" value={monthlyValueLabel} />
                    <DetailRow label="Dia de vencimento" value={dueDayLabel} />
                    <DetailRow label="Status financeiro" value={paymentStatusLabels[status]} />
                  </View>

                  {!isPaid ? (
                    <PrimaryButton
                      onPress={() => onMarkAsPaid(client.id)}
                      style={styles.paidButton}
                      title="Marcar como recebido"
                      variant="success"
                    />
                  ) : null}
                </AppCard>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

type FinanceMetricProps = {
  label: string;
  value: string;
  tone?: "danger" | "primary" | "success" | "warning";
};

function FinanceMetric({ label, value, tone = "primary" }: FinanceMetricProps) {
  return (
    <AppCard style={[styles.metricCard, styles[`${tone}Metric`]]}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text selectable style={styles.metricValue}>
        {value}
      </Text>
    </AppCard>
  );
}

type DetailRowProps = {
  label: string;
  value: string;
};

function DetailRow({ label, value }: DetailRowProps) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text selectable style={styles.detailValue}>
        {value}
      </Text>
    </View>
  );
}

function toFinancialClient(client: Client, paymentStatuses: PaymentStatuses): FinancialClient {
  const monthlyValue = hasMonthlyValue(client) ? client.valorMensal : 0;

  return {
    client,
    dueDayLabel: hasDueDay(client) ? String(client.diaVencimento) : "Nao informado",
    monthlyValue,
    monthlyValueLabel: hasMonthlyValue(client) ? formatCurrency(client.valorMensal) : "Nao informado",
    status: getPaymentStatus(client, paymentStatuses),
  };
}

function getPaymentStatus(client: Client, paymentStatuses: PaymentStatuses): PaymentStatus {
  const storedStatus = paymentStatuses[client.id];

  if (storedStatus === "paid") {
    return "paid";
  }

  if (storedStatus === "overdue") {
    return "overdue";
  }

  return isClientOverdue(client) ? "overdue" : "pending";
}

function getPaymentStatusTone(status: PaymentStatus) {
  if (status === "paid") {
    return "paid";
  }

  if (status === "overdue") {
    return "rejected";
  }

  return "pending";
}

function getCardTone(status: PaymentStatus) {
  if (status === "paid") {
    return "success";
  }

  if (status === "overdue") {
    return "warning";
  }

  return "default";
}

function formatCurrency(value: number) {
  const safeValue = Number.isFinite(value) ? value : 0;

  return new Intl.NumberFormat("pt-BR", {
    currency: "BRL",
    style: "currency",
  }).format(safeValue);
}

function hasMonthlyValue(client: Client) {
  return typeof client.valorMensal === "number" && Number.isFinite(client.valorMensal) && client.valorMensal > 0;
}

function hasDueDay(client: Client) {
  return (
    typeof client.diaVencimento === "number" &&
    Number.isInteger(client.diaVencimento) &&
    client.diaVencimento >= 1 &&
    client.diaVencimento <= 31
  );
}

function isClientOverdue(client: Client) {
  if (!hasDueDay(client) || !hasMonthlyValue(client)) {
    return false;
  }

  return new Date().getDate() > client.diaVencimento;
}

function safeText(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value : fallback;
}

const styles = StyleSheet.create({
  backButton: {
    alignSelf: "flex-start",
    height: 44,
    paddingHorizontal: 18,
    width: 118,
  },
  chargeCard: {
    backgroundColor: colors.card,
    borderColor: "rgba(255, 255, 255, 0.12)",
    borderRadius: 8,
    borderWidth: 1,
    gap: 16,
    padding: 16,
  },
  chargeHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
  },
  chargeList: {
    gap: 12,
  },
  clientInfo: {
    flex: 1,
    gap: 4,
  },
  clientName: {
    color: colors.white,
    fontSize: 18,
    fontWeight: "900",
    lineHeight: 24,
  },
  content: {
    gap: 24,
    padding: 20,
    paddingTop: 28,
  },
  dangerMetric: {
    backgroundColor: "rgba(231, 76, 60, 0.2)",
  },
  detailGroup: {
    gap: 12,
  },
  detailLabel: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  detailRow: {
    gap: 5,
  },
  detailValue: {
    color: colors.textSecondary,
    fontSize: 16,
    lineHeight: 23,
  },
  emptyState: {
    alignItems: "center",
    backgroundColor: colors.card,
    borderColor: "rgba(255, 255, 255, 0.12)",
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 220,
    padding: 24,
  },
  emptyTitle: {
    color: colors.textSecondary,
    fontSize: 17,
    fontWeight: "800",
    textAlign: "center",
  },
  eyebrow: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  header: {
    alignItems: "flex-start",
    gap: 18,
  },
  headerText: {
    gap: 8,
  },
  metricCard: {
    backgroundColor: "rgba(46, 134, 222, 0.22)",
    borderColor: "rgba(255, 255, 255, 0.12)",
    borderRadius: 8,
    borderWidth: 1,
    flexBasis: 160,
    flexGrow: 1,
    gap: 8,
    padding: 16,
  },
  metricLabel: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  metricValue: {
    color: colors.white,
    fontSize: 22,
    fontWeight: "900",
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  neighborhood: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: "800",
  },
  paidButton: {
    height: 48,
  },
  primaryMetric: {
    backgroundColor: "rgba(46, 134, 222, 0.22)",
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
  successMetric: {
    backgroundColor: "rgba(39, 174, 96, 0.2)",
  },
  title: {
    color: colors.white,
    fontSize: 31,
    fontWeight: "900",
    lineHeight: 37,
  },
  warningMetric: {
    backgroundColor: "rgba(243, 156, 18, 0.2)",
  },
});
