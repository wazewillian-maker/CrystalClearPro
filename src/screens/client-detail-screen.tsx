import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";

import { PrimaryButton } from "../components/primary-button";
import colors from "../theme/colors";
import {
  clientFrequencyLabels,
  clientPlanLabels,
  weekDayLabels,
  type Client,
} from "../types/client";

type ClientDetailScreenProps = {
  client: Client;
  onBack: () => void;
  onDelete: () => void;
  onEdit: () => void;
};

export function ClientDetailScreen({ client, onBack, onDelete, onEdit }: ClientDetailScreenProps) {
  const selectedWeekDays = client.weekDays.map((day) => weekDayLabels[day]).join(", ");
  const monthlyValue =
    typeof client.valorMensal === "number" && Number.isFinite(client.valorMensal)
      ? formatCurrency(client.valorMensal)
      : "Nao informado";
  const dueDay =
    typeof client.diaVencimento === "number" && Number.isFinite(client.diaVencimento)
      ? String(client.diaVencimento)
      : "Nao informado";

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.content} contentInsetAdjustmentBehavior="automatic">
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.eyebrow}>Ficha do cliente</Text>
            <Text selectable style={styles.title}>
              {client.name}
            </Text>
            <Text selectable style={styles.subtitle}>
              {client.city} - {client.neighborhood}
            </Text>
          </View>

          <PrimaryButton
            onPress={onBack}
            style={styles.backButton}
            title="Voltar"
            variant="danger"
          />

          <View style={styles.actionRow}>
            <PrimaryButton
              onPress={onEdit}
              style={styles.editButton}
              title="Editar cliente"
              variant="success"
            />
            <PrimaryButton
              onPress={onDelete}
              style={styles.deleteButton}
              title="Excluir cliente"
              variant="danger"
            />
          </View>
        </View>

        <View style={styles.card}>
          <DetailRow label="Nome" value={client.name} />
          <DetailRow label="Telefone" value={client.phone} />
          <DetailRow label="Cidade" value={client.city} />
          <DetailRow label="Bairro" value={client.neighborhood} />
          <DetailRow label="Endereco" value={client.address} />
          <DetailRow label="Tipo da piscina" value={client.poolType || "Nao informado"} />
          <DetailRow
            label="Litros"
            value={
              typeof client.liters === "number" && Number.isFinite(client.liters)
                ? String(client.liters)
                : "Nao informado"
            }
          />
          <DetailRow label="Observacoes" value={client.notes || "Sem observacoes"} />
        </View>

        <View style={styles.card}>
          <DetailRow label="Plano" value={clientPlanLabels[client.plan]} />
          <DetailRow label="Frequencia" value={clientFrequencyLabels[client.frequency]} />
          <DetailRow
            label="Dias da semana"
            value={selectedWeekDays || "Nenhum dia selecionado"}
          />
        </View>

        <View style={styles.card}>
          <DetailRow label="Valor mensal da limpeza" value={monthlyValue} />
          <DetailRow label="Dia de vencimento" value={dueDay} />
        </View>
      </ScrollView>
    </View>
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

const styles = StyleSheet.create({
  actionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
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
    gap: 14,
    padding: 18,
  },
  content: {
    gap: 24,
    padding: 20,
    paddingTop: 28,
  },
  deleteButton: {
    alignSelf: "flex-start",
    height: 44,
    paddingHorizontal: 18,
    width: 154,
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
    color: colors.white,
    fontSize: 16,
    lineHeight: 23,
  },
  editButton: {
    alignSelf: "flex-start",
    height: 44,
    paddingHorizontal: 18,
    width: 154,
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
  root: {
    backgroundColor: colors.background,
    flex: 1,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 16,
    lineHeight: 23,
  },
  title: {
    color: colors.white,
    fontSize: 31,
    fontWeight: "900",
    lineHeight: 37,
  },
});
