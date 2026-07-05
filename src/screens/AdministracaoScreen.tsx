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

const createModeLabels: Record<CreateMode, string> = {
  cliente: "Novo Cliente",
  funcionario: "Novo Funcionário",
  socio: "Novo Sócio",
};

const profileLabels: Record<UsuarioPerfil, string> = {
  cliente: "Cliente",
  dono: "Dono",
  funcionario: "Funcionário",
  socio: "Sócio",
};

export function AdministracaoScreen({ empresaId, isOwner, onBack }: AdministracaoScreenProps) {
  const [usuarios, setUsuarios] = React.useState<Usuario[]>([]);
  const [loadingUsers, setLoadingUsers] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [message, setMessage] = React.useState("");
  const [messageTone, setMessageTone] = React.useState<"error" | "success">("success");
  const [createMode, setCreateMode] = React.useState<CreateMode>("funcionario");
  const [editingUser, setEditingUser] = React.useState<Usuario | null>(null);
  const [form, setForm] = React.useState({
    cargo: "",
    email: "",
    nome: "",
    senhaTemporaria: "",
    telefone: "",
  });
  const [editForm, setEditForm] = React.useState({
    ativo: true,
    cargo: "",
    nome: "",
    telefone: "",
  });

  const canUseAdmin = Boolean(isOwner && empresaId);

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
      cargo: "",
      email: "",
      nome: "",
      senhaTemporaria: "",
      telefone: "",
    });
  }

  async function handleCreateUser() {
    if (!empresaId) {
      showError("Entre com login real de Dono para cadastrar usuários.");
      return;
    }

    if (!form.nome.trim() || !form.email.trim() || !form.senhaTemporaria.trim()) {
      showError("Preencha nome, e-mail e senha temporária.");
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      const input: AdminCreateUserInput = {
        cargo: form.cargo,
        email: form.email,
        empresaId,
        nome: form.nome,
        perfil: createMode,
        senhaTemporaria: form.senhaTemporaria,
        telefone: form.telefone,
      };

      await adminService.criarUsuario(input);
      resetCreateForm();
      showSuccess(`${createModeLabels[createMode]} cadastrado com sucesso.`);
      await loadUsers();
    } catch (error) {
      showError(getAdminErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  function startEdit(usuario: Usuario) {
    setEditingUser(usuario);
    setEditForm({
      ativo: adminService.usuarioEstaAtivo(usuario),
      cargo: usuario.cargo ?? "",
      nome: usuario.nome,
      telefone: usuario.telefone ?? "",
    });
    setMessage("");
  }

  async function handleUpdateUser() {
    if (!editingUser) {
      return;
    }

    if (!editForm.nome.trim()) {
      showError("Nome é obrigatório.");
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      await adminService.atualizarUsuario(editingUser.id, editForm);
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
              icon="~"
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
                      <View style={styles.userInfo}>
                        <Text selectable style={styles.userName}>
                          {usuario.nome}
                        </Text>
                        <Text selectable style={styles.userDetail}>
                          {usuario.email}
                        </Text>
                        <Text selectable style={styles.userDetail}>
                          Perfil: {profileLabels[usuario.perfil]} {usuario.cargo ? `- Cargo: ${usuario.cargo}` : ""}
                        </Text>
                      </View>
                      <StatusBadge label={active ? "Ativo" : "Inativo"} tone={active ? "approved" : "rejected"} />
                    </View>

                    <View style={styles.cardActions}>
                      <PrimaryButton
                        onPress={() => startEdit(usuario)}
                        style={styles.smallButton}
                        title="Editar"
                        variant="secondary"
                      />
                      <PrimaryButton
                        onPress={() => handlePasswordReset(usuario)}
                        style={styles.resetButton}
                        title="Resetar senha"
                        variant="secondary"
                      />
                      {active ? (
                        <PrimaryButton
                          onPress={() => handleDeactivateUser(usuario)}
                          style={styles.smallButton}
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
            <AppTextInput
              label="Nome"
              onChangeText={(value) => setEditForm((current) => ({ ...current, nome: value }))}
              placeholder="Nome do usuário"
              value={editForm.nome}
            />
            <AppTextInput
              label="Telefone"
              onChangeText={(value) => setEditForm((current) => ({ ...current, telefone: value }))}
              placeholder="(11) 99999-0000"
              value={editForm.telefone}
            />
            <AppTextInput
              label="Cargo"
              onChangeText={(value) => setEditForm((current) => ({ ...current, cargo: value }))}
              placeholder="Cargo ou função"
              value={editForm.cargo}
            />
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
            <View style={styles.cardActions}>
              <PrimaryButton loading={saving} onPress={handleUpdateUser} style={styles.saveButton} title="Salvar" />
              <PrimaryButton
                onPress={() => setEditingUser(null)}
                style={styles.smallButton}
                title="Cancelar"
                variant="secondary"
              />
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

          <AppTextInput label="Nome" onChangeText={(value) => updateForm("nome", value)} value={form.nome} />
          <AppTextInput
            autoCapitalize="none"
            keyboardType="email-address"
            label="E-mail"
            onChangeText={(value) => updateForm("email", value)}
            value={form.email}
          />
          <AppTextInput label="Telefone" onChangeText={(value) => updateForm("telefone", value)} value={form.telefone} />
          {createMode !== "cliente" ? (
            <AppTextInput label="Cargo" onChangeText={(value) => updateForm("cargo", value)} value={form.cargo} />
          ) : null}
          <AppTextInput
            label="Senha temporária"
            onChangeText={(value) => updateForm("senhaTemporaria", value)}
            secureTextEntry
            value={form.senhaTemporaria}
          />

          <PrimaryButton
            icon="+"
            loading={saving}
            onPress={handleCreateUser}
            title={`Salvar ${createModeLabels[createMode]}`}
          />
        </AppCard>
      </ScrollView>
    </View>
  );
}

function getAdminErrorMessage(error: unknown) {
  const code = typeof error === "object" && error && "code" in error ? String(error.code) : "";

  const messages: Record<string, string> = {
    "auth/email-already-in-use": "Este e-mail já possui acesso no Firebase.",
    "auth/invalid-email": "Informe um e-mail válido.",
    "auth/weak-password": "A senha temporária precisa ter pelo menos 6 caracteres.",
    "permission-denied": "Sem permissão no Firestore. Verifique as regras para o perfil Dono.",
  };

  if (messages[code]) {
    return messages[code];
  }

  return error instanceof Error ? error.message : "Não foi possível concluir a ação.";
}

const styles = StyleSheet.create({
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
  refreshButton: {
    height: 44,
    width: 132,
  },
  resetButton: {
    height: 44,
    width: 156,
  },
  root: {
    backgroundColor: colors.background,
    flex: 1,
  },
  saveButton: {
    height: 44,
    width: 130,
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
  smallButton: {
    height: 44,
    width: 124,
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
