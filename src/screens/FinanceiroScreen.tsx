import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";

import { AppCard } from "../components/app-card";
import { PoolReferencePhoto } from "../components/pool-reference-photo";
import { PrimaryButton } from "../components/primary-button";
import { StatusBadge } from "../components/status-badge";
import colors from "../theme/colors";
import { clientPlanLabels, type Client } from "../types/client";
import type { PaymentStatuses } from "../types/finance";

type FinanceiroScreenProps = {
  clients: Client[];
  onBack: () => void;
  onMarkAsPaid: (clientId: string) => void;
  paymentStatuses: PaymentStatuses;
};

export function FinanceiroScreen({
  clients,
  onBack,
  onMarkAsPaid,
  paymentStatuses,
}: FinanceiroScreenProps) {
  const clientsWithValue = clients.filter(hasMonthlyValue);
  const totalToReceive = clientsWithValue.reduce((total, client) => total + client.valorMensal, 0);
  const totalReceived = clientsWithValue
    .filter((client) => getPaymentStatus(client.id, paymentStatuses) === "paid")
    .reduce((total, client) => total + client.valorMensal, 0);
  const totalPending = totalToReceive - totalReceived;

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.content} contentInsetAdjustmentBehavior="automatic">
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.eyebrow}>Financeiro</Text>
            <Text style={styles.title}>Cobranças mensais</Text>
            <Text selectable style={styles.subtitle}>
              Acompanhe os pagamentos dos clientes sem exibir dados bancarios.
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
          <FinanceMetric label="Total a receber" value={formatCurrency(totalToReceive)} />
          <FinanceMetric label="Total recebido" tone="success" value={formatCurrency(totalReceived)} />
          <FinanceMetric label="Total pendente" tone="warning" value={formatCurrency(totalPending)} />
        </View>

        {clients.length === 0 ? (
          <AppCard style={styles.emptyState}>
            <Text selectable style={styles.emptyTitle}>
              Nenhum cliente cadastrado para cobrança.
            </Text>
          </AppCard>
        ) : (
          <View style={styles.chargeList}>
            {clients.map((client) => {
              const isPaid = getPaymentStatus(client.id, paymentStatuses) === "paid";
              const monthlyValue = hasMonthlyValue(client)
                ? formatCurrency(client.valorMensal)
                : "Nao informado";
              const dueDay = hasDueDay(client) ? String(client.diaVencimento) : "Nao informado";

              return (
                <AppCard key={client.id} style={styles.chargeCard} tone={isPaid ? "success" : "default"}>
                  <View style={styles.chargeHeader}>
                    <PoolReferencePhoto uri={client.referencePhotoUri} />
                    <View style={styles.clientInfo}>
                      <Text selectable style={styles.clientName}>
                        {client.name}
                      </Text>
                      <Text selectable style={styles.neighborhood}>
                        {client.neighborhood}
                      </Text>
                    </View>

                    <StatusBadge label={isPaid ? "Pago" : "Pendente"} tone={isPaid ? "paid" : "pending"} />
                  </View>

                  <View style={styles.detailGroup}>
                    <DetailRow label="Plano de atendimento" value={clientPlanLabels[client.plan]} />
                    <DetailRow label="Valor mensal" value={monthlyValue} />
                    <DetailRow label="Dia de vencimento" value={dueDay} />
                  </View>

                  {!isPaid ? (
                    <PrimaryButton
                      onPress={() => onMarkAsPaid(client.id)}
                      style={styles.paidButton}
                      title="Marcar como Pago"
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
  tone?: "primary" | "success" | "warning";
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

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    currency: "BRL",
    style: "currency",
  }).format(value);
}

function getPaymentStatus(
  clientId: string,
  paymentStatuses: PaymentStatuses,
) {
  return paymentStatuses[clientId] ?? "pending";
}

function hasMonthlyValue(client: Client) {
  return typeof client.valorMensal === "number" && Number.isFinite(client.valorMensal);
}

function hasDueDay(client: Client) {
  return (
    typeof client.diaVencimento === "number" &&
    Number.isInteger(client.diaVencimento) &&
    client.diaVencimento >= 1 &&
    client.diaVencimento <= 31
  );
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
  chargeCardPaid: {
    backgroundColor: "rgba(39, 174, 96, 0.24)",
    borderColor: "rgba(39, 174, 96, 0.52)",
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
  statusBadge: {
    backgroundColor: "rgba(243, 156, 18, 0.22)",
    borderColor: "rgba(243, 156, 18, 0.52)",
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  statusBadgePaid: {
    backgroundColor: "rgba(39, 174, 96, 0.32)",
    borderColor: "rgba(39, 174, 96, 0.6)",
  },
  statusText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: "900",
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
