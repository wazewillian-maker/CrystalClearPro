import React, { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";

import { AppCard } from "../components/app-card";
import { PoolReferencePhoto } from "../components/pool-reference-photo";
import { PrimaryButton } from "../components/primary-button";
import { ScreenHeader } from "../components/screen-header";
import colors from "../theme/colors";
import {
  clientFrequencyLabels,
  clientPlanLabels,
  weekDayLabels,
  type Client,
} from "../types/client";
import { frequenciaSemanalLabels, planoAtendimentoLabels, type Piscina } from "../types/piscina";

type ClientDetailScreenProps = {
  client: Client;
  onBack: () => void;
  onAddPool: () => void;
  onDelete: () => void;
  onDeletePool: (poolId: string) => Promise<void> | void;
  onEdit: () => void;
  onEditPool: (poolId: string) => void;
  pools?: Piscina[];
};

export function ClientDetailScreen({
  client,
  onAddPool,
  onBack,
  onDelete,
  onDeletePool,
  onEdit,
  onEditPool,
  pools = [],
}: ClientDetailScreenProps) {
  const [confirmDeletePoolId, setConfirmDeletePoolId] = useState<string | null>(null);
  const [poolActionError, setPoolActionError] = useState("");
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
          <PoolReferencePhoto size="hero" uri={client.referencePhotoUri} />
          <ScreenHeader
            eyebrow="Ficha do cliente"
            onBack={onBack}
            subtitle={`${client.city} - ${client.neighborhood}`}
            title={client.name}
          />
          <View style={styles.actionRow}>
            <PrimaryButton
              onPress={() => undefined}
              style={styles.quickButton}
              title="Ligar"
              variant="secondary"
            />
            <PrimaryButton
              onPress={() => undefined}
              style={styles.quickButton}
              title="WhatsApp"
              variant="secondary"
            />
            <PrimaryButton
              onPress={() => undefined}
              style={styles.addressButton}
              title="Abrir endereco"
              variant="secondary"
            />
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
            <PrimaryButton
              onPress={onEdit}
              style={styles.photoButton}
              title="Atualizar Foto de Referencia"
            />
          </View>
        </View>

        <AppCard>
          <DetailRow label="Nome" value={client.name} />
          <DetailRow label="Telefone" value={client.phone} />
          <DetailRow label="E-mail" value={client.email || "Nao informado"} />
          <DetailRow label="Cidade" value={client.city} />
          <DetailRow label="Bairro" value={client.neighborhood} />
          <DetailRow label="Endereco" value={client.address} />
          <DetailRow label="Observacoes do cliente" value={client.notes || "Sem observacoes"} />
        </AppCard>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Piscinas vinculadas</Text>
          <PrimaryButton
            icon="+"
            onPress={onAddPool}
            style={styles.addPoolButton}
            title="Adicionar nova piscina"
          />
        </View>

        {pools.length > 0 ? (
          pools.map((pool) => (
            <PoolDetailCard
              confirmDelete={confirmDeletePoolId === pool.id}
              key={pool.id}
              clientName={client.name}
              onCancelDelete={() => setConfirmDeletePoolId(null)}
              onConfirmDelete={async () => {
                try {
                  setPoolActionError("");
                  await onDeletePool(pool.id);
                  setConfirmDeletePoolId(null);
                } catch (error) {
                  setPoolActionError(error instanceof Error ? error.message : "Nao foi possivel excluir a piscina.");
                }
              }}
              onDelete={() => setConfirmDeletePoolId(pool.id)}
              onEdit={() => onEditPool(pool.id)}
              pool={pool}
            />
          ))
        ) : (
          <AppCard>
            <DetailRow label="Piscina vinculada" value={client.poolName ?? "Piscina principal"} />
            <DetailRow label="Tipo da piscina" value={client.poolType || "Nao informado"} />
            <DetailRow
              label="Litros"
              value={
                typeof client.liters === "number" && Number.isFinite(client.liters)
                  ? String(client.liters)
                  : "Nao informado"
              }
            />
            <DetailRow label="Observacoes da piscina" value={client.poolNotes || "Sem observacoes"} />
          </AppCard>
        )}

        {poolActionError ? (
          <Text selectable style={styles.error}>
            {poolActionError}
          </Text>
        ) : null}

        <AppCard>
          <DetailRow label="Plano" value={clientPlanLabels[client.plan]} />
          <DetailRow label="Frequencia" value={clientFrequencyLabels[client.frequency]} />
          <DetailRow
            label="Dias da semana"
            value={selectedWeekDays || "Nenhum dia selecionado"}
          />
        </AppCard>

        <AppCard>
          <DetailRow label="Valor mensal da limpeza" value={monthlyValue} />
          <DetailRow label="Dia de vencimento" value={dueDay} />
        </AppCard>
      </ScrollView>
    </View>
  );
}

