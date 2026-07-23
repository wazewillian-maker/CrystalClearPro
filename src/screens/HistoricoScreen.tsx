import { useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";

import { PoolReferencePhoto } from "../components/pool-reference-photo";
import { PrimaryButton } from "../components/primary-button";
import colors from "../theme/colors";
import type { AttendanceRecord } from "../types/attendance";
import type { Client } from "../types/client";
import { formatLocalDateTime } from "../utils/local-date";

type HistoricoScreenProps = {
  attendances: AttendanceRecord[];
  clients: Client[];
  onBack: () => void;
};

export function HistoricoScreen({ attendances, clients, onBack }: HistoricoScreenProps) {
  const [selectedAttendanceId, setSelectedAttendanceId] = useState<string | null>(null);
  const safeAttendances = Array.isArray(attendances) ? attendances : [];
  const safeClients = Array.isArray(clients) ? clients : [];
  const selectedAttendance = safeAttendances.find(
    (attendance) => attendance.id === selectedAttendanceId,
  );

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.content} contentInsetAdjustmentBehavior="automatic">
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.eyebrow}>Atendimentos</Text>
            <Text style={styles.title}>Histórico de Atendimentos</Text>
            <Text selectable style={styles.subtitle}>
              Consulte os atendimentos finalizados e os registros de fotos.
            </Text>
          </View>

          <PrimaryButton
            onPress={selectedAttendance ? () => setSelectedAttendanceId(null) : onBack}
            style={styles.backButton}
            title="Voltar"
            variant="danger"
          />
        </View>

        {selectedAttendance ? (
          <AttendanceDetail
            attendance={selectedAttendance}
            client={safeClients.find((client) => client.id === selectedAttendance.clienteId || client.name === selectedAttendance.clientName)}
          />
        ) : safeAttendances.length > 0 ? (
          <View style={styles.attendanceList}>
            {safeAttendances.map((attendance) => (
              <Pressable
                accessibilityLabel={`Abrir atendimento de ${attendance.clientName}`}
                accessibilityRole="button"
                key={attendance.id}
                onPress={() => setSelectedAttendanceId(attendance.id)}
                style={({ pressed }) => [styles.attendanceCard, pressed && styles.cardPressed]}
              >
                <View style={styles.attendanceHeader}>
                  <PoolReferencePhoto
                    uri={safeClients.find((client) => client.id === attendance.clienteId || client.name === attendance.clientName)?.referencePhotoUri}
                  />
                  <View style={styles.attendanceHeaderText}>
                    <Text selectable style={styles.clientName}>
                      {attendance.clientName}
                    </Text>
                    <Text selectable style={styles.dateText}>
                      {attendance.attendanceDate}
                    </Text>
                  </View>
                  <Text style={styles.openHint}>Abrir</Text>
                </View>

                <Text selectable style={styles.summaryText}>
                  {(attendance.completedItems ?? []).length} item(ns) do checklist realizado(s).
                </Text>
                <Text selectable style={styles.summaryText}>
                  Produtos: {attendance.productsUsed || "Sem produtos registrados"}
                </Text>
                {attendance.employeeName ? (
                  <Text selectable style={styles.summaryText}>
                    Atendido por: {attendance.employeeName}
                  </Text>
                ) : null}
              </Pressable>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text selectable style={styles.emptyTitle}>
              Nenhum atendimento finalizado ainda.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

type AttendanceDetailProps = {
  attendance: AttendanceRecord;
  client?: Client;
};

function AttendanceDetail({ attendance, client }: AttendanceDetailProps) {
  const completedItems = Array.isArray(attendance.completedItems) ? attendance.completedItems : [];
  const missingProducts = Array.isArray(attendance.missingProducts) ? attendance.missingProducts : [];

  return (
    <View style={styles.detailContent}>
      <PoolReferencePhoto size="banner" uri={client?.referencePhotoUri} />
      <View style={styles.attendanceCard}>
        <Text selectable style={styles.clientName}>
          {attendance.clientName}
        </Text>
        <DetailRow label="Data do atendimento" value={attendance.attendanceDate} />
        <DetailRow
          label="Concluido em"
          value={formatLocalDateTime(attendance.completedAt) || "Data e hora nao informadas"}
        />
        <DetailRow label="Piscina" value={attendance.poolName ?? "Piscina nao encontrada"} />
        <DetailRow label="Atendido por" value={attendance.employeeName ?? "Nao informado"} />
        <DetailRow label="pH" value={attendance.ph || "Nao informado"} />
        <DetailRow label="Cloro" value={attendance.chlorine || "Nao informado"} />
        <DetailRow
          label="Checklist realizado"
          value={
            completedItems.length > 0
              ? completedItems.join(", ")
              : "Nenhum item marcado"
          }
        />
        <DetailRow
          label="Produtos utilizados"
          value={attendance.productsUsed || "Sem produtos registrados"}
        />
        <DetailRow
          label="Produtos faltando"
          value={
            missingProducts.length > 0
              ? missingProducts
                  .map(
                    (item) =>
                      `${item.product} (${item.quantity})${
                        item.observation ? ` - ${item.observation}` : ""
                      }`,
                  )
                  .join(", ")
              : "Nenhum produto faltando"
          }
        />
        <DetailRow
          label="Observacoes"
          value={attendance.observations || "Sem observacoes"}
        />
      </View>

      <PhotoCard label="Foto do antes" uri={attendance.beforePhotoUri} />
      <PhotoCard label="Foto do depois" uri={attendance.afterPhotoUri} />
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

type PhotoCardProps = {
  label: string;
  uri: string;
};

function PhotoCard({ label, uri }: PhotoCardProps) {
  const hasRealPhoto = uri && !uri.includes("placeholder");

  return (
    <View style={styles.photoCard}>
      <Text style={styles.groupTitle}>{label}</Text>
      {hasRealPhoto ? (
        <Image accessibilityLabel={label} source={{ uri }} style={styles.photo} />
      ) : (
        <View style={styles.emptyPhoto}>
          <Text selectable style={styles.emptyPhotoText}>
            Foto nao registrada
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  attendanceCard: {
    backgroundColor: colors.card,
    borderColor: "rgba(255, 255, 255, 0.12)",
    borderRadius: 8,
    borderWidth: 1,
    gap: 12,
    padding: 16,
  },
  attendanceHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
  },
  attendanceHeaderText: {
    flex: 1,
    gap: 5,
  },
  attendanceList: {
    gap: 12,
  },
  backButton: {
    alignSelf: "flex-start",
    height: 44,
    paddingHorizontal: 18,
    width: 118,
  },
  cardPressed: {
    opacity: 0.86,
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
  dateText: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: "800",
  },
  detailContent: {
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
  emptyPhoto: {
    alignItems: "center",
    backgroundColor: colors.input,
    borderRadius: 8,
    height: 140,
    justifyContent: "center",
    width: "100%",
  },
  emptyPhotoText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: "800",
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
  groupTitle: {
    color: colors.white,
    fontSize: 18,
    fontWeight: "900",
  },
  header: {
    alignItems: "flex-start",
    gap: 18,
  },
  headerText: {
    gap: 8,
  },
  openHint: {
    color: colors.white,
    fontSize: 13,
    fontWeight: "900",
  },
  photo: {
    backgroundColor: colors.input,
    borderRadius: 8,
    height: 220,
    width: "100%",
  },
  photoCard: {
    backgroundColor: colors.card,
    borderColor: "rgba(255, 255, 255, 0.12)",
    borderRadius: 8,
    borderWidth: 1,
    gap: 12,
    padding: 16,
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
  summaryText: {
    color: colors.textSecondary,
    fontSize: 15,
    lineHeight: 22,
  },
  title: {
    color: colors.white,
    fontSize: 31,
    fontWeight: "900",
    lineHeight: 37,
  },
});
