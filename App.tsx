import React, { useState } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AdministracaoScreen } from "./src/screens/AdministracaoScreen";
import { AgendaScreen } from "./src/screens/AgendaScreen";
import { AtendimentoScreen } from "./src/screens/AtendimentoScreen";
import { ClienteAreaScreen } from "./src/screens/ClienteAreaScreen";
import { ClientsScreen } from "./src/screens/clients-screen";
import { ClientDetailScreen } from "./src/screens/client-detail-screen";
import { EditClientScreen } from "./src/screens/edit-client-screen";
import { EquipeScreen } from "./src/screens/EquipeScreen";
import { FirebaseDiagnosticsScreen } from "./src/screens/FirebaseDiagnosticsScreen";
import { FinanceiroScreen } from "./src/screens/FinanceiroScreen";
import { HistoricoScreen } from "./src/screens/HistoricoScreen";
import { HomeScreen } from "./src/screens/home-screen";
import { LoginScreen, type TestUserRole } from "./src/screens/login-screen";
import { NewClientScreen } from "./src/screens/new-client-screen";
import { ProdutosScreen } from "./src/screens/produtos-screen";
import { SplashScreen } from "./src/screens/splash-screen";
import { authService } from "./src/services/auth-service";
import { usuariosRepository } from "./src/repositories/usuarios-repository";
import colors from "./src/theme/colors";
import type { AgendaItem, AgendaStatus } from "./src/types/agenda";
import type { AttendanceRecord } from "./src/types/attendance";
import type { Client, ClientFormData } from "./src/types/client";
import type { Employee, EmployeeFormData } from "./src/types/employee";
import type { PaymentStatuses } from "./src/types/finance";
import type { Usuario, UsuarioPerfil } from "./src/types/usuario";
import {
  initialProductRequests,
  type ProductRequest,
  type ProductRequestItem,
  type ProductRequestItemStatus,
  type ProductRequestStatus,
} from "./src/types/product-request";

const initialAgendaItems: AgendaItem[] = [
  {
    id: "1",
    clientName: "Condominio Lago Azul",
    neighborhood: "Jardim Europa",
    address: "Rua das Aguas, 120",
    visitDate: "Hoje",
    data: "Hoje",
    assignedEmployeeId: "owner-willian",
    assignedEmployeeName: "Willian/Dono",
    funcionarioId: "owner-willian",
    origem: "Automatica",
    status: "pending",
  },
  {
    id: "2",
    clientName: "Marina Costa",
    neighborhood: "Vila Mariana",
    address: "Avenida Primavera, 88",
    visitDate: "Hoje",
    data: "Hoje",
    assignedEmployeeId: "partner-demo",
    assignedEmployeeName: "Socio Demo",
    funcionarioId: "partner-demo",
    origem: "Automatica",
    status: "pending",
  },
  {
    id: "3",
    clientName: "Academia Aqua Fit",
    neighborhood: "Centro",
    address: "Rua do Mercado, 40",
    visitDate: "Hoje",
    data: "Hoje",
    assignedEmployeeId: "staff-demo",
    assignedEmployeeName: "Funcionario Demo",
    funcionarioId: "staff-demo",
    origem: "Automatica",
    status: "in-progress",
  },
];

const initialEmployees: Employee[] = [
  {
    email: "willian@crystalclear.com",
    id: "owner-willian",
    name: "Willian/Dono",
    phone: "(11) 99999-0000",
    role: "owner",
    status: "active",
  },
  {
    email: "socio@crystalclear.com",
    id: "partner-demo",
    name: "Socio Demo",
    phone: "(11) 98888-0000",
    role: "partner",
    status: "active",
  },
  {
    email: "funcionario@crystalclear.com",
    id: "staff-demo",
    name: "Funcionario Demo",
    phone: "(11) 97777-0000",
    role: "staff",
    status: "active",
  },
];

