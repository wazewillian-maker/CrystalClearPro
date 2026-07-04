import React, { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";

import { PrimaryButton } from "../components/primary-button";
import colors from "../theme/colors";

type ProductRequestStatus = "pending" | "taken";

type ProductRequest = {
  id: string;
  clientName: string;
  neighborhood: string;
  product: string;
  quantity: string;
  observation: string;
  status: ProductRequestStatus;
};

const initialProductRequests: ProductRequest[] = [
  {
    id: "1",
    clientName: "Condominio Lago Azul",
    neighborhood: "Jardim Europa",
    product: "Cloro granulado",
    quantity: "2 kg",
    observation: "Piscina com cloro baixo no ultimo atendimento.",
    status: "pending",
  },
  {
    id: "2",
    clientName: "Marina Costa",
    neighborhood: "Vila Mariana",
    product: "Barrilha leve",
    quantity: "1 kg",
    observation: "Ajustar pH antes da aspiracao.",
    status: "pending",
  },
  {
    id: "3",
    clientName: "Academia Aqua Fit",
    neighborhood: "Centro",
    product: "Clarificante",
    quantity: "500 ml",
    observation: "Deixar reservado para uso apos a limpeza.",
    status: "taken",
  },
];

type ProdutosScreenProps = {
  onBack: () => void;
};

export function ProdutosScreen({ onBack }: ProdutosScreenProps) {
  const [productRequests, setProductRequests] = useState(initialProductRequests);
  const pendingCount = productRequests.filter((request) => request.status === "pending").length;

  function markAsTaken(requestId: string) {
    setProductRequests((currentRequests) =>
      currentRequests.map((request) =>
        request.id === requestId ? { ...request, status: "taken" } : request,
      ),
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.content} contentInsetAdjustmentBehavior="automatic">
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.eyebrow}>Produtos</Text>
            <Text style={styles.title}>Produtos para levar hoje</Text>
            <Text selectable style={styles.subtitle}>
              Confira os itens separados para os atendimentos de hoje.
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
          <Text style={styles.summaryTitle}>{pendingCount} pendente(s)</Text>
          <Text selectable style={styles.summaryText}>
            Marque cada produto como levado assim que ele estiver no carro.
          </Text>
        </View>

        <View style={styles.productList}>
          {productRequests.map((request) => {
            const isTaken = request.status === "taken";

            return (
              <View
                key={request.id}
                style={[styles.productCard, isTaken && styles.productCardTaken]}
              >
                <View style={styles.productHeader}>
                  <View style={styles.clientInfo}>
                    <Text selectable style={styles.clientName}>
                      {request.clientName}
                    </Text>
                    <Text selectable style={styles.neighborhood}>
                      {request.neighborhood}
                    </Text>
                  </View>

                  <View style={[styles.statusBadge, isTaken && styles.statusBadgeTaken]}>
                    <Text style={styles.statusText}>{isTaken ? "Levado" : "Pendente"}</Text>
                  </View>
                </View>

                <View style={styles.detailGroup}>
                  <DetailRow label="Produto necessario" value={request.product} />
                  <DetailRow label="Quantidade" value={request.quantity} />
                  <DetailRow label="Observacao" value={request.observation} />
                </View>

                {!isTaken ? (
                  <PrimaryButton
                    onPress={() => markAsTaken(request.id)}
                    style={styles.takenButton}
                    title="Marcar como Levado"
                    variant="success"
                  />
                ) : null}
              </View>
            );
          })}
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

const styles = StyleSheet.create({
  backButton: {
    alignSelf: "flex-start",
    height: 44,
    paddingHorizontal: 18,
    width: 118,
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
  neighborhood: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: "800",
  },
  productCard: {
    backgroundColor: colors.card,
    borderColor: "rgba(255, 255, 255, 0.12)",
    borderRadius: 8,
    borderWidth: 1,
    gap: 16,
    padding: 16,
  },
  productCardTaken: {
    backgroundColor: "rgba(39, 174, 96, 0.28)",
    borderColor: "rgba(39, 174, 96, 0.52)",
  },
  productHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
  },
  productList: {
    gap: 12,
  },
  root: {
    backgroundColor: colors.background,
    flex: 1,
  },
  statusBadge: {
    backgroundColor: "rgba(243, 156, 18, 0.22)",
    borderColor: "rgba(243, 156, 18, 0.52)",
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  statusBadgeTaken: {
    backgroundColor: "rgba(39, 174, 96, 0.32)",
    borderColor: "rgba(39, 174, 96, 0.6)",
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
  takenButton: {
    height: 48,
  },
  title: {
    color: colors.white,
    fontSize: 31,
    fontWeight: "900",
    lineHeight: 37,
  },
});
