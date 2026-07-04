import React, { useMemo, useRef, useState } from "react";
import {
  Animated,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";

import { PrimaryButton } from "../components/primary-button";
import colors from "../theme/colors";
import type { AttendanceRecord } from "../types/attendance";
import type { Client } from "../types/client";
import type { PaymentStatus } from "../types/finance";
import type {
  ProductRequest,
  ProductRequestItem,
  ProductRequestItemStatus,
  ProductRequestStatus,
} from "../types/product-request";

type ClienteAreaScreenProps = {
  attendances: AttendanceRecord[];
  backButtonTitle?: string;
  client: Client;
  onBack: () => void;
  onSetAllItemsStatus: (
    requestId: string,
    status: Extract<ProductRequestItemStatus, "approved" | "rejected">,
  ) => void;
  onSetItemStatus: (
    requestId: string,
    itemId: string,
    status: Extract<ProductRequestItemStatus, "approved" | "rejected">,
  ) => void;
  paymentStatus: PaymentStatus;
  productRequests: ProductRequest[];
};

type ClientProductItem = {
  item: ProductRequestItem;
  request: ProductRequest;
};

const requestStatusLabels: Record<ProductRequestStatus, string> = {
  approved: "Aprovado",
  "partially-approved": "Parcialmente aprovado",
  "pending-approval": "Pendente de aprovacao",
  rejected: "Recusado",
};

export function ClienteAreaScreen({
  attendances,
  backButtonTitle = "Voltar",
  client,
  onBack,
  onSetAllItemsStatus,
  onSetItemStatus,
  paymentStatus,
  productRequests,
}: ClienteAreaScreenProps) {
  const [selectedAttendanceId, setSelectedAttendanceId] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState("");

  const clientAttendances = useMemo(
    () => attendances.filter((attendance) => attendance.clientName === client.name),
    [attendances, client.name],
  );
  const clientRequests = useMemo(
    () => productRequests.filter((request) => request.clientName === client.name),
    [productRequests, client.name],
  );
  const latestAttendance = clientAttendances[0] ?? null;
  const selectedAttendance =
    clientAttendances.find((attendance) => attendance.id === selectedAttendanceId) ?? null;
  const pendingProducts = getClientProductsByStatus(clientRequests, "pending");
  const approvedProducts = clientRequests.flatMap((request) =>
    request.items
      .filter((item) => item.status === "approved" || item.status === "delivered")
      .map((item) => ({ item, request })),
  );
  const nextVisitDate = getNextVisitDate(clientRequests, clientAttendances);

  function setItemStatusWithFeedback(
    requestId: string,
    itemId: string,
    status: Extract<ProductRequestItemStatus, "approved" | "rejected">,
  ) {
    onSetItemStatus(requestId, itemId, status);
    setFeedbackMessage(status === "approved" ? "Produto aprovado com sucesso." : "Produto recusado.");
  }

  function setAllPendingItemsStatus(status: Extract<ProductRequestItemStatus, "approved" | "rejected">) {
    const pendingRequestIds = clientRequests
      .filter((request) => request.items.some((item) => item.status === "pending"))
      .map((request) => request.id);

    pendingRequestIds.forEach((requestId) => onSetAllItemsStatus(requestId, status));
    setFeedbackMessage(
      status === "approved"
        ? "Produtos aprovados com sucesso."
        : "Produtos recusados.",
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.content} contentInsetAdjustmentBehavior="automatic">
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.eyebrow}>Area do Cliente</Text>
            <Text selectable style={styles.title}>
              {client.name}
            </Text>
            <Text selectable style={styles.subtitle}>
              Visao simulada do cliente para historico, fotos, aprovacoes e financeiro.
            </Text>
          </View>

          <PrimaryButton
            onPress={onBack}
            style={styles.backButton}
            title={backButtonTitle}
            variant="danger"
          />
        </View>

        {feedbackMessage ? (
          <View style={styles.feedbackBox}>
            <Text selectable style={styles.feedbackText}>
              {feedbackMessage}
            </Text>
          </View>
        ) : null}

        <View style={styles.overviewGrid}>
          <InfoTile label="Ultima limpeza" value={latestAttendance ? "Concluida" : "Sem registro"} />
          <InfoTile label="Data da ultima limpeza" value={latestAttendance?.attendanceDate ?? "Nao disponivel"} />
          <InfoTile label="Proxima visita" value={nextVisitDate} />
          <InfoTile label="Avisos importantes" value={pendingProducts.length > 0 ? "Produtos aguardando aprovacao" : "Nenhum aviso pendente"} />
        </View>

        <Section title="Ultima limpeza">
          {latestAttendance ? (
            <View style={styles.card}>
              <DetailRow label="Status" value="Limpeza concluida" />
              <DetailRow label="Data" value={latestAttendance.attendanceDate} />
              <DetailRow
                label="Checklist realizado"
                value={
                  latestAttendance.completedItems.length > 0
                    ? latestAttendance.completedItems.join(", ")
                    : "Nenhum item marcado"
                }
              />
              <DetailRow
                label="Observacoes"
                value={latestAttendance.observations || "Sem observacoes"}
              />
              <DetailRow
                label="Produtos utilizados"
                value={latestAttendance.productsUsed || "Sem produtos registrados"}
              />
            </View>
          ) : (
            <EmptyText text="Nenhuma limpeza concluida para este cliente ainda." />
          )}
        </Section>

        <Section title="Fotos antes e depois">
          {latestAttendance ? (
            <View style={styles.photoRow}>
              <PhotoPreview label="Foto do antes" uri={latestAttendance.beforePhotoUri} />
              <PhotoPreview label="Foto do depois" uri={latestAttendance.afterPhotoUri} />
            </View>
          ) : (
            <View style={styles.photoRow}>
              <PhotoPreview label="Foto do antes" uri="" />
              <PhotoPreview label="Foto do depois" uri="" />
            </View>
          )}
        </Section>

        <Section title="Produtos para aprovacao">
          {pendingProducts.length > 0 ? (
            <View style={styles.card}>
              <View style={styles.bulkActions}>
                <PrimaryButton
                  onPress={() => setAllPendingItemsStatus("approved")}
                  style={styles.bulkButton}
                  title="Aprovar todos"
                  variant="success"
                />
                <PrimaryButton
                  onPress={() => setAllPendingItemsStatus("rejected")}
                  style={styles.bulkButton}
                  title="Recusar todos"
                  variant="danger"
                />
              </View>

              <View style={styles.itemsList}>
                {pendingProducts.map(({ item, request }) => (
                  <ApprovalItemCard
                    item={item}
                    key={`${request.id}-${item.id}`}
                    onApprove={() => setItemStatusWithFeedback(request.id, item.id, "approved")}
                    onReject={() => setItemStatusWithFeedback(request.id, item.id, "rejected")}
                  />
                ))}
              </View>
            </View>
          ) : (
            <EmptyText text="Nenhum produto pendente de aprovacao." />
          )}
        </Section>

        <Section title="Produtos aprovados">
          {approvedProducts.length > 0 ? (
            <View style={styles.list}>
              {approvedProducts.map(({ item, request }) => (
                <View key={`${request.id}-${item.id}`} style={styles.card}>
                  <View style={styles.itemHeader}>
                    <View style={styles.itemText}>
                      <Text selectable style={styles.itemTitle}>
                        {item.product}
                      </Text>
                      <Text selectable style={styles.itemDetail}>
                        Quantidade: {item.quantity}
                      </Text>
                    </View>
                    <Text style={styles.statusText}>
                      {item.status === "delivered" ? "Entregue" : "Aprovado"}
                    </Text>
                  </View>
                  <DetailRow label="Observacao" value={item.observation || "Sem observacao"} />
                  <DetailRow label="Data da aprovacao" value={item.approvedAt ?? "Nao informada"} />
                  <DetailRow
                    label="Status"
                    value={item.status === "delivered" ? "Entregue" : "Aprovado"}
                  />
                  {item.deliveryPhotoUri ? (
                    <PhotoPreview label="Foto da entrega" uri={item.deliveryPhotoUri} />
                  ) : null}
                </View>
              ))}
            </View>
          ) : (
            <EmptyText text="Nenhum produto aprovado ainda." />
          )}
        </Section>

        <Section title="Historico de atendimentos">
          {selectedAttendance ? (
            <AttendanceDetail
              attendance={selectedAttendance}
              onBack={() => setSelectedAttendanceId(null)}
            />
          ) : clientAttendances.length > 0 ? (
            <View style={styles.list}>
              {clientAttendances.map((attendance) => (
                <Pressable
                  accessibilityLabel={`Abrir atendimento de ${attendance.attendanceDate}`}
                  accessibilityRole="button"
                  key={attendance.id}
                  onPress={() => setSelectedAttendanceId(attendance.id)}
                  style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
                >
                  <View style={styles.itemHeader}>
                    <View style={styles.itemText}>
                      <Text selectable style={styles.itemTitle}>
                        Limpeza concluida
                      </Text>
                      <Text selectable style={styles.itemDetail}>
                        {attendance.attendanceDate}
                      </Text>
                    </View>
                    <Text style={styles.openHint}>Abrir</Text>
                  </View>
                  <Text selectable style={styles.itemDetail}>
                    {attendance.completedItems.length} item(ns) do checklist realizado(s).
                  </Text>
                </Pressable>
              ))}
            </View>
          ) : (
            <EmptyText text="Nenhum atendimento no historico deste cliente." />
          )}
        </Section>

        <Section title="Situacao financeira">
          <View style={styles.card}>
            <DetailRow label="Valor mensal" value={formatCurrency(client.valorMensal)} />
            <DetailRow label="Dia de vencimento" value={String(client.diaVencimento)} />
            <DetailRow label="Status" value={paymentStatus === "paid" ? "Pago" : "Pendente"} />
          </View>
        </Section>

        <Section title="Proxima visita">
          <View style={styles.card}>
            <DetailRow label="Data prevista" value={nextVisitDate} />
          </View>
        </Section>

        <Section title="Solicitacoes de produtos">
          {clientRequests.length > 0 ? (
            <View style={styles.list}>
              {clientRequests.map((request) => (
                <View key={request.id} style={styles.card}>
                  <View style={styles.itemHeader}>
                    <View style={styles.itemText}>
                      <Text selectable style={styles.itemTitle}>
                        Solicitacao de produtos
                      </Text>
                      <Text selectable style={styles.itemDetail}>
                        Proxima visita: {request.nextVisitDate}
                      </Text>
                    </View>
                    <Text style={styles.statusText}>{requestStatusLabels[request.status]}</Text>
                  </View>
                  {request.items.map((item) => (
                    <DetailRow
                      key={item.id}
                      label={item.product}
                      value={`${item.quantity} - ${getItemStatusLabel(item.status)}${
                        item.observation ? ` - ${item.observation}` : ""
                      }`}
                    />
                  ))}
                </View>
              ))}
            </View>
          ) : (
            <EmptyText text="Nenhuma solicitacao registrada." />
          )}
        </Section>
      </ScrollView>
    </View>
  );
}

