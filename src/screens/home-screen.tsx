import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";

import { AppCard } from "../components/app-card";
import { InfoCard } from "../components/info-card";
import { PrimaryButton } from "../components/primary-button";
import { StatusBadge } from "../components/status-badge";
import colors from "../theme/colors";
import { agendaStatusLabels, type AgendaItem } from "../types/agenda";

export type DashboardMetric = {
  helper?: string;
  id: string;
  label: string;
  tone?: string;
  value: string;
};

type HomeScreenProps = {
  agendaItems: AgendaItem[];
  canAccessFinance: boolean;
  dashboardMetrics: DashboardMetric[];
  onOpenClients: () => void;
  onOpenProducts: () => void;
  onOpenAttendance: () => void;
  onOpenHistory: () => void;
  onOpenAgenda: () => void;
  onOpenFinance: () => void;
  onOpenClientArea: () => void;
  onSwitchProfile: () => void;
  onLogout: () => void;
  profileLabel: string;
};

export function HomeScreen({
  agendaItems,
  canAccessFinance,
  dashboardMetrics,
  onOpenClients,
  onOpenProducts,
  onOpenAttendance,
  onOpenHistory,
  onOpenAgenda,
  onOpenFinance,
  onOpenClientArea,
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

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.content} contentInsetAdjustmentBehavior="automatic">
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.eyebrow}>Painel do tecnico</Text>
            <Text style={styles.title}>Agenda de manutencao</Text>
            <Text selectable style={styles.subtitle}>
              Modo de teste: {profileLabel}. Seus atendimentos e produtos estao organizados para teste.
            </Text>
          </View>
          <View style={styles.actionRow}>
            <PrimaryButton
              icon="+"
              onPress={onOpenClients}
              style={styles.headerButton}
              title="Clientes"
            />
            <PrimaryButton
              icon=">"
              onPress={onOpenProducts}
              style={styles.productsButton}
              title="Produtos Pendentes"
              variant="success"
            />
            <PrimaryButton
              icon=">"
              onPress={onOpenAttendance}
              style={styles.attendanceButton}
              title="Atendimento"
            />
            <PrimaryButton
              icon=">"
              onPress={onOpenAgenda}
              style={styles.headerButton}
              title="Agenda"
            />
            <PrimaryButton
              icon=">"
              onPress={onOpenHistory}
              style={styles.historyButton}
              title="Histórico"
              variant="success"
            />
            {canAccessFinance ? (
              <PrimaryButton
                icon=">"
                onPress={onOpenFinance}
                style={styles.financeButton}
                title="Financeiro"
              />
            ) : null}
            <PrimaryButton
              icon="~"
              onPress={onSwitchProfile}
              style={styles.clientAreaButton}
              title="Trocar Perfil"
            />
            <PrimaryButton
              icon="x"
              onPress={onLogout}
              style={styles.headerButton}
              title="Sair"
              variant="danger"
            />
          </View>
        </View>

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

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Piscinas do dia</Text>
            <Text style={styles.sectionCount}>{agendaItems.length} itens</Text>
          </View>

          <View style={styles.taskList}>
            {agendaItems.slice(0, 4).map((item) => (
              <AppCard key={item.id} style={styles.agendaCard}>
                <View style={styles.agendaHeader}>
                  <View style={styles.agendaText}>
                    <Text selectable style={styles.agendaClient}>
                      {item.clientName}
                    </Text>
                    <Text selectable style={styles.agendaDetail}>
                      {item.neighborhood} - {item.address}
                    </Text>
                  </View>
                  <StatusBadge
                    label={agendaStatusLabels[item.status]}
                    tone={item.status === "finished" ? "completed" : item.status === "pending" ? "pending" : "info"}
                  />
                </View>
              </AppCard>
            ))}
          </View>
        </View>

        <AppCard style={styles.summary} tone="success">
          <Text style={styles.summaryTitle}>Resumo rapido</Text>
          <Text selectable style={styles.summaryText}>
            Use a Agenda para iniciar atendimentos, o Financeiro para acompanhar recebimentos
            e a Area do Cliente para aprovar produtos faltando antes da entrega.
          </Text>
        </AppCard>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  actionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
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
  financeButton: {
    alignSelf: "flex-start",
    height: 44,
    paddingHorizontal: 18,
    width: 164,
  },
  content: {
    gap: 24,
    padding: 20,
    paddingTop: 28,
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
  headerButton: {
    alignSelf: "flex-start",
    height: 44,
    paddingHorizontal: 18,
    width: 132,
  },
  historyButton: {
    alignSelf: "flex-start",
    height: 44,
    paddingHorizontal: 18,
    width: 142,
  },
  productsButton: {
    alignSelf: "flex-start",
    height: 44,
    paddingHorizontal: 18,
    width: 202,
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
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
    fontSize: 31,
    fontWeight: "900",
    lineHeight: 37,
  },
});
