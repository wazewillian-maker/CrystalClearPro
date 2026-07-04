import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";

import { AppCard } from "../components/app-card";
import { BrandFooter, BrandLogo } from "../components/brand";
import { PrimaryButton } from "../components/primary-button";
import {
  firebaseDiagnosticsService,
  type FirebaseDiagnosticsResult,
} from "../services/firebase-diagnostics-service";
import colors from "../theme/colors";

type FirebaseDiagnosticsScreenProps = {
  onBack: () => void;
};

export function FirebaseDiagnosticsScreen({ onBack }: FirebaseDiagnosticsScreenProps) {
  const [diagnostics, setDiagnostics] = React.useState<FirebaseDiagnosticsResult | null>(null);
  const [loading, setLoading] = React.useState(false);

  const runDiagnostics = React.useCallback(async () => {
    setLoading(true);
    try {
      setDiagnostics(await firebaseDiagnosticsService.run());
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void runDiagnostics();
  }, [runDiagnostics]);

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.content} contentInsetAdjustmentBehavior="automatic">
        <View style={styles.header}>
          <BrandLogo showSubtitle size="small" />
          <View style={styles.headerText}>
            <Text style={styles.eyebrow}>Modo Teste</Text>
            <Text style={styles.title}>Diagnostico Firebase</Text>
            <Text selectable style={styles.subtitle}>
              Validacao temporaria de variaveis, Authentication, Cloud Firestore e Storage.
            </Text>
          </View>
        </View>

        <AppCard style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Status da conexao</Text>
            <Text selectable style={styles.cardSubtitle}>
              {diagnostics?.checkedAt ? `Ultima verificacao: ${diagnostics.checkedAt}` : "Executando verificacao..."}
            </Text>
          </View>

          <View style={styles.statusList}>
            {diagnostics?.items.map((item) => (
              <View key={item.label} style={styles.statusRow}>
                <View
                  style={[
                    styles.statusIcon,
                    item.status === "success" ? styles.statusIconSuccess : styles.statusIconError,
                  ]}
                >
                  <Text style={styles.statusIconText}>{item.status === "success" ? "✓" : "!"}</Text>
                </View>
                <View style={styles.statusText}>
                  <Text style={styles.statusLabel}>
                    {item.status === "success" ? `${item.label} conectado` : `${item.label} falhou`}
                  </Text>
                  <Text selectable style={styles.statusMessage}>
                    {item.message}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          <View style={styles.actions}>
            <PrimaryButton
              icon="~"
              onPress={runDiagnostics}
              title={loading ? "Verificando..." : "Testar novamente"}
              variant="secondary"
            />
            <PrimaryButton icon="<" onPress={onBack} title="Voltar" />
          </View>
        </AppCard>

        <BrandFooter />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  card: {
    gap: 18,
  },
  cardHeader: {
    gap: 6,
  },
  cardSubtitle: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  cardTitle: {
    color: colors.white,
    fontFamily: "Poppins",
    fontSize: 22,
    fontWeight: "900",
  },
  content: {
    gap: 24,
    padding: 20,
    paddingTop: 28,
  },
  eyebrow: {
    color: colors.primaryLight,
    fontFamily: "Inter",
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
  statusIcon: {
    alignItems: "center",
    borderCurve: "continuous",
    borderRadius: 16,
    height: 34,
    justifyContent: "center",
    width: 34,
  },
  statusIconError: {
    backgroundColor: "rgba(239, 68, 68, 0.18)",
    borderColor: "rgba(239, 68, 68, 0.5)",
    borderWidth: 1,
  },
  statusIconSuccess: {
    backgroundColor: "rgba(34, 197, 94, 0.18)",
    borderColor: "rgba(34, 197, 94, 0.5)",
    borderWidth: 1,
  },
  statusIconText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: "900",
  },
  statusLabel: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "900",
  },
  statusList: {
    gap: 12,
  },
  statusMessage: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
  },
  statusRow: {
    alignItems: "flex-start",
    backgroundColor: colors.input,
    borderColor: colors.border,
    borderCurve: "continuous",
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    padding: 14,
  },
  statusText: {
    flex: 1,
    gap: 4,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 16,
    lineHeight: 23,
  },
  title: {
    color: colors.white,
    fontFamily: "Poppins",
    fontSize: 31,
    fontWeight: "900",
    lineHeight: 37,
  },
});
