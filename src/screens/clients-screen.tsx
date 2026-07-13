import { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";

import { AppCard } from "../components/app-card";
import { AppTextInput } from "../components/app-text-input";
import { PoolReferencePhoto } from "../components/pool-reference-photo";
import { PrimaryButton } from "../components/primary-button";
import { ScreenHeader } from "../components/screen-header";
import colors from "../theme/colors";
import { clientPlanLabels, type Client } from "../types/client";

type ClientsScreenProps = {
  clients: Client[];
  errorMessage?: string;
  loading?: boolean;
  onBack: () => void;
  onOpenClient: (clientId: string) => void;
  onNewClient: () => void;
  onNewPool: () => void;
};

export function ClientsScreen({
  clients,
  errorMessage,
  loading = false,
  onBack,
  onOpenClient,
  onNewClient,
  onNewPool,
}: ClientsScreenProps) {
  const [search, setSearch] = useState("");
  const normalizedSearch = search.trim().toLowerCase();
  const filteredClients = clients.filter((client) => {
    const searchableText = `${client.name} ${client.phone} ${client.address} ${client.neighborhood} ${client.city}`;
    return searchableText.toLowerCase().includes(normalizedSearch);
  });

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.content} contentInsetAdjustmentBehavior="automatic">
        <ScreenHeader
          eyebrow="Cadastro"
          onBack={onBack}
          subtitle="Gerencie os clientes e piscinas atendidas pela equipe."
          title="Clientes"
        />

        <View style={styles.toolbar}>
          <AppTextInput
            autoCapitalize="none"
            onChangeText={setSearch}
            placeholder="Pesquisar clientes"
            value={search}
          />

          <PrimaryButton
            icon="+"
            onPress={onNewClient}
            style={styles.newClientButton}
            title="Novo Cliente"
            variant="success"
          />
          <PrimaryButton
            icon="+"
            onPress={onNewPool}
            style={styles.newClientButton}
            title="Adicionar piscina a cliente existente"
          />
        </View>

        {errorMessage ? (
          <AppCard style={styles.emptyState}>
            <Text selectable style={styles.emptyTitle}>
              {errorMessage}
            </Text>
          </AppCard>
        ) : loading ? (
          <AppCard style={styles.emptyState}>
            <Text selectable style={styles.emptyTitle}>
              Carregando clientes...
            </Text>
          </AppCard>
        ) : clients.length === 0 ? (
          <AppCard style={styles.emptyState}>
            <Text selectable style={styles.emptyTitle}>
              Nenhum cliente cadastrado.
            </Text>
          </AppCard>
        ) : filteredClients.length > 0 ? (
          <View style={styles.clientList}>
            {filteredClients.map((client) => (
              <AppCard
                accessibilityLabel={`Abrir ficha de ${client.name}`}
                key={client.id}
                onPress={() => onOpenClient(client.id)}
                style={styles.clientCard}
              >
                <View style={styles.clientRow}>
                  <PoolReferencePhoto uri={client.referencePhotoUri} />
                  <View style={styles.clientText}>
                    <View style={styles.clientHeader}>
                      <Text selectable style={styles.clientName}>
                        {client.name}
                      </Text>
                      <Text selectable style={styles.clientCity}>
                        {client.city}
                      </Text>
                    </View>

                    <Text selectable style={styles.clientDetail}>
                      {client.phone}
                    </Text>
                    {client.email ? (
                      <Text selectable style={styles.clientDetail}>
                        {client.email}
                      </Text>
                    ) : null}
                    <Text selectable style={styles.clientDetail}>
                      {client.neighborhood} - {client.poolName ?? "Piscina principal"} - {clientPlanLabels[client.plan]}
                    </Text>
                    <Text style={styles.clientStatus}>Ativo</Text>
                  </View>
                </View>
                <Text selectable style={styles.clientDetail}>
                  {client.address}
                </Text>
                {client.notes ? (
                  <Text selectable style={styles.clientNotes}>
                    {client.notes}
                  </Text>
                ) : null}
              </AppCard>
            ))}
          </View>
        ) : (
          <AppCard style={styles.emptyState}>
            <Text selectable style={styles.emptyTitle}>
              Nenhum cliente encontrado.
            </Text>
          </AppCard>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  clientCard: {
    backgroundColor: "rgba(13, 43, 77, 0.86)",
    borderColor: colors.border,
    gap: 8,
  },
  clientCity: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: "800",
  },
  clientDetail: {
    color: colors.textSecondary,
    fontSize: 15,
    lineHeight: 21,
  },
  clientHeader: {
    gap: 4,
  },
  clientList: {
    gap: 12,
  },
  clientName: {
    color: colors.white,
    fontFamily: "Poppins",
    fontSize: 18,
    fontWeight: "900",
  },
  clientRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 14,
  },
  clientStatus: {
    color: colors.primaryLight,
    fontFamily: "Inter",
    fontSize: 13,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  clientText: {
    flex: 1,
    gap: 5,
  },
  clientNotes: {
    color: colors.white,
    fontSize: 14,
    lineHeight: 20,
  },
  content: {
    gap: 24,
    padding: 20,
    paddingTop: 28,
  },
  emptyState: {
    alignItems: "center",
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 220,
    padding: 24,
  },
  emptyTitle: {
    color: colors.textSecondary,
    fontSize: 17,
    fontWeight: "800",
    textAlign: "center",
  },
  newClientButton: {
    height: 52,
  },
  root: {
    backgroundColor: colors.background,
    flex: 1,
  },
  toolbar: {
    gap: 12,
  },
});
