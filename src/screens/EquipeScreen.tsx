import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";

import { AppCard } from "../components/app-card";
import { AppTextInput } from "../components/app-text-input";
import { PoolReferencePhoto } from "../components/pool-reference-photo";
import { PrimaryButton } from "../components/primary-button";
import { ScreenHeader } from "../components/screen-header";
import colors from "../theme/colors";
import type { AgendaItem } from "../types/agenda";
import type { Client } from "../types/client";
import {
  employeeRoleLabels,
  employeeStatusLabels,
  type Employee,
  type EmployeeFormData,
  type EmployeeRole,
} from "../types/employee";

const roleOptions: EmployeeRole[] = ["partner", "staff"];

type EquipeScreenProps = {
  agendaItems: AgendaItem[];
  clients: Client[];
  employees: Employee[];
  errorMessage?: string;
  onBack: () => void;
  onAssignClientsToEmployee: (employeeId: string, clientIds: string[]) => Promise<void> | void;
  onCreateEmployee: (employee: EmployeeFormData) => void;
  onUpdateEmployee: (employeeId: string, employee: EmployeeFormData) => void;
  onToggleEmployeeStatus: (employeeId: string) => void;
};

export function EquipeScreen({
  agendaItems,
  clients,
  employees,
  errorMessage,
  onBack,
  onAssignClientsToEmployee,
  onCreateEmployee,
  onUpdateEmployee,
  onToggleEmployeeStatus,
}: EquipeScreenProps) {
  const [editingEmployeeId, setEditingEmployeeId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<EmployeeRole>("staff");
  const [error, setError] = useState("");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [isAssigningPools, setIsAssigningPools] = useState(false);
  const [selectedClientIds, setSelectedClientIds] = useState<string[]>([]);
  const [savingAssignments, setSavingAssignments] = useState(false);
  const editingEmployee = employees.find((employee) => employee.id === editingEmployeeId);
  const selectedEmployee = employees.find((employee) => employee.id === selectedEmployeeId);

  function resetForm() {
    setEditingEmployeeId(null);
    setName("");
    setPhone("");
    setEmail("");
    setRole("staff");
    setError("");
  }

  function startEdit(employee: Employee) {
    setSelectedEmployeeId(null);
    setIsAssigningPools(false);
    setEditingEmployeeId(employee.id);
    setName(employee.name);
    setPhone(employee.phone);
    setEmail(employee.email);
    setRole(employee.role === "owner" ? "partner" : employee.role);
    setError("");
  }

  function openEmployeeDetails(employee: Employee) {
    setSelectedEmployeeId(employee.id);
    setIsAssigningPools(false);
    resetForm();
  }

  function startAssignPools(employee: Employee) {
    const assignedClientIds = agendaItems
      .filter((item) => item.assignedEmployeeId === employee.id)
      .map((item) => item.clientId)
      .filter((clientId): clientId is string => Boolean(clientId));

    setSelectedClientIds(assignedClientIds);
    setSelectedEmployeeId(employee.id);
    setIsAssigningPools(true);
  }

  function toggleClientSelection(clientId: string) {
    setSelectedClientIds((currentIds) =>
      currentIds.includes(clientId)
        ? currentIds.filter((currentId) => currentId !== clientId)
        : [...currentIds, clientId],
    );
  }

  async function saveAssignments() {
    if (!selectedEmployee) {
      return;
    }

    setSavingAssignments(true);
    setError("");

    try {
      await onAssignClientsToEmployee(selectedEmployee.id, selectedClientIds);
      setIsAssigningPools(false);
    } catch (assignmentError) {
      setError(assignmentError instanceof Error ? assignmentError.message : "Nao foi possivel salvar as atribuicoes.");
    } finally {
      setSavingAssignments(false);
    }
  }

  function handleSave() {
    if (!name.trim() || !phone.trim() || !email.trim()) {
      setError("Preencha nome, telefone e e-mail.");
      return;
    }

    const employeeData: EmployeeFormData = {
      email: email.trim(),
      name: name.trim(),
      phone: phone.trim(),
      role,
      status: editingEmployee?.status ?? "active",
    };

    if (editingEmployeeId) {
      onUpdateEmployee(editingEmployeeId, employeeData);
    } else {
      onCreateEmployee(employeeData);
    }

    resetForm();
  }

  if (selectedEmployee && isAssigningPools) {
    return (
      <View style={styles.root}>
        <StatusBar style="light" />
        <ScrollView contentContainerStyle={styles.content} contentInsetAdjustmentBehavior="automatic">
          <ScreenHeader
            eyebrow="Atribuir piscinas"
            onBack={() => setIsAssigningPools(false)}
            subtitle={`Selecione uma ou varias piscinas para ${selectedEmployee.name}.`}
            title="Piscinas do dia"
          />

          <View style={styles.list}>
            {error || errorMessage ? (
              <AppCard style={styles.errorCard}>
                <Text selectable style={styles.error}>
                  {error || errorMessage}
                </Text>
              </AppCard>
            ) : null}

            {clients.length > 0 ? (
              clients.map((client) => {
                const currentAssignment = agendaItems.find(
                  (item) => item.clientId === client.id || item.clientName === client.name,
                );
                const assignedToAnother =
                  currentAssignment?.assignedEmployeeId &&
                  currentAssignment.assignedEmployeeId !== selectedEmployee.id;
                const selected = selectedClientIds.includes(client.id);

                return (
                  <Pressable
                    accessibilityLabel={`Selecionar piscina de ${client.name}`}
                    accessibilityRole="button"
                    key={client.id}
                    onPress={() => toggleClientSelection(client.id)}
                    style={({ pressed }) => [
                      styles.assignmentCard,
                      selected && styles.assignmentCardSelected,
                      pressed && styles.roleOptionPressed,
                    ]}
                  >
                    <PoolReferencePhoto uri={client.referencePhotoUri} />
                    <View style={styles.assignmentInfo}>
                      <Text selectable style={styles.employeeName}>
                        {client.name}
                      </Text>
                      <Text selectable style={styles.employeeDetail}>
                        {client.neighborhood} - {client.address}
                      </Text>
                      {currentAssignment?.assignedEmployeeName ? (
                        <Text
                          selectable
                          style={[
                            styles.assignmentStatus,
                            assignedToAnother && styles.assignmentWarning,
                          ]}
                        >
                          {assignedToAnother
                            ? `Ja atribuido para ${currentAssignment.assignedEmployeeName}. Ao salvar, o responsavel sera trocado.`
                            : `Atribuido para ${currentAssignment.assignedEmployeeName}`}
                        </Text>
                      ) : (
                        <Text selectable style={styles.assignmentStatus}>
                          Sem responsavel atribuido
                        </Text>
                      )}
                    </View>
                    <Text style={styles.checkMark}>{selected ? "Selecionado" : "Selecionar"}</Text>
                  </Pressable>
                );
              })
            ) : (
              <AppCard>
                <Text selectable style={styles.employeeDetail}>
                  Nenhum cliente cadastrado para atribuir.
                </Text>
              </AppCard>
            )}
          </View>

          <PrimaryButton
            icon=">"
            loading={savingAssignments}
            onPress={saveAssignments}
            title="Salvar atribuicoes"
            variant="success"
          />
        </ScrollView>
      </View>
    );
  }

  if (selectedEmployee) {
    const assignedItems = agendaItems.filter((item) => item.assignedEmployeeId === selectedEmployee.id);
    const pendingItems = assignedItems.filter((item) => item.status !== "finished");
    const finishedItems = assignedItems.filter((item) => item.status === "finished");

    return (
      <View style={styles.root}>
        <StatusBar style="light" />
        <ScrollView contentContainerStyle={styles.content} contentInsetAdjustmentBehavior="automatic">
          <ScreenHeader
            eyebrow="Detalhes do funcionario"
            onBack={() => setSelectedEmployeeId(null)}
            subtitle="Consulte os dados e distribua piscinas para este responsavel."
            title={selectedEmployee.name}
          />

          <AppCard style={styles.employeeCard}>
            <Text selectable style={styles.employeeName}>
              {selectedEmployee.name}
            </Text>
            <Text selectable style={styles.employeeDetail}>
              Telefone: {selectedEmployee.phone}
            </Text>
            <Text selectable style={styles.employeeDetail}>
              E-mail: {selectedEmployee.email}
            </Text>
            <Text selectable style={styles.employeeDetail}>
              Funcao: {employeeRoleLabels[selectedEmployee.role]}
            </Text>
            <Text selectable style={styles.employeeDetail}>
              Status: {employeeStatusLabels[selectedEmployee.status]}
            </Text>

            <View style={styles.metricsRow}>
              <MiniMetric label="Atribuidas" value={assignedItems.length} />
              <MiniMetric label="Pendentes" value={pendingItems.length} />
              <MiniMetric label="Concluidas" value={finishedItems.length} />
            </View>

            <PrimaryButton
              icon="+"
              onPress={() => startAssignPools(selectedEmployee)}
              title="Atribuir piscinas"
            />
          </AppCard>

          <View style={styles.list}>
            {assignedItems.map((item) => (
              <AppCard key={item.id}>
                <Text selectable style={styles.employeeName}>
                  {item.clientName}
                </Text>
                <Text selectable style={styles.employeeDetail}>
                  {item.neighborhood} - {item.address}
                </Text>
                <Text selectable style={styles.assignmentStatus}>
                  Status: {item.status === "finished" ? "Finalizado" : item.status === "in-progress" ? "Em atendimento" : "Pendente"}
                </Text>
              </AppCard>
            ))}
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.content} contentInsetAdjustmentBehavior="automatic">
        <ScreenHeader
          eyebrow="Equipe"
          onBack={onBack}
          subtitle="Distribua as piscinas do dia entre socios e funcionarios."
          title="Funcionarios"
        />

        {errorMessage ? (
          <AppCard style={styles.errorCard}>
            <Text selectable style={styles.error}>
              {errorMessage}
            </Text>
          </AppCard>
        ) : null}

        <AppCard style={styles.formCard}>
          <Text style={styles.sectionTitle}>
            {editingEmployeeId ? "Editar funcionario" : "Cadastrar funcionario"}
          </Text>
          <AppTextInput label="Nome" onChangeText={setName} placeholder="Nome do funcionario" value={name} />
          <AppTextInput label="Telefone" onChangeText={setPhone} placeholder="(11) 99999-0000" value={phone} />
          <AppTextInput
            autoCapitalize="none"
            keyboardType="email-address"
            label="E-mail"
            onChangeText={setEmail}
            placeholder="funcionario@crystalclear.com"
            value={email}
          />

          <View style={styles.roleGroup}>
            <Text style={styles.groupLabel}>Funcao</Text>
            <View style={styles.roleOptions}>
              {roleOptions.map((option) => {
                const selected = option === role;

                return (
                  <Pressable
                    accessibilityLabel={`Selecionar funcao ${employeeRoleLabels[option]}`}
                    accessibilityRole="button"
                    key={option}
                    onPress={() => setRole(option)}
                    style={({ pressed }) => [
                      styles.roleOption,
                      selected && styles.roleOptionSelected,
                      pressed && styles.roleOptionPressed,
                    ]}
                  >
                    <Text style={styles.roleOptionText}>{employeeRoleLabels[option]}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {error ? (
            <Text selectable style={styles.error}>
              {error}
            </Text>
          ) : null}

          <View style={styles.formActions}>
            <PrimaryButton
              icon={editingEmployeeId ? ">" : "+"}
              onPress={handleSave}
              style={styles.formButton}
              title={editingEmployeeId ? "Salvar alteracoes" : "Cadastrar funcionario"}
            />
            {editingEmployeeId ? (
              <PrimaryButton
                onPress={resetForm}
                style={styles.cancelButton}
                title="Cancelar"
                variant="secondary"
              />
            ) : null}
          </View>
        </AppCard>

        <View style={styles.list}>
          {employees.map((employee) => {
            const assignedItems = agendaItems.filter((item) => item.assignedEmployeeId === employee.id);
            const pendingItems = assignedItems.filter((item) => item.status !== "finished");
            const finishedItems = assignedItems.filter((item) => item.status === "finished");

            return (
              <AppCard
                accessibilityLabel={`Abrir detalhes de ${employee.name}`}
                key={employee.id}
                onPress={() => openEmployeeDetails(employee)}
                style={styles.employeeCard}
              >
                <View style={styles.employeeHeader}>
                  <View style={styles.employeeInfo}>
                    <Text selectable style={styles.employeeName}>
                      {employee.name}
                    </Text>
                    <Text selectable style={styles.employeeDetail}>
                      {employeeRoleLabels[employee.role]} - {employeeStatusLabels[employee.status]}
                    </Text>
                    <Text selectable style={styles.employeeDetail}>
                      {employee.phone} - {employee.email}
                    </Text>
                  </View>
                  <Text style={[styles.statusText, employee.status === "inactive" && styles.inactiveText]}>
                    {employee.status === "active" ? "Ativo" : "Inativo"}
                  </Text>
                </View>

                <View style={styles.metricsRow}>
                  <MiniMetric label="Atribuidas" value={assignedItems.length} />
                  <MiniMetric label="Pendentes" value={pendingItems.length} />
                  <MiniMetric label="Concluidas" value={finishedItems.length} />
                </View>

                <View style={styles.cardActions}>
                  {employee.role !== "owner" ? (
                    <PrimaryButton
                      onPress={() => startEdit(employee)}
                      style={styles.smallButton}
                      title="Editar"
                      variant="secondary"
                    />
                  ) : null}
                  {employee.role !== "owner" ? (
                    <PrimaryButton
                      onPress={() => onToggleEmployeeStatus(employee.id)}
                      style={styles.statusButton}
                      title={employee.status === "active" ? "Inativar" : "Ativar"}
                      variant={employee.status === "active" ? "danger" : "success"}
                    />
                  ) : null}
                </View>
              </AppCard>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

function MiniMetric({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  assignmentCard: {
    alignItems: "center",
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderCurve: "continuous",
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    padding: 12,
  },
  assignmentCardSelected: {
    backgroundColor: "rgba(21, 101, 255, 0.28)",
    borderColor: colors.primaryLight,
  },
  assignmentInfo: {
    flex: 1,
    gap: 5,
  },
  assignmentStatus: {
    color: colors.primaryLight,
    fontSize: 13,
    fontWeight: "900",
    lineHeight: 18,
  },
  assignmentWarning: {
    color: colors.warning,
  },
  cancelButton: {
    flex: 1,
    minWidth: 132,
  },
  cardActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  checkMark: {
    color: colors.white,
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  content: {
    gap: 24,
    padding: 20,
    paddingTop: 28,
  },
  employeeCard: {
    gap: 16,
  },
  employeeDetail: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  employeeHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
  },
  employeeInfo: {
    flex: 1,
    gap: 4,
  },
  employeeName: {
    color: colors.white,
    fontFamily: "Poppins",
    fontSize: 18,
    fontWeight: "900",
  },
  error: {
    color: colors.danger,
    fontSize: 14,
    fontWeight: "900",
  },
  errorCard: {
    backgroundColor: "rgba(239, 68, 68, 0.12)",
    borderColor: "rgba(239, 68, 68, 0.36)",
  },
  formActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  formButton: {
    flex: 2,
    minWidth: 190,
  },
  formCard: {
    gap: 16,
  },
  groupLabel: {
    color: colors.primaryLight,
    fontFamily: "Inter",
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  inactiveText: {
    color: colors.muted,
  },
  list: {
    gap: 12,
  },
  metric: {
    backgroundColor: colors.input,
    borderColor: colors.border,
    borderCurve: "continuous",
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    gap: 4,
    minWidth: 92,
    padding: 12,
  },
  metricLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: "800",
  },
  metricValue: {
    color: colors.white,
    fontSize: 22,
    fontWeight: "900",
  },
  metricsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  roleGroup: {
    gap: 10,
  },
  roleOption: {
    alignItems: "center",
    backgroundColor: colors.input,
    borderColor: colors.border,
    borderCurve: "continuous",
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: 14,
  },
  roleOptionPressed: {
    opacity: 0.86,
  },
  roleOptionSelected: {
    backgroundColor: "rgba(21, 101, 255, 0.28)",
    borderColor: colors.primaryLight,
  },
  roleOptionText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "900",
  },
  roleOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  root: {
    backgroundColor: colors.background,
    flex: 1,
  },
  sectionTitle: {
    color: colors.white,
    fontFamily: "Poppins",
    fontSize: 20,
    fontWeight: "900",
  },
  smallButton: {
    height: 44,
    width: 120,
  },
  statusButton: {
    height: 44,
    width: 132,
  },
  statusText: {
    color: colors.primaryLight,
    fontSize: 13,
    fontWeight: "900",
    textTransform: "uppercase",
  },
});