type AppScreen =
  | "login"
  | "splash"
  | "home"
  | "clients"
  | "new-client"
  | "edit-client"
  | "client-detail"
  | "products"
  | "attendance"
  | "history"
  | "agenda"
  | "team"
  | "admin"
  | "finance"
  | "client-area"
  | "firebase-diagnostics";

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<AppScreen>("splash");
  const [activeRole, setActiveRole] = useState<TestUserRole>("owner");
  const [authenticatedUserProfile, setAuthenticatedUserProfile] = useState<Usuario | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [attendances, setAttendances] = useState<AttendanceRecord[]>([]);
  const [agendaItems, setAgendaItems] = useState<AgendaItem[]>(initialAgendaItems);
  const [employees, setEmployees] = useState<Employee[]>(initialEmployees);
  const [paymentStatuses, setPaymentStatuses] = useState<PaymentStatuses>({});
  const [productRequests, setProductRequests] = useState<ProductRequest[]>(initialProductRequests);
  const [selectedAgendaItemId, setSelectedAgendaItemId] = useState<string | null>(null);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const selectedClient = clients.find((client) => client.id === selectedClientId);
  const selectedAgendaItem = agendaItems.find((item) => item.id === selectedAgendaItemId);
  const activeEmployee =
    authenticatedUserProfile?.funcionarioId
      ? employees.find((employee) => employee.id === authenticatedUserProfile.funcionarioId) ?? employees[0]
      : activeRole === "owner"
      ? employees.find((employee) => employee.role === "owner") ?? employees[0]
      : employees.find((employee) => employee.status === "active" && employee.role !== "owner") ?? employees[0];
  const visibleAgendaItems =
    activeRole === "staff" && activeEmployee
      ? agendaItems.filter((item) => item.assignedEmployeeId === activeEmployee.id)
      : agendaItems;
  const visibleAttendances =
    activeRole === "staff" && activeEmployee
      ? attendances.filter((attendance) => attendance.employeeId === activeEmployee.id)
      : attendances;
  const visibleClientNames = new Set(visibleAgendaItems.map((item) => item.clientName));
  const visibleProductRequests =
    activeRole === "staff"
      ? productRequests.filter((request) => visibleClientNames.has(request.clientName))
      : productRequests;
  const productsPendingCount = visibleProductRequests.reduce(
    (total, request) =>
      total + request.items.filter((item) => item.status === "approved").length,
    0,
  );
  const pendingProductApprovalCount = visibleProductRequests.filter(
    (request) => request.status === "pending-approval",
  ).length;
  const pendingPaymentCount = clients.filter(
    (client) => hasMonthlyValue(client) && paymentStatuses[client.id] !== "paid",
  ).length;
  const completionSummary = {
    approvedProducts: visibleProductRequests.reduce(
      (total, request) =>
        total +
        request.items.filter((item) => item.status === "approved" || item.status === "delivered").length,
      0,
    ),
    completedAttendances: visibleAttendances.length,
    registeredPhotos: visibleAttendances.reduce(
      (total, attendance) =>
        total + (attendance.beforePhotoUri ? 1 : 0) + (attendance.afterPhotoUri ? 1 : 0),
      0,
    ),
    requestedProducts: visibleProductRequests.reduce((total, request) => total + request.items.length, 0),
  };
  const employeeSummaries = employees.map((employee) => {
    const assignedItems = agendaItems.filter((item) => item.assignedEmployeeId === employee.id);

    return {
      assigned: assignedItems.length,
      completed: assignedItems.filter((item) => item.status === "finished").length,
      employeeName: employee.name,
      pending: assignedItems.filter((item) => item.status !== "finished").length,
    };
  });
  const dashboardMetrics = [
    {
      helper: "Itens planejados para hoje",
      id: "agenda",
      label: "Piscinas do dia",
      tone: colors.primary,
      value: String(visibleAgendaItems.length),
    },
    {
      helper: "Atendimentos salvos no historico",
      id: "completed",
      label: "Atendimentos concluidos",
      tone: colors.success,
      value: String(visibleAttendances.length),
    },
    {
      helper: "Itens aprovados ainda nao entregues",
      id: "products",
      label: "Produtos pendentes",
      tone: colors.warning,
      value: String(productsPendingCount),
    },
    {
      helper: "Aguardando resposta do cliente",
      id: "client-area",
      label: "Solicitacoes pendentes",
      tone: colors.primary,
      value: String(pendingProductApprovalCount),
    },
    {
      helper: "Clientes com cobranca em aberto",
      id: "payments",
      label: "Pagamentos pendentes",
      tone: colors.danger,
      value: String(pendingPaymentCount),
    },
  ];
  const visibleDashboardMetrics =
    activeRole === "staff"
      ? dashboardMetrics.filter((metric) => metric.id !== "payments")
      : dashboardMetrics;
  const canAccessFinance = activeRole === "owner";
  const canAccessAdmin = authenticatedUserProfile ? authenticatedUserProfile.perfil === "dono" : activeRole === "owner";
  const profileLabel =
    activeRole === "staff" && activeEmployee
      ? `${getProfileLabel(activeRole)} - ${activeEmployee.name}`
      : getProfileLabel(activeRole);
  const testClient = clients[0] ?? fallbackTestClient;
  const testClientPaymentStatus = paymentStatuses[testClient.id] ?? "pending";

  function handleLogin(role: TestUserRole) {
    setAuthenticatedUserProfile(null);
    setActiveRole(role);
    setCurrentScreen(role === "client" ? "client-area" : "home");
  }

  async function handleFirebaseLogin(email: string, senha: string) {
    if (!email || !senha) {
      throw new Error("Informe e-mail e senha para entrar.");
    }

    try {
      const credential = await authService.login(email, senha);
      const profile = await usuariosRepository.getById(credential.user.uid);

      if (!profile) {
        throw new Error("Usuário autenticado, mas perfil ainda não configurado.");
      }

      const isActiveProfile = profile.ativo ?? profile.status === "ativo";

      if (!isActiveProfile) {
        throw new Error("Seu usuario esta inativo ou pendente. Fale com o administrador.");
      }

      setAuthenticatedUserProfile(profile);
      setActiveRole(mapUsuarioPerfilToTestRole(profile.perfil));
      setCurrentScreen(profile.perfil === "cliente" ? "client-area" : "home");
    } catch (error) {
      throw new Error(getAuthErrorMessage(error));
    }
  }

  async function handlePasswordReset(email: string) {
    try {
      await authService.resetarSenha(email);
    } catch (error) {
      throw new Error(getAuthErrorMessage(error));
    }
  }

  async function handleSwitchProfile() {
    if (authenticatedUserProfile) {
      await authService.logout().catch((error: unknown) => console.warn("Falha ao sair do Firebase.", error));
      setAuthenticatedUserProfile(null);
    }

    setCurrentScreen("login");
  }

  function handleSaveClient(clientData: ClientFormData) {
    const newClient: Client = {
      id: String(Date.now()),
      ...clientData,
    };

    setClients((currentClients) => [newClient, ...currentClients]);
    setCurrentScreen("clients");
  }

  function handleCreateEmployee(employeeData: EmployeeFormData) {
    const newEmployee: Employee = {
      id: String(Date.now()),
      ...employeeData,
    };

    setEmployees((currentEmployees) => [...currentEmployees, newEmployee]);
  }

  function handleUpdateEmployee(employeeId: string, employeeData: EmployeeFormData) {
    setEmployees((currentEmployees) =>
      currentEmployees.map((employee) =>
        employee.id === employeeId ? { id: employee.id, ...employeeData } : employee,
      ),
    );
  }

  function handleToggleEmployeeStatus(employeeId: string) {
    setEmployees((currentEmployees) =>
      currentEmployees.map((employee) =>
        employee.id === employeeId
          ? { ...employee, status: employee.status === "active" ? "inactive" : "active" }
          : employee,
      ),
    );
  }

  function handleOpenClient(clientId: string) {
    setSelectedClientId(clientId);
    setCurrentScreen("client-detail");
  }

  function handleUpdateClient(clientData: ClientFormData) {
    if (!selectedClientId) {
      return;
    }

    setClients((currentClients) =>
      currentClients.map((client) =>
        client.id === selectedClientId ? { id: client.id, ...clientData } : client,
      ),
    );
    setCurrentScreen("client-detail");
  }

  function handleDeleteClient() {
    if (!selectedClientId) {
      return;
    }

    setClients((currentClients) =>
      currentClients.filter((client) => client.id !== selectedClientId),
    );
    setSelectedClientId(null);
    setCurrentScreen("clients");
  }

  function handleSaveAttendance(attendance: AttendanceRecord) {
    const attendanceWithEmployee: AttendanceRecord = {
      ...attendance,
      employeeId: selectedAgendaItem?.assignedEmployeeId ?? activeEmployee?.id,
      employeeName: selectedAgendaItem?.assignedEmployeeName ?? activeEmployee?.name,
    };

    setAttendances((currentAttendances) => [attendanceWithEmployee, ...currentAttendances]);

    if (attendanceWithEmployee.missingProducts.length > 0) {
      const selectedClientForAttendance = clients.find(
        (client) => client.name === attendanceWithEmployee.clientName,
      );

      const productRequest: ProductRequest = {
        id: `${attendanceWithEmployee.id}-products`,
        attendanceId: attendanceWithEmployee.id,
        clientName: attendanceWithEmployee.clientName,
        neighborhood: selectedClientForAttendance?.neighborhood ?? "Nao informado",
        nextVisitDate: attendanceWithEmployee.attendanceDate,
        status: "pending-approval",
        items: attendanceWithEmployee.missingProducts.map((item) => ({
          ...item,
          status: "pending",
        })),
      };

      setProductRequests((currentRequests) => [productRequest, ...currentRequests]);
    }

    if (selectedAgendaItemId) {
      handleUpdateAgendaStatus(selectedAgendaItemId, "finished");
    }
  }

  function handleUpdateAgendaStatus(agendaItemId: string, status: AgendaStatus) {
    setAgendaItems((currentItems) =>
      currentItems.map((item) => (item.id === agendaItemId ? { ...item, status } : item)),
    );
  }

  function handleAddAgendaItem(client: Client, visitDate: string) {
    const defaultEmployee = activeEmployee ?? employees[0];
    const agendaItem: AgendaItem = {
      address: client.address,
      clientId: client.id,
      clientName: client.name,
      data: visitDate,
      id: String(Date.now()),
      neighborhood: client.neighborhood,
      assignedEmployeeId: defaultEmployee?.id,
      assignedEmployeeName: defaultEmployee?.name,
      funcionarioId: defaultEmployee?.id,
      origem: "Manual",
      status: "pending",
      visitDate,
    };

    setAgendaItems((currentItems) => [...currentItems, agendaItem]);
  }

  function handleAssignAgendaItem(agendaItemId: string, employeeId: string) {
    const employee = employees.find((currentEmployee) => currentEmployee.id === employeeId);

    if (!employee) {
      return;
    }

    setAgendaItems((currentItems) =>
      currentItems.map((item) =>
        item.id === agendaItemId
          ? {
              ...item,
              assignedEmployeeId: employee.id,
              assignedEmployeeName: employee.name,
              funcionarioId: employee.id,
            }
          : item,
      ),
    );
  }

  function handleAssignClientsToEmployee(employeeId: string, clientIds: string[]) {
    const employee = employees.find((currentEmployee) => currentEmployee.id === employeeId);

    if (!employee) {
      return;
    }

    const todayLabel = new Date().toLocaleDateString("pt-BR");

    setAgendaItems((currentItems) => {
      const selectedClientIds = new Set(clientIds);
      const nextItems = currentItems.map((item) => {
        const currentClient = clients.find((client) => client.name === item.clientName);
        const itemClientId = item.clientId ?? currentClient?.id;

        if (item.assignedEmployeeId === employee.id && itemClientId && !selectedClientIds.has(itemClientId)) {
          return {
            ...item,
            assignedEmployeeId: undefined,
            assignedEmployeeName: undefined,
            funcionarioId: undefined,
          };
        }

        return item;
      });

      clientIds.forEach((clientId) => {
        const client = clients.find((currentClient) => currentClient.id === clientId);

        if (!client) {
          return;
        }

        const existingIndex = nextItems.findIndex(
          (item) => item.clientId === client.id || item.clientName === client.name,
        );

        const assignedItem: AgendaItem = {
          address: client.address,
          clientId: client.id,
          clientName: client.name,
          data: todayLabel,
          id: existingIndex >= 0 ? nextItems[existingIndex].id : `${Date.now()}-${client.id}`,
          neighborhood: client.neighborhood,
          assignedEmployeeId: employee.id,
          assignedEmployeeName: employee.name,
          funcionarioId: employee.id,
          origem: "Manual",
          status: "pending",
          visitDate: todayLabel,
        };

        if (existingIndex >= 0) {
          nextItems[existingIndex] = {
            ...nextItems[existingIndex],
            ...assignedItem,
          };
        } else {
          nextItems.push(assignedItem);
        }
      });

      return nextItems;
    });
  }

  function handleStartAgendaAttendance(agendaItem: AgendaItem) {
    setSelectedAgendaItemId(agendaItem.id);
    handleUpdateAgendaStatus(agendaItem.id, "in-progress");
    setCurrentScreen("attendance");
  }

  function handleOpenStandaloneAttendance() {
    setSelectedAgendaItemId(null);
    setCurrentScreen("attendance");
  }

  function handleMarkPaymentAsPaid(clientId: string) {
    setPaymentStatuses((currentStatuses) => ({
      ...currentStatuses,
      [clientId]: "paid",
    }));
  }

  function handleConfirmProductDelivery(
    requestId: string,
    itemId: string,
    deliveryPhotoUri: string,
  ) {
    setProductRequests((currentRequests) =>
      currentRequests.map((request) =>
        request.id === requestId ? updateRequestItem(request, itemId, "delivered", deliveryPhotoUri) : request,
      ),
    );
  }

  function handleSetProductRequestItemStatus(
    requestId: string,
    itemId: string,
    status: Extract<ProductRequestItemStatus, "approved" | "rejected">,
  ) {
    setProductRequests((currentRequests) =>
      currentRequests.map((request) =>
        request.id === requestId ? updateRequestItem(request, itemId, status) : request,
      ),
    );
  }

  function handleSetAllProductRequestItemsStatus(
    requestId: string,
    status: Extract<ProductRequestItemStatus, "approved" | "rejected">,
  ) {
    setProductRequests((currentRequests) =>
      currentRequests.map((request) => {
        if (request.id !== requestId) {
          return request;
        }

        const nextItems = request.items.map((item) => {
          if (item.status === "delivered") {
            return item;
          }

          return {
            ...item,
            approvedAt:
              status === "approved" ? item.approvedAt ?? getTodayLabel() : item.approvedAt,
            status,
          };
        });

        return {
          ...request,
          items: nextItems,
          status: getRequestStatus(nextItems),
        };
      }),
    );
  }

  return (
    <SafeAreaProvider>
      {currentScreen === "splash" ? (
        <SplashScreen onFinish={() => setCurrentScreen("login")} />
      ) : null}

      {currentScreen === "login" ? (
        <LoginScreen
          onFirebaseLogin={handleFirebaseLogin}
          onLogin={handleLogin}
          onPasswordReset={handlePasswordReset}
        />
      ) : null}

      {currentScreen === "home" ? (
        <HomeScreen
          agendaItems={visibleAgendaItems}
          canAccessFinance={canAccessFinance}
          canAccessAdmin={canAccessAdmin}
          clients={clients}
          completionSummary={completionSummary}
          dashboardMetrics={visibleDashboardMetrics}
          employeeSummaries={activeRole === "owner" ? employeeSummaries : []}
          canManageTeam={activeRole === "owner"}
          onOpenClients={() => setCurrentScreen("clients")}
          onOpenProducts={() => setCurrentScreen("products")}
          onOpenAttendance={handleOpenStandaloneAttendance}
          onOpenHistory={() => setCurrentScreen("history")}
          onOpenAgenda={() => setCurrentScreen("agenda")}
          onOpenFinance={() => setCurrentScreen("finance")}
          onOpenFirebaseDiagnostics={() => setCurrentScreen("firebase-diagnostics")}
          onOpenClientArea={() => setCurrentScreen("client-area")}
          onOpenTeam={() => setCurrentScreen("team")}
          onOpenAdmin={() => setCurrentScreen("admin")}
          onStartAttendance={handleStartAgendaAttendance}
          onSwitchProfile={handleSwitchProfile}
          onLogout={handleSwitchProfile}
          profileLabel={profileLabel}
        />
      ) : null}

      {currentScreen === "clients" ? (
        <ClientsScreen
          clients={clients}
          onBack={() => setCurrentScreen("home")}
          onOpenClient={handleOpenClient}
          onNewClient={() => setCurrentScreen("new-client")}
        />
      ) : null}

      {currentScreen === "new-client" ? (
        <NewClientScreen
          onBack={() => setCurrentScreen("clients")}
          onSave={handleSaveClient}
        />
      ) : null}

      {currentScreen === "client-detail" && selectedClient ? (
        <ClientDetailScreen
          client={selectedClient}
          onBack={() => setCurrentScreen("clients")}
          onDelete={handleDeleteClient}
          onEdit={() => setCurrentScreen("edit-client")}
        />
      ) : null}

      {currentScreen === "edit-client" && selectedClient ? (
        <EditClientScreen
          client={selectedClient}
          onBack={() => setCurrentScreen("client-detail")}
          onSave={handleUpdateClient}
        />
      ) : null}

      {currentScreen === "products" ? (
        <ProdutosScreen
          clients={clients}
          onBack={() => setCurrentScreen("home")}
          onConfirmDelivery={handleConfirmProductDelivery}
          productRequests={visibleProductRequests}
        />
      ) : null}

      {currentScreen === "attendance" ? (
        <AtendimentoScreen
          clients={clients}
          onBack={() => setCurrentScreen("home")}
          onSaveAttendance={handleSaveAttendance}
          initialClientName={selectedAgendaItem?.clientName}
          responsibleName={selectedAgendaItem?.assignedEmployeeName ?? activeEmployee?.name}
        />
      ) : null}

      {currentScreen === "history" ? (
        <HistoricoScreen
          attendances={visibleAttendances}
          clients={clients}
          onBack={() => setCurrentScreen("home")}
        />
      ) : null}

      {currentScreen === "agenda" ? (
        <AgendaScreen
          agendaItems={visibleAgendaItems}
          clients={clients}
          employees={employees.filter((employee) => employee.status === "active")}
          onBack={() => setCurrentScreen("home")}
          onAddAgendaItem={handleAddAgendaItem}
          onAssignAgendaItem={handleAssignAgendaItem}
          canDistribute={activeRole === "owner"}
          onStartAttendance={handleStartAgendaAttendance}
          onUpdateStatus={handleUpdateAgendaStatus}
        />
      ) : null}

      {currentScreen === "team" ? (
        <EquipeScreen
          agendaItems={agendaItems}
          clients={clients}
          employees={employees}
          onBack={() => setCurrentScreen("home")}
          onAssignClientsToEmployee={handleAssignClientsToEmployee}
          onCreateEmployee={handleCreateEmployee}
          onToggleEmployeeStatus={handleToggleEmployeeStatus}
          onUpdateEmployee={handleUpdateEmployee}
        />
      ) : null}

      {currentScreen === "admin" ? (
        <AdministracaoScreen
          empresaId={authenticatedUserProfile?.empresaId}
          isOwner={canAccessAdmin}
          onBack={() => setCurrentScreen("home")}
        />
      ) : null}

      {currentScreen === "finance" && canAccessFinance ? (
        <FinanceiroScreen
          clients={clients}
          onBack={() => setCurrentScreen("home")}
          onMarkAsPaid={handleMarkPaymentAsPaid}
          paymentStatuses={paymentStatuses}
        />
      ) : null}

      {currentScreen === "client-area" ? (
        <ClienteAreaScreen
          attendances={attendances}
          backButtonTitle={activeRole === "client" ? "Trocar Perfil" : "Voltar"}
          client={testClient}
          onBack={activeRole === "client" ? handleSwitchProfile : () => setCurrentScreen("home")}
          onSetAllItemsStatus={handleSetAllProductRequestItemsStatus}
          onSetItemStatus={handleSetProductRequestItemStatus}
          paymentStatus={testClientPaymentStatus}
          productRequests={productRequests}
        />
      ) : null}

      {currentScreen === "firebase-diagnostics" ? (
        <FirebaseDiagnosticsScreen onBack={() => setCurrentScreen("home")} />
      ) : null}

    </SafeAreaProvider>
  );
}

