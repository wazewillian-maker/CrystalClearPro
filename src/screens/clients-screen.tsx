import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { StatusBar } from "expo-status-bar";

import { PrimaryButton } from "../components/primary-button";
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
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.eyebrow}>Cadastro</Text>
            <Text style={styles.title}>Clientes</Text>
            <Text selectable style={styles.subtitle}>
              Gerencie os clientes e piscinas atendidas pela equipe.
            </Text>
          </View>

          <PrimaryButton
            onPress={onBack}
            style={styles.backButton}
            title="Voltar"
            variant="danger"
          />
        </View>

        <View style={styles.toolbar}>
          <TextInput
            autoCapitalize="none"
            onChangeText={setSearch}
            placeholder="Pesquisar clientes"
            placeholderTextColor={colors.muted}
            style={styles.searchInput}
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
          <View style={styles.emptyState}>
            <Text selectable style={styles.emptyTitle}>
              Nenhum cliente cadastrado.
            </Text>
          </View>
        ) : filteredClients.length > 0 ? (
          <View style={styles.clientList}>
            {filteredClients.map((client) => (
              <Pressable
                accessibilityLabel={`Abrir ficha de ${client.name}`}
                accessibilityRole="button"
                key={client.id}
                onPress={() => onOpenClient(client.id)}
                style={({ pressed }) => [styles.clientCard, pressed && styles.clientCardPressed]}
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
              </Pressable>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text selectable style={styles.emptyTitle}>
              Nenhum cliente encontrado.
            </Text>
          </View>
        )}
      </ScrollView>
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
  clientCard: {
    backgroundColor: colors.card,
    borderColor: "rgba(255, 255, 255, 0.12)",
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
    padding: 16,
  },
  clientCardPressed: {
    opacity: 0.86,
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
  newClientButton: {
    height: 52,
  },
  root: {
    backgroundColor: colors.background,
    flex: 1,
  },
  searchInput: {
    backgroundColor: colors.input,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    color: colors.white,
    fontSize: 16,
    height: 52,
    paddingHorizontal: 14,
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
  toolbar: {
    gap: 12,
  },
});
