import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";

import { AppCard } from "../components/app-card";
import { AppTextInput } from "../components/app-text-input";
import { PrimaryButton } from "../components/primary-button";
import { ScreenHeader } from "../components/screen-header";
import { StatusBadge } from "../components/status-badge";
import { adminService, type AdminCreateUserInput } from "../services/admin-service";
import colors from "../theme/colors";
import type { Usuario, UsuarioPerfil } from "../types/usuario";

type AdministracaoScreenProps = {
  empresaId?: string;
  isOwner: boolean;
  onBack: () => void;
};

type CreateMode = Extract<UsuarioPerfil, "funcionario" | "socio" | "cliente">;
type CargoOption = "Piscineiro" | "Supervisor" | "Sócio" | "Auxiliar" | "Administrativo" | "Outro";

const cargoOptions: CargoOption[] = ["Piscineiro", "Supervisor", "Sócio", "Auxiliar", "Administrativo", "Outro"];

const createModeLabels: Record<CreateMode, string> = {
  cliente: "Novo Cliente",
  funcionario: "Novo Funcionário",
  socio: "Novo Sócio",
};

const createdMessageLabels: Record<CreateMode, string> = {
  cliente: "Cliente criado com sucesso.",
  funcionario: "Funcionário criado com sucesso.",
  socio: "Sócio criado com sucesso.",
};

const profileLabels: Record<UsuarioPerfil, string> = {
  cliente: "Cliente",
  dono: "Dono",
  funcionario: "Funcionário",
  socio: "Sócio",
};

function generateTemporaryPassword() {
  return `CCP-${Math.floor(10000 + Math.random() * 90000)}`;
}

