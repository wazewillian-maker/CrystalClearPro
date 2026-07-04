import React, { useMemo, useState } from "react";
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
import { PrimaryButton } from "../components/primary-button";
import { ScreenHeader } from "../components/screen-header";
import { StatusBadge } from "../components/status-badge";
import colors from "../theme/colors";
import type { ProductRequest, ProductRequestItem } from "../types/product-request";

type ProdutosScreenProps = {
  onBack: () => void;
  onConfirmDelivery: (requestId: string, itemId: string, deliveryPhotoUri: string) => void;
  productRequests: ProductRequest[];
};

type ApprovedItem = {
  clientName: string;
  item: ProductRequestItem;
  neighborhood: string;
  nextVisitDate: string;
  requestId: string;
};

type ApprovedItemGroup = {
  clientName: string;
  items: ApprovedItem[];
};

export function ProdutosScreen({
  onBack,
  onConfirmDelivery,
  productRequests,
}: ProdutosScreenProps) {
  const [deliveryTarget, setDeliveryTarget] = useState<{
    itemId: string;
    requestId: string;
  } | null>(null);
  const [deliveryPhotoUri, setDeliveryPhotoUri] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const approvedItems = useMemo(
    () =>
      productRequests.flatMap((request) =>
        request.items
          .filter((item) => item.status === "approved")
          .map((item) => ({
            clientName: request.clientName,
            item,
            neighborhood: request.neighborhood,
            nextVisitDate: request.nextVisitDate,
            requestId: request.id,
          })),
      ),
    [productRequests],
  );

  const groupedItems = useMemo(
    () =>
      approvedItems.reduce<ApprovedItemGroup[]>((groups, approvedItem) => {
        const existingGroup = groups.find((group) => group.clientName === approvedItem.clientName);

        if (existingGroup) {
          existingGroup.items.push(approvedItem);
          return groups;
        }

        return [...groups, { clientName: approvedItem.clientName, items: [approvedItem] }];
      }, []),
    [approvedItems],
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
    if (!deliveryPhotoUri) {
      setError("Adicione a foto do produto entregue para finalizar a entrega.");
      return;
    }

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
          subtitle="Somente itens aprovados pelo cliente aparecem aqui para entrega."
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
          <Text style={styles.summaryTitle}>{approvedItems.length} aprovado(s) para levar</Text>
          <Text selectable style={styles.summaryText}>
            Itens pendentes de aprovacao, recusados ou ja entregues ficam fora desta lista.
          </Text>
        </AppCard>

        <View style={styles.productList}>
          {groupedItems.length > 0 ? (
            groupedItems.map((group) => (
              <View key={group.clientName} style={styles.group}>
                <Text selectable style={styles.groupTitle}>
                  {group.clientName}
                </Text>

                {group.items.map((approvedItem) => {
                  const isConfirming =
                    deliveryTarget?.requestId === approvedItem.requestId &&
                    deliveryTarget.itemId === approvedItem.item.id;

                  return (
                    <AppCard key={approvedItem.item.id} style={styles.productCard}>
                      <View style={styles.productHeader}>
                        <View style={styles.clientInfo}>
                          <Text selectable style={styles.clientName}>
                            {approvedItem.clientName}
                          </Text>
                          <Text selectable style={styles.neighborhood}>
                            {approvedItem.neighborhood}
                          </Text>
                        </View>

                        <StatusBadge label="Aprovado" tone="approved" />
                      </View>

                      <View style={styles.detailGroup}>
                        <DetailRow label="Produto/item" value={approvedItem.item.product} />
                        <DetailRow label="Quantidade" value={approvedItem.item.quantity} />
                        <DetailRow label="Data prevista" value={approvedItem.nextVisitDate} />
                        <DetailRow
                          label="Observacao"
                          value={approvedItem.item.observation || "Sem observacao"}
                        />
                      </View>

                      <PrimaryButton
                        onPress={() =>
                          startDeliveryConfirmation(
                            approvedItem.requestId,
                            approvedItem.item.id,
                          )
                        }
                        style={styles.deliveryButton}
                        title="Confirmar entrega"
                        variant="success"
                      />

                      {isConfirming ? (
                        <View style={styles.deliveryBox}>
                          <Text style={styles.deliveryTitle}>Foto do produto entregue</Text>
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
                                finalizeDelivery(approvedItem.requestId, approvedItem.item.id)
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
                Nenhum item aprovado para levar por enquanto.
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