function hasMonthlyValue(client: Client) {
  return typeof client.valorMensal === "number" && Number.isFinite(client.valorMensal);
}

function getProfileLabel(role: TestUserRole) {
  const labels: Record<TestUserRole, string> = {
    client: "Cliente (Teste)",
    owner: "Dono",
    staff: "Socio/Funcionario",
  };

  return labels[role];
}

function mapUsuarioPerfilToTestRole(perfil: UsuarioPerfil): TestUserRole {
  if (perfil === "cliente") {
    return "client";
  }

  if (perfil === "dono") {
    return "owner";
  }

  return "staff";
}

function getAuthErrorMessage(error: unknown) {
  if (error instanceof Error && error.message === "Usuário autenticado, mas perfil ainda não configurado.") {
    return "Usuário autenticado, mas perfil ainda não configurado.";
  }

  if (error instanceof Error && error.message === "Seu usuario esta inativo ou pendente. Fale com o administrador.") {
    return error.message;
  }

  const code = typeof error === "object" && error && "code" in error ? String(error.code) : "";

  const messages: Record<string, string> = {
    "auth/invalid-credential": "E-mail ou senha invalidos.",
    "auth/invalid-email": "Informe um e-mail valido.",
    "auth/missing-password": "Informe a senha.",
    "auth/network-request-failed": "Nao foi possivel conectar ao Firebase. Verifique sua internet.",
    "auth/too-many-requests": "Muitas tentativas. Aguarde alguns minutos e tente novamente.",
    "auth/user-disabled": "Este usuario esta desativado.",
    "auth/user-not-found": "Usuario nao encontrado.",
    "auth/wrong-password": "Senha incorreta.",
    "permission-denied": "Login realizado, mas o app nao conseguiu ler o perfil no Firestore por falta de permissao.",
    unavailable: "Firestore indisponivel no momento. Tente novamente em instantes.",
  };

  if (messages[code]) {
    return messages[code];
  }

  return error instanceof Error ? error.message : "Nao foi possivel autenticar.";
}