function getInitials(name: string) {
  const names = name.trim().split(/\s+/).filter(Boolean);

  if (names.length === 0) {
    return "CC";
  }

  return names
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function getCargoValue(selectedCargo: CargoOption, customCargo: string) {
  return selectedCargo === "Outro" ? customCargo.trim() : selectedCargo;
}

export function AdministracaoScreen({ empresaId, isOwner, onBack }: AdministracaoScreenProps) {
  const [usuarios, setUsuarios] = React.useState<Usuario[]>([]);
  const [loadingUsers, setLoadingUsers] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [message, setMessage] = React.useState("");
  const [messageTone, setMessageTone] = React.useState<"error" | "success">("success");
  const [createMode, setCreateMode] = React.useState<CreateMode>("funcionario");
  const [editingUser, setEditingUser] = React.useState<Usuario | null>(null);
  const [cargoMenuOpen, setCargoMenuOpen] = React.useState(false);
  const [editCargoMenuOpen, setEditCargoMenuOpen] = React.useState(false);
  const [selectedCargo, setSelectedCargo] = React.useState<CargoOption>("Piscineiro");
  const [customCargo, setCustomCargo] = React.useState("");
  const [editSelectedCargo, setEditSelectedCargo] = React.useState<CargoOption>("Piscineiro");
  const [editCustomCargo, setEditCustomCargo] = React.useState("");
  const [form, setForm] = React.useState({
    email: "",
    nome: "",
    senhaTemporaria: generateTemporaryPassword(),
    telefone: "",
  });
  const [editForm, setEditForm] = React.useState({
    ativo: true,
    nome: "",
    telefone: "",
  });

  const loadUsers = React.useCallback(async () => {
    if (!empresaId || !isOwner) {
      return;
    }

    setLoadingUsers(true);
    try {
      setUsuarios(await adminService.listarUsuarios(empresaId));
    } catch (error) {
      showError(getAdminErrorMessage(error));
    } finally {
      setLoadingUsers(false);
    }
  }, [empresaId, isOwner]);

  React.useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  React.useEffect(() => {
    setForm((current) => ({
      ...current,
      senhaTemporaria: generateTemporaryPassword(),
    }));
    setSelectedCargo(createMode === "socio" ? "Sócio" : "Piscineiro");
    setCustomCargo("");
    setCargoMenuOpen(false);
    setMessage("");
  }, [createMode]);

  function showSuccess(nextMessage: string) {
    setMessageTone("success");
    setMessage(nextMessage);
  }

  function showError(nextMessage: string) {
    setMessageTone("error");
    setMessage(nextMessage);
  }

  function updateForm(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function resetCreateForm() {
    setForm({
      email: "",
      nome: "",
      senhaTemporaria: generateTemporaryPassword(),
      telefone: "",
    });
    setSelectedCargo(createMode === "socio" ? "Sócio" : "Piscineiro");
    setCustomCargo("");
    setCargoMenuOpen(false);
  }

  function validateCreateForm() {
    if (!form.nome.trim()) {
      return "Informe o nome.";
    }

    if (!form.email.trim()) {
      return "Informe o e-mail.";
    }

    if (!form.telefone.trim()) {
      return "Informe o telefone.";
    }

    if (!form.senhaTemporaria.trim()) {
      return "Informe a senha temporária.";
    }

    if (createMode !== "cliente" && !getCargoValue(selectedCargo, customCargo)) {
      return "Informe o cargo.";
    }

    return "";
  }

  async function handleCreateUser() {
    if (!empresaId) {
      showError("Entre com login real de Dono para cadastrar usuários.");
      return;
    }

    const validationError = validateCreateForm();

    if (validationError) {
      showError(validationError);
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      const input: AdminCreateUserInput = {
        cargo: createMode === "cliente" ? undefined : getCargoValue(selectedCargo, customCargo),
        email: form.email,
        empresaId,
        nome: form.nome,
        perfil: createMode,
        senhaTemporaria: form.senhaTemporaria,
        telefone: form.telefone,
      };

      await adminService.criarUsuario(input);
      resetCreateForm();
      showSuccess(createdMessageLabels[createMode]);
      await loadUsers();
    } catch (error) {
      showError(getAdminErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  function startEdit(usuario: Usuario) {
    const userCargo = usuario.cargo ?? "";
    const knownCargo = cargoOptions.find((cargo) => cargo === userCargo);

    setEditingUser(usuario);
    setEditForm({
      ativo: adminService.usuarioEstaAtivo(usuario),
      nome: usuario.nome,
      telefone: usuario.telefone ?? "",
    });
    setEditSelectedCargo(knownCargo ?? "Outro");
    setEditCustomCargo(knownCargo ? "" : userCargo);
    setEditCargoMenuOpen(false);
    setMessage("");
  }

  async function handleUpdateUser() {
    if (!editingUser) {
      return;
    }

    if (!editForm.nome.trim()) {
      showError("Informe o nome.");
      return;
    }

    if (!editForm.telefone.trim()) {
      showError("Informe o telefone.");
      return;
    }

    if (editingUser.perfil !== "cliente" && !getCargoValue(editSelectedCargo, editCustomCargo)) {
      showError("Informe o cargo.");
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      await adminService.atualizarUsuario(editingUser.id, {
        ativo: editForm.ativo,
        cargo: editingUser.perfil === "cliente" ? undefined : getCargoValue(editSelectedCargo, editCustomCargo),
        nome: editForm.nome,
        telefone: editForm.telefone,
      });
      setEditingUser(null);
      showSuccess("Usuário atualizado com sucesso.");
      await loadUsers();
    } catch (error) {
      showError(getAdminErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  async function handleDeactivateUser(usuario: Usuario) {
    setSaving(true);
    setMessage("");

    try {
      await adminService.desativarUsuario(usuario.id);
      showSuccess("Usuário desativado com sucesso.");
      await loadUsers();
    } catch (error) {
      showError(getAdminErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  async function handlePasswordReset(usuario: Usuario) {
    setSaving(true);
    setMessage("");

    try {
      await adminService.resetarSenha(usuario.email);
      showSuccess(`E-mail de redefinição enviado para ${usuario.email}.`);
    } catch (error) {
      showError(getAdminErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  if (!isOwner) {
    return (
      <View style={styles.root}>
        <StatusBar style="light" />
        <ScrollView contentContainerStyle={styles.content} contentInsetAdjustmentBehavior="automatic">
          <ScreenHeader
            eyebrow="Acesso restrito"
            onBack={onBack}
            subtitle="Somente o perfil Dono pode visualizar o painel administrativo."
            title="Administração"
          />
          <AppCard tone="danger">
            <Text selectable style={styles.emptyText}>
              Você não tem permissão para acessar esta tela.
            </Text>
          </AppCard>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.content} contentInsetAdjustmentBehavior="automatic">
        <ScreenHeader
          eyebrow="Painel do Dono"
          onBack={onBack}
          subtitle="Gerencie usuários, funcionários, sócios e clientes do acesso Firebase."
          title="Administração"
        />

        {!empresaId ? (
          <AppCard tone="warning">
            <Text selectable style={styles.emptyText}>
              Entre com login real de Dono para carregar a empresa e gerenciar usuários. O Modo Teste continua ativo,
              mas não possui empresaId real para salvar no Firebase.
            </Text>
          </AppCard>
        ) : null}

        {message ? (
          <AppCard tone={messageTone === "success" ? "success" : "danger"}>
            <Text selectable style={styles.messageText}>
              {message}
            </Text>
          </AppCard>
        ) : null}

        <AppCard style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleBlock}>
              <Text style={styles.sectionTitle}>Usuários</Text>
              <Text selectable style={styles.sectionSubtitle}>
                {loadingUsers ? "Carregando usuários..." : `${usuarios.length} usuário(s) encontrados`}
              </Text>
            </View>
            <PrimaryButton
              icon="↻"
              loading={loadingUsers}
              onPress={loadUsers}
              style={styles.refreshButton}
              title="Atualizar"
              variant="secondary"
            />
          </View>

          <View style={styles.userList}>
            {usuarios.length > 0 ? (
              usuarios.map((usuario) => {
                const active = adminService.usuarioEstaAtivo(usuario);

                return (
                  <AppCard key={usuario.id} style={styles.userCard}>
                    <View style={styles.userHeader}>
                      <View style={styles.avatar}>
                        <Text style={styles.avatarText}>{getInitials(usuario.nome)}</Text>
                      </View>
                      <View style={styles.userInfo}>
                        <Text selectable style={styles.userName}>
                          {usuario.nome}
                        </Text>
                        <Text selectable style={styles.userDetail}>
                          {usuario.email}
                        </Text>
                        <Text selectable style={styles.userDetail}>
                          Cargo: {usuario.cargo || "Não informado"}
                        </Text>
                        <Text selectable style={styles.userDetail}>
                          Perfil: {profileLabels[usuario.perfil]}
                        </Text>
                      </View>
                      <StatusBadge label={active ? "Ativo" : "Inativo"} tone={active ? "approved" : "rejected"} />
                    </View>

                    <View style={styles.cardActions}>
                      <PrimaryButton
                        icon="✎"
                        onPress={() => startEdit(usuario)}
                        style={styles.actionButton}
                        title="Editar"
                        variant="secondary"
                      />
                      <PrimaryButton
                        icon="↺"
                        onPress={() => handlePasswordReset(usuario)}
                        style={styles.resetButton}
                        title="Redefinir senha"
                        variant="secondary"
                      />
                      {active ? (
                        <PrimaryButton
                          icon="×"
                          onPress={() => handleDeactivateUser(usuario)}
                          style={styles.actionButton}
                          title="Desativar"
                          variant="danger"
                        />
                      ) : null}
                    </View>
                  </AppCard>
                );
              })
            ) : (
              <Text selectable style={styles.emptyText}>
                Nenhum usuário carregado ainda.
              </Text>
            )}
          </View>
        </AppCard>

        {editingUser ? (
          <AppCard style={styles.section}>
            <Text style={styles.sectionTitle}>Editar usuário</Text>
            <Text selectable style={styles.sectionSubtitle}>
              {editingUser.email} - {profileLabels[editingUser.perfil]}
            </Text>
            <View style={styles.formGrid}>
              <AppTextInput
                icon="👤"
                label="Nome"
                onChangeText={(value) => setEditForm((current) => ({ ...current, nome: value }))}
                placeholder="Nome do usuário"
                style={styles.inputControl}
                value={editForm.nome}
              />
              <AppTextInput
                icon="☎"
                label="Telefone"
                onChangeText={(value) => setEditForm((current) => ({ ...current, telefone: value }))}
                placeholder="(11) 99999-0000"
                style={styles.inputControl}
                value={editForm.telefone}
              />
            </View>

            {editingUser.perfil !== "cliente" ? (
              <CargoSelect
                customCargo={editCustomCargo}
                isOpen={editCargoMenuOpen}
                label="Cargo"
                onChangeCustomCargo={setEditCustomCargo}
                onSelect={(cargo) => {
                  setEditSelectedCargo(cargo);
                  setEditCargoMenuOpen(false);
                }}
                onToggle={() => setEditCargoMenuOpen((current) => !current)}
                selectedCargo={editSelectedCargo}
              />
            ) : null}

            <View style={styles.modeOptions}>
              {[true, false].map((activeOption) => (
                <Pressable
                  accessibilityRole="button"
                  key={String(activeOption)}
                  onPress={() => setEditForm((current) => ({ ...current, ativo: activeOption }))}
                  style={({ pressed }) => [
                    styles.modeOption,
                    editForm.ativo === activeOption && styles.modeOptionSelected,
                    pressed && styles.modeOptionPressed,
                  ]}
                >
                  <Text style={styles.modeOptionText}>{activeOption ? "Ativo" : "Inativo"}</Text>
                </Pressable>
              ))}
            </View>
            <View style={styles.fullWidthActions}>
              <PrimaryButton loading={saving} onPress={handleUpdateUser} title="Salvar" />
              <PrimaryButton onPress={() => setEditingUser(null)} title="Cancelar" variant="secondary" />
            </View>
          </AppCard>
        ) : null}

        <AppCard style={styles.section}>
          <Text style={styles.sectionTitle}>Cadastrar acesso</Text>
          <View style={styles.modeOptions}>
            {(Object.keys(createModeLabels) as CreateMode[]).map((mode) => (
              <Pressable
                accessibilityRole="button"
                key={mode}
                onPress={() => setCreateMode(mode)}
                style={({ pressed }) => [
                  styles.modeOption,
                  createMode === mode && styles.modeOptionSelected,
                  pressed && styles.modeOptionPressed,
                ]}
              >
                <Text style={styles.modeOptionText}>{createModeLabels[mode]}</Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.formGrid}>
            <AppTextInput
              icon="👤"
              label="Nome"
              onChangeText={(value) => updateForm("nome", value)}
              placeholder="Nome completo"
              style={styles.inputControl}
              value={form.nome}
            />
            <AppTextInput
              autoCapitalize="none"
              icon="@"
              keyboardType="email-address"
              label="E-mail"
              onChangeText={(value) => updateForm("email", value)}
              placeholder="email@crystalclear.com"
              style={styles.inputControl}
              value={form.email}
            />
            <AppTextInput
              icon="☎"
              label="Telefone"
              onChangeText={(value) => updateForm("telefone", value)}
              placeholder="(11) 99999-0000"
              style={styles.inputControl}
              value={form.telefone}
            />
          </View>

          {createMode !== "cliente" ? (
            <CargoSelect
              customCargo={customCargo}
              isOpen={cargoMenuOpen}
              label="Cargo"
              onChangeCustomCargo={setCustomCargo}
              onSelect={(cargo) => {
                setSelectedCargo(cargo);
                setCargoMenuOpen(false);
              }}
              onToggle={() => setCargoMenuOpen((current) => !current)}
              selectedCargo={selectedCargo}
            />
          ) : null}

          <View style={styles.passwordRow}>
            <AppTextInput
              icon="🔐"
              label="Senha temporária"
              onChangeText={(value) => updateForm("senhaTemporaria", value)}
              secureTextEntry={false}
              style={styles.inputControl}
              value={form.senhaTemporaria}
            />
            <PrimaryButton
              icon="↻"
              onPress={() => updateForm("senhaTemporaria", generateTemporaryPassword())}
              style={styles.generateButton}
              title="Gerar nova senha"
              variant="secondary"
            />
          </View>

          <View style={styles.fullWidthActions}>
            <PrimaryButton icon="+" loading={saving} onPress={handleCreateUser} title="Salvar" />
            <PrimaryButton onPress={resetCreateForm} title="Cancelar" variant="secondary" />
          </View>
        </AppCard>
      </ScrollView>
    </View>
  );
}

type CargoSelectProps = {
  customCargo: string;
  isOpen: boolean;
  label: string;
  onChangeCustomCargo: (value: string) => void;
  onSelect: (cargo: CargoOption) => void;
  onToggle: () => void;
  selectedCargo: CargoOption;
};

function CargoSelect({
  customCargo,
  isOpen,
  label,
  onChangeCustomCargo,
  onSelect,
  onToggle,
  selectedCargo,
}: CargoSelectProps) {
  return (
    <View style={styles.selectField}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Pressable
        accessibilityLabel={`Selecionar ${label}`}
        accessibilityRole="button"
        onPress={onToggle}
        style={({ pressed }) => [styles.selectButton, pressed && styles.modeOptionPressed]}
      >
        <Text style={styles.selectIcon}>▾</Text>
        <Text style={styles.selectText}>{selectedCargo}</Text>
      </Pressable>

      {isOpen ? (
        <View style={styles.selectMenu}>
          {cargoOptions.map((cargo) => (
            <Pressable
              accessibilityRole="button"
              key={cargo}
              onPress={() => onSelect(cargo)}
              style={({ pressed }) => [
                styles.selectOption,
                selectedCargo === cargo && styles.selectOptionSelected,
                pressed && styles.modeOptionPressed,
              ]}
            >
              <Text style={styles.selectOptionText}>{cargo}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      {selectedCargo === "Outro" ? (
        <AppTextInput
          icon="✎"
          label="Cargo personalizado"
          onChangeText={onChangeCustomCargo}
          placeholder="Informe o cargo"
          style={styles.inputControl}
          value={customCargo}
        />
      ) : null}
    </View>
  );
}

function getAdminErrorMessage(error: unknown) {
  const code = typeof error === "object" && error && "code" in error ? String(error.code) : "";
  const message = error instanceof Error ? error.message : "";

  const messages: Record<string, string> = {
    "auth/email-already-in-use": "Este e-mail já possui acesso no Firebase.",
    "auth/invalid-email": "Informe um e-mail válido.",
    "auth/weak-password": "A senha temporária precisa ter pelo menos 6 caracteres.",
    EMAIL_EXISTS: "Este e-mail já possui acesso no Firebase.",
    INVALID_EMAIL: "Informe um e-mail válido.",
    OPERATION_NOT_ALLOWED: "Criação por e-mail e senha não está habilitada no Firebase Authentication.",
    WEAK_PASSWORD: "A senha temporária precisa ter pelo menos 6 caracteres.",
    "permission-denied": "Sem permissão no Firestore. Verifique as regras para o perfil Dono.",
  };

  if (messages[code]) {
    return messages[code];
  }

  if (messages[message]) {
    return messages[message];
  }

  return message || "Não foi possível concluir a ação.";
}

const styles = StyleSheet.create({
  actionButton: {
    height: 44,
    width: 126,
  },
  avatar: {
    alignItems: "center",
    backgroundColor: "rgba(21, 101, 255, 0.28)",
    borderColor: colors.borderStrong,
    borderCurve: "continuous",
    borderRadius: 22,
    borderWidth: 1,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  avatarText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "900",
  },
  cardActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  content: {
    gap: 20,
    padding: 20,
    paddingTop: 28,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 15,
    lineHeight: 22,
  },
  fieldLabel: {
    color: colors.textSecondary,
    fontFamily: "Inter",
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  formGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  fullWidthActions: {
    gap: 10,
  },
  generateButton: {
    alignSelf: "flex-end",
    height: 46,
    width: 190,
  },
  inputControl: {
    minWidth: 240,
  },
  messageText: {
    color: colors.textSecondary,
    fontSize: 15,
    fontWeight: "900",
    lineHeight: 22,
  },
  modeOption: {
    alignItems: "center",
    backgroundColor: colors.input,
    borderColor: colors.border,
    borderCurve: "continuous",
    borderRadius: 12,
    borderWidth: 1,
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: 14,
  },
  modeOptionPressed: {
    opacity: 0.86,
  },
  modeOptionSelected: {
    backgroundColor: "rgba(21, 101, 255, 0.28)",
    borderColor: colors.primaryLight,
  },
  modeOptionText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "900",
  },
  modeOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  passwordRow: {
    alignItems: "flex-end",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  refreshButton: {
    height: 44,
    width: 132,
  },
  resetButton: {
    height: 44,
    width: 176,
  },
  root: {
    backgroundColor: colors.background,
    flex: 1,
  },
  section: {
    gap: 16,
  },
  sectionHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    justifyContent: "space-between",
  },
  sectionSubtitle: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  sectionTitle: {
    color: colors.white,
    fontFamily: "Poppins",
    fontSize: 21,
    fontWeight: "900",
  },
  sectionTitleBlock: {
    flex: 1,
    gap: 5,
    minWidth: 220,
  },
  selectButton: {
    alignItems: "center",
    backgroundColor: colors.input,
    borderColor: colors.border,
    borderCurve: "continuous",
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    minHeight: 46,
    paddingHorizontal: 14,
  },
  selectField: {
    gap: 8,
  },
  selectIcon: {
    color: colors.primaryLight,
    fontSize: 16,
    fontWeight: "900",
  },
  selectMenu: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderCurve: "continuous",
    borderRadius: 14,
    borderWidth: 1,
    gap: 6,
    padding: 8,
  },
  selectOption: {
    borderCurve: "continuous",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  selectOptionSelected: {
    backgroundColor: "rgba(21, 101, 255, 0.28)",
  },
  selectOptionText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "900",
  },
  selectText: {
    color: colors.white,
    flex: 1,
    fontSize: 14,
    fontWeight: "900",
  },
  userCard: {
    backgroundColor: colors.card,
    gap: 14,
  },
  userDetail: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  userHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
  },
  userInfo: {
    flex: 1,
    gap: 5,
  },
  userList: {
    gap: 12,
  },
  userName: {
    color: colors.white,
    fontFamily: "Poppins",
    fontSize: 18,
    fontWeight: "900",
  },
});
