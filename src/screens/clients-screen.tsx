import React, { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";

import { AppCard } from "../components/app-card";
import { AppTextInput } from "../components/app-text-input";
import { PrimaryButton } from "../components/primary-button";
import { ScreenHeader } from "../components/screen-header";
import colors from "../theme/colors";
import { clientPlanLabels, type Client } from "../types/client";

type ClientsScreenProps = {
  clients: Client[];
  onBack: () => void;
  onOpenClient: (clientId: string) => void;
  onNewClient: () => void;
};

export function ClientsScreen({
  clients,
  onBack,
  onOpenClient,
  onNewClient,
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
        </View>

        {clients.length === 0 ? (
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
                <Text selectable style={styles.clientDetail}>
                  {client.address}
                </Text>
                <Text selectable style={styles.clientDetail}>
                  {client.neighborhood} - {clientPlanLabels[client.plan]}
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
    fontSize: 18,
    fontWeight: "900",
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
    borderColor: "rgba(255, 255, 255, 0.12)",
    borderRadius: 8,
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