function PoolDetailCard({
  clientName,
  confirmDelete,
  onCancelDelete,
  onConfirmDelete,
  onDelete,
  onEdit,
  pool,
}: {
  clientName: string;
  confirmDelete: boolean;
  onCancelDelete: () => void;
  onConfirmDelete: () => void;
  onDelete: () => void;
  onEdit: () => void;
  pool: Piscina;
}) {
  return (
    <AppCard style={styles.poolCard}>
      <PoolReferencePhoto size="banner" uri={pool.fotoReferenciaUrl} />
      <DetailRow label="Cliente vinculado" value={clientName} />
      <DetailRow label="Piscina" value={pool.nome} />
      <DetailRow label="Tipo" value={pool.tipo || "Nao informado"} />
      <DetailRow
        label="Litros"
        value={typeof pool.litros === "number" && Number.isFinite(pool.litros) ? String(pool.litros) : "Nao informado"}
      />
      <DetailRow
        label="Plano"
        value={pool.planoAtendimento ? planoAtendimentoLabels[pool.planoAtendimento] : "Nao informado"}
      />
      <DetailRow label="Frequência" value={formatPoolFrequency(pool)} />
      <DetailRow label="Dias de atendimento" value={formatPoolSchedule(pool)} />
      <DetailRow label="Proxima visita prevista" value={formatNextVisit(pool)} />
      <DetailRow
        label="Valor mensal"
        value={typeof pool.valorMensal === "number" ? formatCurrency(pool.valorMensal) : "Nao informado"}
      />
      <DetailRow
        label="Vencimento"
        value={typeof pool.diaVencimento === "number" ? String(pool.diaVencimento) : "Nao informado"}
      />
      <DetailRow label="Observacoes" value={pool.observacoes || "Sem observacoes"} />
      <View style={styles.poolActions}>
        <PrimaryButton onPress={onEdit} style={styles.poolActionButton} title="Editar" variant="secondary" />
        <PrimaryButton onPress={onDelete} style={styles.poolActionButton} title="Excluir" variant="danger" />
      </View>
      {confirmDelete ? (
        <View style={styles.confirmBox}>
          <Text selectable style={styles.confirmText}>
            Tem certeza que deseja excluir esta piscina?{"\n"}Essa ação não poderá ser desfeita.
          </Text>
          <View style={styles.poolActions}>
            <PrimaryButton onPress={onConfirmDelete} style={styles.poolActionButton} title="Confirmar" variant="danger" />
            <PrimaryButton onPress={onCancelDelete} style={styles.poolActionButton} title="Cancelar" variant="secondary" />
          </View>
        </View>
      ) : null}
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

function formatPoolSchedule(pool: Piscina) {
  if (pool.planoAtendimento === "mensal") {
    const day = pool.diaMensal ?? pool.diaMesAtendimento;
    return day ? `Dia ${day} de cada mes` : "Dia do mes nao informado";
  }

  if (pool.planoAtendimento === "avulso") {
    return pool.dataAvulsa || pool.dataAtendimentoAvulso || "Data nao informada";
  }

  const days = pool.diasAtendimento?.map((day) => weekDayLabels[day]).join(", ");
  return days || "Nenhum dia selecionado";
}

function formatNextVisit(pool: Piscina) {
  if (pool.planoAtendimento === "avulso") {
    return pool.dataAvulsa || pool.dataAtendimentoAvulso || "Nao informada";
  }

  if (pool.planoAtendimento === "mensal") {
    const day = pool.diaMensal ?? pool.diaMesAtendimento;
    return day ? `Proximo dia ${day}` : "Nao informada";
  }

  const days = pool.diasAtendimento?.map((day) => weekDayLabels[day]).join(", ");
  return days ? `Proximo atendimento em: ${days}` : "Nao informada";
}

function formatPoolFrequency(pool: Piscina) {
  if (pool.planoAtendimento === "mensal") {
    return "Mensal";
  }

  if (pool.planoAtendimento === "avulso") {
    return "Avulso";
  }

  if (pool.planoAtendimento === "todo_dia") {
    return frequenciaSemanalLabels[7];
  }

  return pool.frequenciaSemanal ? frequenciaSemanalLabels[pool.frequenciaSemanal] : "Nao informada";
}

const styles = StyleSheet.create({
  actionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  addPoolButton: {
    alignSelf: "flex-start",
    height: 44,
    paddingHorizontal: 18,
    width: 210,
  },
  addressButton: {
    alignSelf: "flex-start",
    height: 44,
    paddingHorizontal: 18,
    width: 168,
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
  confirmBox: {
    backgroundColor: "rgba(231, 76, 60, 0.12)",
    borderColor: "rgba(231, 76, 60, 0.38)",
    borderRadius: 8,
    borderWidth: 1,
    gap: 12,
    padding: 14,
  },
  confirmText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "800",
    lineHeight: 20,
  },
  error: {
    backgroundColor: "rgba(231, 76, 60, 0.18)",
    borderColor: "rgba(231, 76, 60, 0.44)",
    borderRadius: 8,
    borderWidth: 1,
    color: colors.white,
    fontSize: 14,
    fontWeight: "800",
    lineHeight: 20,
    padding: 14,
  },
  editButton: {
    alignSelf: "flex-start",
    height: 44,
    paddingHorizontal: 18,
    width: 154,
  },
  photoButton: {
    alignSelf: "flex-start",
    height: 44,
    paddingHorizontal: 18,
    width: 248,
  },
  poolCard: {
    gap: 14,
  },
  poolActionButton: {
    alignSelf: "flex-start",
    height: 44,
    paddingHorizontal: 18,
    width: 132,
  },
  poolActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  quickButton: {
    alignSelf: "flex-start",
    height: 44,
    paddingHorizontal: 18,
    width: 132,
  },
  header: {
    alignItems: "flex-start",
    gap: 18,
  },
  root: {
    backgroundColor: colors.background,
    flex: 1,
  },
  sectionHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    justifyContent: "space-between",
  },
  sectionTitle: {
    color: colors.white,
    fontSize: 20,
    fontWeight: "900",
  },
});