type ApprovalItemCardProps = {
  item: ProductRequestItem;
  onApprove: () => void;
  onReject: () => void;
};

function ApprovalItemCard({ item, onApprove, onReject }: ApprovalItemCardProps) {
  const opacity = useRef(new Animated.Value(1)).current;
  const translateX = useRef(new Animated.Value(0)).current;

  function runDecisionAnimation(onFinish: () => void, direction: 1 | -1) {
    Animated.parallel([
      Animated.timing(opacity, {
        duration: 180,
        toValue: 0,
        useNativeDriver: true,
      }),
      Animated.timing(translateX, {
        duration: 180,
        toValue: 18 * direction,
        useNativeDriver: true,
      }),
    ]).start(() => onFinish());
  }

  return (
    <Animated.View
      style={[
        styles.approvalItem,
        {
          opacity,
          transform: [{ translateX }],
        },
      ]}
    >
      <View style={styles.itemHeader}>
        <View style={styles.itemText}>
          <Text selectable style={styles.itemTitle}>
            {item.product}
          </Text>
          <Text selectable style={styles.itemDetail}>
            Quantidade: {item.quantity}
          </Text>
          <Text selectable style={styles.itemDetail}>
            {item.observation || "Sem observacao"}
          </Text>
        </View>
        <Text style={styles.statusText}>Pendente</Text>
      </View>

      <View style={styles.itemActions}>
        <PrimaryButton
          onPress={() => runDecisionAnimation(onApprove, 1)}
          style={styles.itemButton}
          title="Aprovar"
          variant="success"
        />
        <PrimaryButton
          onPress={() => runDecisionAnimation(onReject, -1)}
          style={styles.itemButton}
          title="Recusar"
          variant="danger"
        />
      </View>
    </Animated.View>
  );
}

