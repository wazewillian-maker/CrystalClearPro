import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";

import { InfoCard } from "../components/info-card";
import { MaintenanceCard } from "../components/maintenance-card";
import { PrimaryButton } from "../components/primary-button";
import { dashboardMetrics, maintenanceTasks } from "../data/mock-dashboard";
import colors from "../theme/colors";

type HomeScreenProps = {
  onOpenClients: () => void;
  onOpenProducts: () => void;
  onOpenAttendance: () => void;
  onOpenHistory: () => void;
  onOpenAgenda: () => void;
  onOpenFinance: () => void;
  onOpenStock: () => void;
  onLogout: () => void;
};

export function HomeScreen({
  onOpenClients,
  onOpenProducts,
  onOpenAttendance,
  onOpenHistory,
  onOpenAgenda,
  onOpenFinance,
  onOpenStock,
  onLogout,
}: HomeScreenProps) {
  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.content} contentInsetAdjustmentBehavior="automatic">
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.eyebrow}>Painel do tecnico</Text>
            <Text style={styles.title}>Agenda de manutencao</Text>
            <Text selectable style={styles.subtitle}>
              Ola, Marina. Seus atendimentos de hoje ja estao organizados por prioridade.
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
              title="Produtos"
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
            <PrimaryButton
              icon=">"
              onPress={onOpenFinance}
              style={styles.financeButton}
              title="Financeiro"
            />
            <PrimaryButton
              icon=">"
              onPress={onOpenStock}
              style={styles.headerButton}
              title="Estoque"
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
              tone={metric.tone}
              value={metric.value}
            />
          ))}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Proximos servicos</Text>
            <Text style={styles.sectionCount}>{maintenanceTasks.length} itens</Text>
          </View>

          <View style={styles.taskList}>
            {maintenanceTasks.map((task) => (
              <MaintenanceCard key={task.id} task={task} />
            ))}
          </View>
        </View>

        <View style={styles.summary}>
          <Text style={styles.summaryTitle}>Resumo rapido</Text>
          <Text selectable style={styles.summaryText}>
            Priorize o Condominio Lago Azul pela baixa concentracao de cloro. Os demais
            atendimentos seguem dentro da janela planejada.
          </Text>
        </View>
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
  attendanceButton: {
    alignSelf: "flex-start",
    height: 44,
    paddingHorizontal: 18,
    width: 168,
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
    width: 142,
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
    backgroundColor: "rgba(39, 174, 96, 0.18)",
    borderColor: "rgba(39, 174, 96, 0.44)",
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
