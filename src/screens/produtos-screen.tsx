import { useMemo, useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { StatusBar } from "expo-status-bar";

import { AppCard } from "../components/app-card";
import { PoolReferencePhoto } from "../components/pool-reference-photo";
import { PrimaryButton } from "../components/primary-button";
import { ScreenHeader } from "../components/screen-header";
import { StatusBadge, type StatusTone } from "../components/status-badge";
import colors from "../theme/colors";
import type { Client } from "../types/client";
import type { ProductRequest, ProductRequestItem, ProductRequestItemStatus } from "../types/product-request";

type ProdutosScreenProps = {
  clients: Client[];
  onBack: () => void;
  onConfirmDelivery: (requestId: string, itemId: string, deliveryPhotoUri: string) => void;
  productRequests: ProductRequest[];
};

type PendingDeliveryItem = {
  address: string;
  clientName: string;
  item: ProductRequestItem;
  neighborhood: string;
  nextVisitDate: string;
  poolName: string;
  requestId: string;
};

type PendingDeliveryItemGroup = {
  clientName: string;
  items: PendingDeliveryItem[];
};

export function ProdutosScreen({
  onBack,
  onConfirmDelivery,
  clients,
  productRequests,
}: ProdutosScreenProps) {
  const [deliveryTarget, setDeliveryTarget] = useState<{
    itemId: string;
    requestId: string;
  } | null>(null);
  const [deliveryPhotoUri, setDeliveryPhotoUri] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const pendingDeliveryItems = useMemo(
    () =>
      (Array.isArray(productRequests) ? productRequests : []).flatMap((request) =>
        (Array.isArray(request.items) ? request.items : [])
          .filter((item) => item.status !== "delivered" && item.status !== "rejected")
          .map((item) => ({
            address: request.address ?? "Endereco nao informado",
            clientName: request.clientName,
            item,
            neighborhood: request.neighborhood,
            nextVisitDate: request.nextVisitDate,
            poolName: request.poolName ?? "Piscina nao informada",
            requestId: request.id,
          })),
      ),
    [productRequests],
  );

  const groupedItems = useMemo(
    () =>
      pendingDeliveryItems.reduce<PendingDeliveryItemGroup[]>((groups, pendingItem) => {
        const existingGroup = groups.find((group) => group.clientName === pendingItem.clientName);

        if (existingGroup) {
          existingGroup.items.push(pendingItem);
          return groups;
        }

        return [...groups, { clientName: pendingItem.clientName, items: [pendingItem] }];
      }, []),
    [pendingDeliveryItems],
  );

  async function pickDeliveryPhoto() {
    setError("");
    setSuccessMessage("");

    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      setError("Permita o acesso as imagens para adicionar a foto da entrega.");
      return;
    }

    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: false,
      mediaTypes: ["images"],
      quality: 1,
    });

    if (pickerResult.canceled) {
      return;
    }

    const selectedPhotoUri = pickerResult.assets[0]?.uri;

    if (!selectedPhotoUri) {
      setError("Nao foi possivel carregar a imagem selecionada.");
      return;
    }

    setDeliveryPhotoUri(selectedPhotoUri);
  }

  function startDeliveryConfirmation(requestId: string, itemId: string) {
    setDeliveryTarget({ itemId, requestId });
    setDeliveryPhotoUri("");
    setError("");
    setSuccessMessage("");
  }

  function cancelDeliveryConfirmation() {
    setDeliveryTarget(null);
    setDeliveryPhotoUri("");
    setError("");
  }

  function finalizeDelivery(requestId: string, itemId: string) {
    onConfirmDelivery(requestId, itemId, deliveryPhotoUri);
    setDeliveryTarget(null);
    setDeliveryPhotoUri("");
    setError("");
    setSuccessMessage("Entrega confirmada com sucesso.");
  }

  return (
    <KeyboardAvoidingView behavior="padding" style={styles.root}>
      <StatusBar style="light" />
      <ScrollView
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
      >
        <ScreenHeader
          eyebrow="Produtos Pendentes"
          onBack={onBack}
          subtitle="Solicitacoes registradas no atendimento aparecem aqui ate a entrega."
          title="Produtos para levar"
        />

        {successMessage ? (
          <AppCard style={styles.successBox} tone="success">
            <Text selectable style={styles.successText}>
              {successMessage}
            </Text>
          </AppCard>
        ) : null}

        {error ? (
          <AppCard style={styles.errorBox} tone="danger">
            <Text selectable style={styles.errorText}>
              {error}
            </Text>
          </AppCard>
        ) : null}

        <AppCard style={styles.summary}>
          <Text style={styles.summaryTitle}>{pendingDeliveryItems.length} pendente(s) para levar</Text>
          <Text selectable style={styles.summaryText}>
            Itens entregues ou recusados ficam fora desta lista e continuam registrados no historico do cliente.
          </Text>
        </AppCard>

        <View style={styles.productList}>
          {groupedItems.length > 0 ? (
            groupedItems.map((group) => (
              <View key={group.clientName} style={styles.group}>
                <Text selectable style={styles.groupTitle}>
                  {group.clientName}
                </Text>

                {group.items.map((pendingItem) => {
                  const isConfirming =
                    deliveryTarget?.requestId === pendingItem.requestId &&
                    deliveryTarget.itemId === pendingItem.item.id;

                  return (
                    <AppCard key={`${pendingItem.requestId}-${pendingItem.item.id}`} style={styles.productCard}>
                      <View style={styles.productHeader}>
                        <PoolReferencePhoto
                          uri={clients.find((client) => client.name === pendingItem.clientName)?.referencePhotoUri}
                        />
                        <View style={styles.clientInfo}>
                          <Text selectable style={styles.clientName}>
                            {pendingItem.clientName}
                          </Text>
                          <Text selectable style={styles.neighborhood}>
                            {pendingItem.neighborhood}
                          </Text>
                        </View>

                        <StatusBadge label={getProductStatusLabel(pendingItem.item.status)} tone={getProductStatusTone(pendingItem.item.status)} />
                      </View>

                      <View style={styles.detailGroup}>
                        <DetailRow label="Produto/item" value={pendingItem.item.product || "Produto nao informado"} />
                        <DetailRow label="Quantidade" value={formatProductQuantity(pendingItem.item)} />
                        <DetailRow label="Piscina" value={pendingItem.poolName} />
                        <DetailRow label="Endereco" value={pendingItem.address} />
                        <DetailRow label="Proxima visita" value={pendingItem.nextVisitDate || "Data nao informada"} />
                        <DetailRow
                          label="Observacao"
                          value={pendingItem.item.observation || "Sem observacao"}
                        />
                      </View>

                      <PrimaryButton
                        onPress={() =>
                          startDeliveryConfirmation(
                            pendingItem.requestId,
                            pendingItem.item.id,
                          )
                        }
                        style={styles.deliveryButton}
                        title="Produto entregue"
                        variant="success"
                      />

                      {isConfirming ? (
                        <View style={styles.deliveryBox}>
                          <Text style={styles.deliveryTitle}>Confirmar entrega</Text>
                          <Text selectable style={styles.deliveryHint}>
                            A foto da entrega e opcional.
                          </Text>
                          <PrimaryButton
                            onPress={pickDeliveryPhoto}
                            style={styles.photoButton}
                            title={
                              deliveryPhotoUri
                                ? "Trocar foto da entrega"
                                : "Adicionar foto da entrega"
                            }
                          />

                          {deliveryPhotoUri ? (
                            <Image
                              accessibilityLabel="Previa da foto do produto entregue"
                              source={{ uri: deliveryPhotoUri }}
                              style={styles.photoPreview}
                            />
                          ) : null}

                          <View style={styles.deliveryActions}>
                            <Pressable
                              accessibilityRole="button"
                              onPress={cancelDeliveryConfirmation}
                              style={({ pressed }) => [
                                styles.cancelButton,
                                pressed && styles.cancelButtonPressed,
                              ]}
                            >
                              <Text style={styles.cancelButtonText}>Cancelar</Text>
                            </Pressable>
                            <PrimaryButton
                              onPress={() =>
                                finalizeDelivery(pendingItem.requestId, pendingItem.item.id)
                              }
                              style={styles.finishButton}
                              title="Finalizar entrega"
                              variant="success"
                            />
                          </View>
                        </View>
                      ) : null}
                    </AppCard>
                  );
                })}
              </View>
            ))
          ) : (
            <AppCard style={styles.emptyBox}>
              <Text selectable style={styles.emptyText}>
                Nenhum produto pendente para levar por enquanto.
              </Text>
            </AppCard>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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

function formatProductQuantity(item: ProductRequestItem) {
  return item.unit ? `${item.quantity} ${item.unit}` : item.quantity || "Quantidade nao informada";
}

function getProductStatusLabel(status: ProductRequestItemStatus) {
  const labels: Record<ProductRequestItemStatus, string> = {
    approved: "Aprovado",
    delivered: "Entregue",
    pending: "Pendente",
    rejected: "Recusado",
  };

  return labels[status] ?? "Pendente";
}

function getProductStatusTone(status: ProductRequestItemStatus): StatusTone {
  const tones: Record<ProductRequestItemStatus, StatusTone> = {
    approved: "approved",
    delivered: "delivered",
    pending: "pending",
    rejected: "rejected",
  };

  return tones[status] ?? "pending";
}

const styles = StyleSheet.create({
  backButton: {
    alignSelf: "flex-start",
    height: 44,
    paddingHorizontal: 18,
    width: 118,
  },
  cancelButton: {
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderColor: "rgba(255, 255, 255, 0.16)",
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    height: 50,
    justifyContent: "center",
  },
  cancelButtonPressed: {
    opacity: 0.82,
  },
  cancelButtonText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: "900",
  },
  clientInfo: {
    flex: 1,
    gap: 4,
  },
  clientName: {
    color: colors.white,
    fontSize: 18,
    fontWeight: "900",
  },
  content: {
    gap: 24,
    padding: 20,
    paddingTop: 28,
  },
  deliveryActions: {
    flexDirection: "row",
    gap: 10,
  },
  deliveryBox: {
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    borderColor: "rgba(255, 255, 255, 0.12)",
    borderRadius: 8,
    borderWidth: 1,
    gap: 12,
    padding: 12,
  },
  deliveryButton: {
    height: 48,
  },
  deliveryHint: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  deliveryTitle: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "900",
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
  errorBox: {
    backgroundColor: "rgba(231, 76, 60, 0.18)",
    borderColor: "rgba(231, 76, 60, 0.44)",
    borderRadius: 8,
    borderWidth: 1,
    padding: 14,
  },
  errorText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: "800",
    lineHeight: 21,
  },
  eyebrow: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  finishButton: {
    flex: 1,
    height: 50,
  },
  group: {
    gap: 12,
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
  neighborhood: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: "800",
  },
  photoButton: {
    height: 50,
  },
  photoPreview: {
    backgroundColor: colors.input,
    borderRadius: 8,
    height: 180,
    width: "100%",
  },
  productCard: {
    backgroundColor: colors.card,
    borderColor: "rgba(255, 255, 255, 0.12)",
    borderRadius: 8,
    borderWidth: 1,
    gap: 16,
    padding: 16,
  },
  productHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
  },
  productList: {
    gap: 16,
  },
  root: {
    backgroundColor: colors.background,
    flex: 1,
  },
  statusBadge: {
    backgroundColor: "rgba(39, 174, 96, 0.32)",
    borderColor: "rgba(39, 174, 96, 0.6)",
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
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
  successBox: {
    backgroundColor: "rgba(39, 174, 96, 0.2)",
    borderColor: "rgba(39, 174, 96, 0.52)",
    borderRadius: 8,
    borderWidth: 1,
    padding: 14,
  },
  successText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "900",
    lineHeight: 22,
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