type SectionProps = {
  children: React.ReactNode;
  title: string;
};

function Section({ children, title }: SectionProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
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

type PhotoPreviewProps = {
  label: string;
  uri: string;
};

function PhotoPreview({ label, uri }: PhotoPreviewProps) {
  return (
    <View style={styles.photoPreviewBox}>
      <Text style={styles.photoLabel}>{label}</Text>
      {uri ? (
        <Image accessibilityLabel={label} source={{ uri }} style={styles.photo} />
      ) : (
        <View style={styles.photoPlaceholder}>
          <Text selectable style={styles.photoPlaceholderText}>
            Foto nao disponivel
          </Text>
        </View>
      )}
    </View>
  );
}

type AttendanceDetailProps = {
  attendance: AttendanceRecord;
  onBack: () => void;
};

function AttendanceDetail({ attendance, onBack }: AttendanceDetailProps) {
  return (
    <View style={styles.detailStack}>
      <PrimaryButton onPress={onBack} style={styles.detailBackButton} title="Voltar" />
      <View style={styles.card}>
        <DetailRow label="Data" value={attendance.attendanceDate} />
        <DetailRow label="Status" value="Limpeza concluida" />
        <DetailRow
          label="Checklist"
          value={
            attendance.completedItems.length > 0
              ? attendance.completedItems.join(", ")
              : "Nenhum item marcado"
          }
        />
        <DetailRow
          label="Produtos utilizados"
          value={attendance.productsUsed || "Sem produtos registrados"}
        />
        <DetailRow label="Observacoes" value={attendance.observations || "Sem observacoes"} />
        <DetailRow
          label="Produtos faltando solicitados"
          value={
            attendance.missingProducts.length > 0
              ? attendance.missingProducts
                  .map(
                    (item) =>
                      `${item.product} (${item.quantity})${
                        item.observation ? ` - ${item.observation}` : ""
                      }`,
                  )
                  .join(", ")
              : "Nenhum produto faltando solicitado"
          }
        />
      </View>
      <View style={styles.photoRow}>
        <PhotoPreview label="Foto do antes" uri={attendance.beforePhotoUri} />
        <PhotoPreview label="Foto do depois" uri={attendance.afterPhotoUri} />
      </View>
    </View>
  );
}

function InfoTile({ label, value }: DetailRowProps) {
  return (
    <View style={styles.infoTile}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text selectable style={styles.infoTileValue}>
        {value}
      </Text>
    </View>
  );
}

function EmptyText({ text }: { text: string }) {
  return (
    <View style={styles.emptyBox}>
      <Text selectable style={styles.emptyText}>
        {text}
      </Text>
    </View>
  );
}

function getClientProductsByStatus(
  requests: ProductRequest[],
  status: ProductRequestItemStatus,
): ClientProductItem[] {
  return requests.flatMap((request) =>
    request.items
      .filter((item) => item.status === status)
      .map((item) => ({ item, request })),
  );
}

function getNextVisitDate(requests: ProductRequest[], attendances: AttendanceRecord[]) {
  const pendingRequest = requests.find((request) =>
    request.items.some((item) => item.status === "pending" || item.status === "approved"),
  );

  if (pendingRequest) {
    return pendingRequest.nextVisitDate;
  }

  const latestAttendance = attendances[0];

  return latestAttendance?.attendanceDate ?? "Nao informada";
}

function getItemStatusLabel(status: ProductRequestItemStatus) {
  const labels: Record<ProductRequestItemStatus, string> = {
    approved: "Aprovado",
    delivered: "Entregue",
    pending: "Pendente",
    rejected: "Recusado",
  };

  return labels[status];
}

function formatCurrency(value: number) {
  if (!Number.isFinite(value)) {
    return "Nao informado";
  }

  return `R$ ${value.toFixed(2).replace(".", ",")}`;
}

const styles = StyleSheet.create({
  approvalItem: {
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    borderColor: "rgba(255, 255, 255, 0.12)",
    borderRadius: 8,
    borderWidth: 1,
    gap: 12,
    padding: 12,
  },
  backButton: {
    alignSelf: "flex-start",
    height: 44,
    paddingHorizontal: 18,
    width: 158,
  },
  bulkActions: {
    flexDirection: "row",
    gap: 10,
  },
  bulkButton: {
    flex: 1,
    height: 46,
  },
  card: {
    backgroundColor: colors.card,
    borderColor: "rgba(255, 255, 255, 0.12)",
    borderRadius: 8,
    borderWidth: 1,
    gap: 14,
    padding: 16,
  },
  cardPressed: {
    opacity: 0.86,
  },
  content: {
    gap: 24,
    padding: 20,
    paddingTop: 28,
  },
  detailBackButton: {
    alignSelf: "flex-start",
    height: 44,
    width: 118,
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
  detailStack: {
    gap: 12,
  },
  detailValue: {
    color: colors.textSecondary,
    fontSize: 15,
    lineHeight: 21,
  },
  emptyBox: {
    backgroundColor: colors.card,
    borderColor: "rgba(255, 255, 255, 0.12)",
    borderRadius: 8,
    borderWidth: 1,
    padding: 16,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 15,
    lineHeight: 22,
  },
  eyebrow: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  feedbackBox: {
    backgroundColor: "rgba(39, 174, 96, 0.2)",
    borderColor: "rgba(39, 174, 96, 0.52)",
    borderRadius: 8,
    borderWidth: 1,
    padding: 14,
  },
  feedbackText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: "900",
    lineHeight: 21,
  },
  header: {
    alignItems: "flex-start",
    gap: 18,
  },
  headerText: {
    gap: 8,
  },
  infoTile: {
    backgroundColor: colors.card,
    borderColor: "rgba(255, 255, 255, 0.12)",
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    gap: 8,
    minWidth: 154,
    padding: 14,
  },
  infoTileValue: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "900",
    lineHeight: 22,
  },
  itemActions: {
    flexDirection: "row",
    gap: 10,
  },
  itemButton: {
    flex: 1,
    height: 44,
  },
  itemDetail: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  itemHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between",
  },
  itemText: {
    flex: 1,
    gap: 4,
  },
  itemTitle: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "900",
  },
  itemsList: {
    gap: 10,
  },
  list: {
    gap: 12,
  },
  openHint: {
    color: colors.white,
    fontSize: 13,
    fontWeight: "900",
  },
  overviewGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  photo: {
    backgroundColor: colors.input,
    borderRadius: 8,
    height: 170,
    width: "100%",
  },
  photoLabel: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "900",
  },
  photoPlaceholder: {
    alignItems: "center",
    backgroundColor: colors.input,
    borderColor: "rgba(255, 255, 255, 0.12)",
    borderRadius: 8,
    borderWidth: 1,
    height: 170,
    justifyContent: "center",
    padding: 12,
  },
  photoPlaceholderText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: "800",
    textAlign: "center",
  },
  photoPreviewBox: {
    flex: 1,
    gap: 8,
    minWidth: 150,
  },
  photoRow: {
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
  sectionTitle: {
    color: colors.white,
    fontSize: 22,
    fontWeight: "900",
  },
  statusText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: "900",
    textAlign: "right",
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
