import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";

import { PrimaryButton } from "../components/primary-button";
import colors from "../theme/colors";
import {
  agendaStatusLabels,
  type AgendaItem,
  type AgendaStatus,
} from "../types/agenda";

const statusOptions: AgendaStatus[] = ["pending", "in-progress", "finished"];

type AgendaScreenProps = {
  agendaItems: AgendaItem[];
  onBack: () => void;
  onStartAttendance: (agendaItem: AgendaItem) => void;
  onUpdateStatus: (agendaItemId: string, status: AgendaStatus) => void;
};

export function AgendaScreen({
  agendaItems,
  onBack,
  onStartAttendance,
  onUpdateStatus,
}: AgendaScreenProps) {
  const pendingCount = agendaItems.filter((item) => item.status !== "finished").length;

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.content} contentInsetAdjustmentBehavior="automatic">
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.eyebrow}>Agenda</Text>
            <Text style={styles.title}>Atendimentos do dia</Text>
            <Text selectable style={styles.subtitle}>
              Organize as piscinas que precisam de atendimento hoje, sem horarios.
            </Text>
          </View>

          <PrimaryButton
            onPress={onBack}
            style={styles.backButton}
            title="Voltar"
            variant="danger"
          />
        </View>

        <View style={styles.summary}>
          <Text style={styles.summaryTitle}>{pendingCount} atendimento(s) em aberto</Text>
          <Text selectable style={styles.summaryText}>
            Atualize o status conforme o trabalho avanca e inicie o atendimento pelo cliente.
          </Text>
        </View>

        <View style={styles.agendaList}>
          {agendaItems.map((item) => (
            <View key={item.id} style={styles.agendaCard}>
              <View style={styles.itemHeader}>
                <View style={styles.itemHeaderText}>
                  <Text selectable style={styles.clientName}>
                    {item.clientName}
                  </Text>
                  <Text selectable style={styles.neighborhood}>
                    {item.neighborhood}
                  </Text>
                </View>

                <View style={[styles.statusBadge, getStatusBadgeStyle(item.status)]}>
                  <Text style={styles.statusText}>{agendaStatusLabels[item.status]}</Text>
                </View>
              </View>

              <Text selectable style={styles.address}>
                {item.address}
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
                          {agendaStatusLabels[status]}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <PrimaryButton
                onPress={() => onStartAttendance(item)}
                style={styles.startButton}
                title="Iniciar atendimento"
                variant={item.status === "finished" ? "primary" : "success"}
              />
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

function getStatusBadgeStyle(status: AgendaStatus) {
  if (status === "finished") {
    return styles.statusFinished;
  }

  if (status === "in-progress") {
    return styles.statusInProgress;
  }

  return styles.statusPending;
}

const styles = StyleSheet.create({
  address: {
    color: colors.textSecondary,
    fontSize: 15,
    lineHeight: 22,
  },
  agendaCard: {
    backgroundColor: colors.card,
    borderColor: "rgba(255, 255, 255, 0.12)",
    borderRadius: 8,
    borderWidth: 1,
    gap: 16,
    padding: 16,
  },
  agendaList: {
    gap: 12,
  },
  backButton: {
    alignSelf: "flex-start",
    height: 44,
    paddingHorizontal: 18,
    width: 118,
  },
  clientName: {
    color: colors.white,
    fontSize: 19,
    fontWeight: "900",
    lineHeight: 25,
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
  groupLabel: {
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
  root: {
    backgroundColor: colors.background,
    flex: 1,
  },
  startButton: {
    height: 50,
  },
  statusBadge: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  statusFinished: {
    backgroundColor: "rgba(39, 174, 96, 0.28)",
    borderColor: "rgba(39, 174, 96, 0.6)",
  },
  statusGroup: {
    gap: 10,
  },
  statusInProgress: {
    backgroundColor: "rgba(46, 134, 222, 0.28)",
    borderColor: "rgba(46, 134, 222, 0.6)",
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
  statusPending: {
    backgroundColor: "rgba(243, 156, 18, 0.22)",
    borderColor: "rgba(243, 156, 18, 0.52)",
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
  title: {
    color: colors.white,
    fontSize: 31,
    fontWeight: "900",
    lineHeight: 37,
  },
});
