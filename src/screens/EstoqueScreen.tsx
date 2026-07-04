import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";

import { PrimaryButton } from "../components/primary-button";
import colors from "../theme/colors";
import { isLowStock, unitOptions, type StockProduct, type StockUnit } from "../types/stock";

type ProductForm = {
  name: string;
  category: string;
  quantity: string;
  unit: StockUnit;
  minimumStock: string;
};

const emptyForm: ProductForm = {
  name: "",
  category: "",
  quantity: "",
  unit: "kg",
  minimumStock: "",
};

type EstoqueScreenProps = {
  onBack: () => void;
  onDeleteProduct: (productId: string) => void;
  onSaveProduct: (product: StockProduct) => void;
  products: StockProduct[];
};

export function EstoqueScreen({
  onBack,
  onDeleteProduct,
  onSaveProduct,
  products,
}: EstoqueScreenProps) {
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const lowStockCount = products.filter(isLowStock).length;

  function updateForm(field: keyof ProductForm, value: string) {
    setError("");
    setForm((currentForm) => ({ ...currentForm, [field]: value }));
  }

  function startAddProduct() {
    setEditingProductId(null);
    setForm(emptyForm);
    setError("");
    setShowForm(true);
  }

  function startEditProduct(product: StockProduct) {
    setEditingProductId(product.id);
    setForm({
      name: product.name,
      category: product.category,
      quantity: String(product.quantity),
      unit: product.unit,
      minimumStock: String(product.minimumStock),
    });
    setError("");
    setShowForm(true);
  }

  function cancelForm() {
    setEditingProductId(null);
    setForm(emptyForm);
    setError("");
    setShowForm(false);
  }

  function saveProduct() {
    const parsedQuantity = Number(form.quantity.replace(",", "."));
    const parsedMinimumStock = Number(form.minimumStock.replace(",", "."));

    if (!form.name.trim() || !form.category.trim()) {
      setError("Preencha nome e categoria do produto.");
      return;
    }

    if (!Number.isFinite(parsedQuantity) || parsedQuantity < 0) {
      setError("Quantidade em estoque deve ser um numero valido.");
      return;
    }

    if (!Number.isFinite(parsedMinimumStock) || parsedMinimumStock < 0) {
      setError("Estoque minimo deve ser um numero valido.");
      return;
    }

    const nextProduct: StockProduct = {
      id: editingProductId ?? String(Date.now()),
      name: form.name.trim(),
      category: form.category.trim(),
      quantity: parsedQuantity,
      unit: form.unit,
      minimumStock: parsedMinimumStock,
    };

    onSaveProduct(nextProduct);
    cancelForm();
  }

  function deleteProduct(productId: string) {
    onDeleteProduct(productId);

    if (editingProductId === productId) {
      cancelForm();
    }
  }

  return (
    <KeyboardAvoidingView behavior="padding" style={styles.root}>
      <StatusBar style="light" />
      <ScrollView
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.eyebrow}>Estoque</Text>
            <Text style={styles.title}>Controle de Estoque</Text>
            <Text selectable style={styles.subtitle}>
              Cadastre e acompanhe os produtos usados na manutencao das piscinas.
            </Text>
          </View>

          <View style={styles.headerActions}>
            <PrimaryButton
              onPress={onBack}
              style={styles.backButton}
              title="Voltar"
              variant="danger"
            />
            <PrimaryButton
              icon="+"
              onPress={startAddProduct}
              style={styles.addButton}
              title="Adicionar Produto"
              variant="success"
            />
          </View>
        </View>

        <View style={styles.metricsGrid}>
          <MetricCard label="Produtos cadastrados" value={String(products.length)} />
          <MetricCard label="Estoque baixo" tone="warning" value={String(lowStockCount)} />
        </View>

        {showForm ? (
          <View style={styles.card}>
            <Text style={styles.groupTitle}>
              {editingProductId ? "Editar produto" : "Adicionar Produto"}
            </Text>
            <FormField
              label="Nome"
              onChangeText={(value) => updateForm("name", value)}
              placeholder="Cloro granulado"
              value={form.name}
            />
            <FormField
              label="Categoria"
              onChangeText={(value) => updateForm("category", value)}
              placeholder="Tratamento"
              value={form.category}
            />
            <FormField
              keyboardType="decimal-pad"
              label="Quantidade em estoque"
              onChangeText={(value) => updateForm("quantity", value)}
              placeholder="10"
              value={form.quantity}
            />
            <View style={styles.field}>
              <Text style={styles.label}>Unidade</Text>
              <View style={styles.unitGrid}>
                {unitOptions.map((unit) => (
                  <PrimaryButton
                    key={unit}
                    onPress={() => updateForm("unit", unit)}
                    style={[
                      styles.unitButton,
                      form.unit === unit ? styles.unitButtonSelected : styles.unitButtonIdle,
                    ]}
                    title={unit}
                    variant={form.unit === unit ? "success" : "primary"}
                  />
                ))}
              </View>
            </View>
            <FormField
              keyboardType="decimal-pad"
              label="Estoque minimo"
              onChangeText={(value) => updateForm("minimumStock", value)}
              placeholder="3"
              value={form.minimumStock}
            />

            {error ? (
              <Text selectable style={styles.error}>
                {error}
              </Text>
            ) : null}

            <View style={styles.formActions}>
              <PrimaryButton
                onPress={saveProduct}
                style={styles.formButton}
                title={editingProductId ? "Salvar produto" : "Cadastrar produto"}
                variant="success"
              />
              <PrimaryButton
                onPress={cancelForm}
                style={styles.formButton}
                title="Cancelar"
                variant="danger"
              />
            </View>
          </View>
        ) : null}

        <View style={styles.productList}>
          {products.map((product) => {
            const lowStock = isLowStock(product);

            return (
              <View
                key={product.id}
                style={[styles.productCard, lowStock && styles.productCardLow]}
              >
                <View style={styles.productHeader}>
                  <View style={styles.productHeaderText}>
                    <Text selectable style={styles.productName}>
                      {product.name}
                    </Text>
                    <Text selectable style={styles.productCategory}>
                      {product.category}
                    </Text>
                  </View>

                  <View style={[styles.statusBadge, lowStock && styles.statusBadgeLow]}>
                    <Text style={styles.statusText}>
                      {lowStock ? "Estoque baixo" : "Estoque OK"}
                    </Text>
                  </View>
                </View>

                <View style={styles.detailGroup}>
                  <DetailRow
                    label="Quantidade em estoque"
                    value={`${formatNumber(product.quantity)} ${product.unit}`}
                  />
                  <DetailRow
                    label="Estoque minimo"
                    value={`${formatNumber(product.minimumStock)} ${product.unit}`}
                  />
                </View>

                <View style={styles.cardActions}>
                  <PrimaryButton
                    onPress={() => startEditProduct(product)}
                    style={styles.cardButton}
                    title="Editar produto"
                  />
                  <PrimaryButton
                    onPress={() => deleteProduct(product.id)}
                    style={styles.cardButton}
                    title="Excluir produto"
                    variant="danger"
                  />
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

type MetricCardProps = {
  label: string;
  value: string;
  tone?: "primary" | "warning";
};

function MetricCard({ label, value, tone = "primary" }: MetricCardProps) {
  return (
    <View style={[styles.metricCard, tone === "warning" && styles.metricCardWarning]}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text selectable style={styles.metricValue}>
        {value}
      </Text>
    </View>
  );
}

type FormFieldProps = {
  label: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  value: string;
  keyboardType?: "default" | "decimal-pad";
};

function FormField({
  label,
  onChangeText,
  placeholder,
  value,
  keyboardType = "default",
}: FormFieldProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        keyboardType={keyboardType}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        style={styles.input}
        value={value}
      />
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

function formatNumber(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: 2,
  }).format(value);
}

const styles = StyleSheet.create({
  addButton: {
    alignSelf: "flex-start",
    height: 44,
    paddingHorizontal: 18,
    width: 190,
  },
  backButton: {
    alignSelf: "flex-start",
    height: 44,
    paddingHorizontal: 18,
    width: 118,
  },
  card: {
    backgroundColor: colors.card,
    borderColor: "rgba(255, 255, 255, 0.12)",
    borderRadius: 8,
    borderWidth: 1,
    gap: 16,
    padding: 16,
  },
  cardActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  cardButton: {
    height: 44,
    width: 160,
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
  eyebrow: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  field: {
    gap: 8,
  },
  formActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  formButton: {
    height: 48,
    width: 172,
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
  headerActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  headerText: {
    gap: 8,
  },
  input: {
    backgroundColor: colors.input,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    color: colors.white,
    fontSize: 16,
    minHeight: 52,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  label: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "800",
  },
  metricCard: {
    backgroundColor: "rgba(46, 134, 222, 0.22)",
    borderColor: "rgba(255, 255, 255, 0.12)",
    borderRadius: 8,
    borderWidth: 1,
    flexBasis: 160,
    flexGrow: 1,
    gap: 8,
    padding: 16,
  },
  metricCardWarning: {
    backgroundColor: "rgba(243, 156, 18, 0.2)",
  },
  metricLabel: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  metricValue: {
    color: colors.white,
    fontSize: 22,
    fontWeight: "900",
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  productCard: {
    backgroundColor: colors.card,
    borderColor: "rgba(255, 255, 255, 0.12)",
    borderRadius: 8,
    borderWidth: 1,
    gap: 16,
    padding: 16,
  },
  productCardLow: {
    backgroundColor: "rgba(243, 156, 18, 0.18)",
    borderColor: "rgba(243, 156, 18, 0.52)",
  },
  productCategory: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: "800",
  },
  productHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
  },
  productHeaderText: {
    flex: 1,
    gap: 4,
  },
  productList: {
    gap: 12,
  },
  productName: {
    color: colors.white,
    fontSize: 19,
    fontWeight: "900",
    lineHeight: 25,
  },
  root: {
    backgroundColor: colors.background,
    flex: 1,
  },
  statusBadge: {
    backgroundColor: "rgba(39, 174, 96, 0.24)",
    borderColor: "rgba(39, 174, 96, 0.52)",
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  statusBadgeLow: {
    backgroundColor: "rgba(243, 156, 18, 0.24)",
    borderColor: "rgba(243, 156, 18, 0.62)",
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
  title: {
    color: colors.white,
    fontSize: 31,
    fontWeight: "900",
    lineHeight: 37,
  },
  unitButton: {
    height: 42,
    width: 96,
  },
  unitButtonIdle: {
    opacity: 0.84,
  },
  unitButtonSelected: {
    borderColor: "rgba(255, 255, 255, 0.22)",
    borderWidth: 1,
  },
  unitGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
});
