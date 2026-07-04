import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";

import { AppCard } from "../components/app-card";
import { PrimaryButton } from "../components/primary-button";
import { ScreenHeader } from "../components/screen-header";
import { StatusBadge } from "../components/status-badge";
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
        <ScreenHeader
          eyebrow="Agenda"
          onBack={onBack}
          subtitle="Organize as piscinas que precisam de atendimento hoje, sem horarios."
          title="Atendimentos do dia"
        />

        <AppCard style={styles.summary}>
          <Text style={styles.summaryTitle}>{pendingCount} atendimento(s) em aberto</Text>
          <Text selectable style={styles.summaryText}>
            Atualize o status conforme o trabalho avanca e inicie o atendimento pelo cliente.
          </Text>
        </AppCard>

        <View style={styles.agendaList}>
          {agendaItems.map((item) => (
            <AppCard key={item.id} style={styles.agendaCard}>
              <View style={styles.itemHeader}>
                <View style={styles.itemHeaderText}>
                  <Text selectable style={styles.clientName}>
                    {item.clientName}
                  </Text>
                  <Text selectable style={styles.neighborhood}>
                    {item.neighborhood}
                  </Text>
                </View>

                <StatusBadge label={agendaStatusLabels[item.status]} tone={getStatusTone(item.status)} />
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
            </AppCard>
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

const styles = StyleSheet.create({
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
  groupLabel: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "900",
    textTransform: "uppercase",
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
});