const fallbackTestClient: Client = {
  address: "Rua das Aguas, 120",
  city: "Sao Paulo",
  diaVencimento: 10,
  frequency: "once",
  id: "test-client",
  liters: 52000,
  name: "Condominio Lago Azul",
  neighborhood: "Jardim Europa",
  notes: "Cliente simulado para testar a area do cliente.",
  phone: "(11) 99999-0000",
  plan: "monthly",
  poolType: "Alvenaria",
  valorMensal: 450,
  weekDays: ["friday"],
};

function updateRequestItem(
  request: ProductRequest,
  itemId: string,
  status: ProductRequestItemStatus,
  deliveryPhotoUri?: string,
) {
  const nextItems = request.items.map((item) =>
    item.id === itemId
      ? {
          ...item,
          approvedAt:
            status === "approved" ? item.approvedAt ?? getTodayLabel() : item.approvedAt,
          deliveryPhotoUri: deliveryPhotoUri ?? item.deliveryPhotoUri,
          status,
        }
      : item,
  );

  return {
    ...request,
    items: nextItems,
    status: getRequestStatus(nextItems),
  };
}

function getTodayLabel() {
  return new Date().toLocaleDateString("pt-BR");
}

function getRequestStatus(items: ProductRequestItem[]): ProductRequestStatus {
  const approvalStatuses = items.map((item) =>
    item.status === "delivered" ? "approved" : item.status,
  );

  if (approvalStatuses.every((status) => status === "approved")) {
    return "approved";
  }

  if (approvalStatuses.every((status) => status === "rejected")) {
    return "rejected";
  }

  if (approvalStatuses.every((status) => status === "pending")) {
    return "pending-approval";
  }

  return "partially-approved";
}
