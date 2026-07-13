import { useEffect, useState } from "react";
import { Alert } from "react-native";
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
import { NewPoolScreen } from "./src/screens/new-pool-screen";
import { PrimeiroAcessoScreen } from "./src/screens/PrimeiroAcessoScreen";
import { ProdutosScreen } from "./src/screens/produtos-screen";
import { SplashScreen } from "./src/screens/splash-screen";
import { AuthProvider, useAuthContext } from "./src/contexts/auth-context";
import { clientesRepository } from "./src/repositories/clientes-repository";
import { funcionariosRepository } from "./src/repositories/funcionarios-repository";
import { piscinasRepository } from "./src/repositories/piscinas-repository";
import { visitasRepository } from "./src/repositories/visitas-repository";
import { firstAccessService } from "./src/services/first-access-service";
import { agendaService } from "./src/services/agenda-service";
import { atendimentoService } from "./src/services/atendimento-service";
import { storageService } from "./src/services/storage-service";
import colors from "./src/theme/colors";
import type { AgendaItem, AgendaStatus } from "./src/types/agenda";
import type { AttendanceRecord } from "./src/types/attendance";
import type { Atendimento, AtendimentoChecklist } from "./src/types/atendimento";
import type { Client, ClientFormData, ClientPlan, WeekDay } from "./src/types/client";
import type { Cliente } from "./src/types/cliente";
import type { Employee, EmployeeFormData } from "./src/types/employee";
import type { PaymentStatuses } from "./src/types/finance";
import type { Funcionario } from "./src/types/funcionario";
import type { Piscina, PiscinaFormData, PlanoAtendimento } from "./src/types/piscina";
import type { UsuarioPerfil } from "./src/types/usuario";
import type { Visita, VisitaOrigem, VisitaStatus } from "./src/types/visita";
import {
  initialProductRequests,
  type ProductRequest,
  type ProductRequestItem,
  type ProductRequestItemStatus,
  type ProductRequestStatus,
} from "./src/types/product-request";

const POOL_SAVE_OPERATION_TIMEOUT_MS = 15000;
const POOL_REFERENCE_PHOTO_UPLOAD_WARNING =
  "Piscina salva sem foto. A foto será enviada em uma próxima atualização.";

type PoolReferencePhotoUploadResult = {
  fotoReferenciaPath?: string;
  fotoReferenciaUrl?: string;
  warningMessage?: string;
};

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
  | "first-access"
  | "home"
  | "clients"
  | "new-client"
  | "new-pool"
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
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

function AppContent() {
  const {
    loading: authLoading,
    login: loginWithFirebase,
    logout: logoutFromFirebase,
    resetarSenha,
    usuario: authenticatedUserProfile,
  } = useAuthContext();
  const [currentScreen, setCurrentScreen] = useState<AppScreen>("splash");
  const [activeRole, setActiveRole] = useState<TestUserRole>("owner");
  const [firstAccessMessage, setFirstAccessMessage] = useState("");
  const [showFirstAccessButton, setShowFirstAccessButton] = useState(true);
  const [isTestMode, setIsTestMode] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [pools, setPools] = useState<Piscina[]>([]);
  const [clientsError, setClientsError] = useState("");
  const [clientsLoading, setClientsLoading] = useState(false);
  const [restrictedAccessMessage, setRestrictedAccessMessage] = useState("");
  const [attendances, setAttendances] = useState<AttendanceRecord[]>([]);
  const [agendaItems, setAgendaItems] = useState<AgendaItem[]>(initialAgendaItems);
  const [agendaError, setAgendaError] = useState("");
  const [agendaLoading, setAgendaLoading] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>(initialEmployees);
  const [paymentStatuses, setPaymentStatuses] = useState<PaymentStatuses>({});
  const [productRequests, setProductRequests] = useState<ProductRequest[]>(initialProductRequests);
  const [selectedAgendaItemId, setSelectedAgendaItemId] = useState<string | null>(null);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [selectedPoolId, setSelectedPoolId] = useState<string | null>(null);
  const selectedClient = clients.find((client) => client.id === selectedClientId);
  const selectedPool = pools.find((pool) => pool.id === selectedPoolId);
  const selectedClientPools = selectedClientId
    ? pools.filter((pool) => pool.clienteId === selectedClientId && pool.status !== "inativa")
    : [];
  const selectedAgendaItem = agendaItems.find((item) => item.id === selectedAgendaItemId);
  const selectedAgendaClient = clients.find(
    (client) => client.id === selectedAgendaItem?.clientId || client.name === selectedAgendaItem?.clientName,
  );
  const selectedAgendaPool = pools.find((pool) => pool.id === selectedAgendaItem?.piscinaId);
  const authenticatedPerfil = authenticatedUserProfile?.perfil;
  const isOperationalStaffView = isTestMode ? activeRole === "staff" : authenticatedPerfil === "funcionario";
  const canAccessClients =
    isTestMode ? activeRole === "owner" : authenticatedPerfil === "dono" || authenticatedPerfil === "socio";
  const canAccessFinance =
    isTestMode ? activeRole === "owner" : authenticatedPerfil === "dono" || authenticatedPerfil === "socio";
  const canAccessAdmin = isTestMode ? activeRole === "owner" : authenticatedPerfil === "dono";
  const canViewCommercialData = canAccessClients;
  const isEmployeeProfileView = isOperationalStaffView;
  const activeEmployee =
    authenticatedUserProfile?.funcionarioId
      ? employees.find((employee) => employee.id === authenticatedUserProfile.funcionarioId) ?? {
          email: authenticatedUserProfile.email,
          id: authenticatedUserProfile.funcionarioId,
          name: authenticatedUserProfile.nome,
          phone: "",
          role: authenticatedUserProfile.perfil === "socio" ? ("partner" as const) : ("staff" as const),
          status: "active" as const,
        }
      : activeRole === "owner"
      ? employees.find((employee) => employee.role === "owner") ?? employees[0]
      : employees.find((employee) => employee.status === "active" && employee.role !== "owner") ?? employees[0];
  const visibleAgendaItems =
    isOperationalStaffView && activeEmployee
      ? agendaItems.filter((item) => isAgendaItemAssignedToEmployee(item, activeEmployee.id))
      : agendaItems;
  const visibleAttendances =
    isOperationalStaffView && activeEmployee
      ? attendances.filter((attendance) =>
          isAttendanceVisibleForEmployee(attendance, visibleAgendaItems, activeEmployee.id),
        )
      : attendances;
  const visibleProductRequests =
    isOperationalStaffView && activeEmployee
      ? productRequests.filter((request) => isProductRequestVisibleForEmployee(request, visibleAgendaItems))
      : productRequests;
  const canRenderAttendance =
    !isEmployeeProfileView ||
    Boolean(selectedAgendaItem && activeEmployee && isAgendaItemAssignedToEmployee(selectedAgendaItem, activeEmployee.id));
  const productsPendingCount = visibleProductRequests.reduce(
    (total, request) =>
      total + request.items.filter((item) => item.status !== "delivered" && item.status !== "rejected").length,
    0,
  );
  const pendingProductApprovalCount = visibleProductRequests.filter(
    (request) => request.status === "pending-approval",
  ).length;
  const pendingPaymentCount = canAccessFinance
    ? clients.filter(
        (client) => hasMonthlyValue(client) && paymentStatuses[client.id] !== "paid",
      ).length
    : 0;
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
    !canAccessFinance
      ? dashboardMetrics.filter((metric) => metric.id !== "payments")
      : dashboardMetrics;
  const profileLabel =
    activeRole === "staff" && activeEmployee
      ? `${getProfileLabel(activeRole)} - ${activeEmployee.name}`
      : getProfileLabel(activeRole);
  const testClient = clients[0] ?? fallbackTestClient;
  const testClientPaymentStatus = paymentStatuses[testClient.id] ?? "pending";

  async function checkFirstAccessAvailability() {
    try {
      const hasOwner = await firstAccessService.hasConfiguredOwner();
      setShowFirstAccessButton(!hasOwner);
    } catch (error) {
      console.warn("Não foi possível verificar primeiro acesso.", error);
      setShowFirstAccessButton(true);
    }
  }

  useEffect(() => {
    void checkFirstAccessAvailability();
  }, []);

  useEffect(() => {
    if (authLoading || isTestMode || !authenticatedUserProfile) {
      return;
    }

    setActiveRole(mapUsuarioPerfilToTestRole(authenticatedUserProfile.perfil));

    if (currentScreen === "login") {
      setCurrentScreen(getInitialScreenForPerfil(authenticatedUserProfile.perfil));
    }
  }, [authLoading, authenticatedUserProfile, currentScreen, isTestMode]);

  useEffect(() => {
    if (
      authLoading ||
      isTestMode ||
      (authenticatedUserProfile?.perfil !== "dono" && authenticatedUserProfile?.perfil !== "socio")
    ) {
      return;
    }

    void loadFirestoreClients(authenticatedUserProfile.empresaId);
  }, [authLoading, authenticatedUserProfile?.empresaId, authenticatedUserProfile?.perfil, isTestMode]);

  useEffect(() => {
    if (
      authLoading ||
      isTestMode ||
      authenticatedUserProfile?.perfil !== "cliente" ||
      !authenticatedUserProfile.clienteId
    ) {
      return;
    }

    void loadFirestoreClientArea(authenticatedUserProfile.clienteId);
  }, [authLoading, authenticatedUserProfile?.clienteId, authenticatedUserProfile?.perfil, isTestMode]);

  useEffect(() => {
    if (authLoading || isTestMode || !authenticatedUserProfile) {
      return;
    }

    void loadFirestoreEmployees(authenticatedUserProfile.empresaId);
  }, [authLoading, authenticatedUserProfile?.empresaId, clients.length, isTestMode, pools.length]);

  useEffect(() => {
    if (authLoading || isTestMode || !authenticatedUserProfile) {
      return;
    }

    void loadFirestoreAgenda(authenticatedUserProfile);
  }, [
    authLoading,
    authenticatedUserProfile?.empresaId,
    authenticatedUserProfile?.funcionarioId,
    authenticatedUserProfile?.perfil,
    clients,
    employees,
    isTestMode,
  ]);

  useEffect(() => {
    if (authLoading || isTestMode || !authenticatedUserProfile) {
      return;
    }

    void loadFirestoreAttendances(authenticatedUserProfile);
  }, [agendaItems, authLoading, authenticatedUserProfile, clients, isTestMode, pools]);

  useEffect(() => {
    if (authLoading || currentScreen !== "splash") {
      return;
    }

    setCurrentScreen(
      !isTestMode && authenticatedUserProfile
        ? getInitialScreenForPerfil(authenticatedUserProfile.perfil)
        : "login"
    );
  }, [authLoading, authenticatedUserProfile, currentScreen, isTestMode]);

  useEffect(() => {
    if (
      currentScreen === "attendance" &&
      isEmployeeProfileView &&
      selectedAgendaItem &&
      activeEmployee &&
      !isAgendaItemAssignedToEmployee(selectedAgendaItem, activeEmployee.id)
    ) {
      setSelectedAgendaItemId(null);
      setCurrentScreen("agenda");
      return;
    }

    if (currentScreen === "attendance" && selectedAgendaItemId && !selectedAgendaItem && !agendaLoading) {
      setSelectedAgendaItemId(null);
      setCurrentScreen("agenda");
    }
  }, [activeEmployee, agendaLoading, currentScreen, isEmployeeProfileView, selectedAgendaItem, selectedAgendaItemId]);

  useEffect(() => {
    const restrictedScreens: AppScreen[] = [
      "admin",
      "client-detail",
      "client-area",
      "clients",
      "edit-client",
      "finance",
      "firebase-diagnostics",
      "new-client",
      "new-pool",
      "team",
    ];

    if (authLoading || !isEmployeeProfileView || !restrictedScreens.includes(currentScreen)) {
      return;
    }

    blockRestrictedEmployeeAccess();
  }, [authLoading, currentScreen, isEmployeeProfileView]);

  function blockRestrictedEmployeeAccess() {
    setRestrictedAccessMessage("Acesso restrito ao perfil funcionário.");
    setCurrentScreen("home");
  }

  function openScreenWithPermission(screen: AppScreen, allowed: boolean) {
    if (!allowed) {
      blockRestrictedEmployeeAccess();
      return;
    }

    setRestrictedAccessMessage("");
    setCurrentScreen(screen);
  }

  useEffect(() => {
    if (
      authLoading ||
      isTestMode ||
      currentScreen === "login" ||
      currentScreen === "splash" ||
      currentScreen === "first-access"
    ) {
      return;
    }

    if (!authenticatedUserProfile) {
      setCurrentScreen("login");
    }
  }, [authLoading, authenticatedUserProfile, currentScreen, isTestMode]);

  function handleLogin(role: TestUserRole) {
    setIsTestMode(true);
    setActiveRole(role);
    setRestrictedAccessMessage("");
    setCurrentScreen(role === "client" ? "client-area" : "home");
  }

  async function handleFirebaseLogin(email: string, senha: string) {
    if (!email || !senha) {
      throw new Error("Informe e-mail e senha para entrar.");
    }

    try {
      const profile = await loginWithFirebase(email, senha);
      setIsTestMode(false);

      if (!profile) {
        throw new Error("Usuário autenticado, mas perfil ainda não configurado.");
      }

      const isActiveProfile = profile.ativo;

      if (!isActiveProfile) {
        throw new Error("Seu usuario esta inativo ou pendente. Fale com o administrador.");
      }

      setActiveRole(mapUsuarioPerfilToTestRole(profile.perfil));
      setRestrictedAccessMessage("");
      setCurrentScreen(getInitialScreenForPerfil(profile.perfil));
    } catch (error) {
      throw new Error(getAuthErrorMessage(error));
    }
  }

  async function handlePasswordReset(email: string) {
    try {
      await resetarSenha(email);
    } catch (error) {
      throw new Error(getAuthErrorMessage(error));
    }
  }

  async function handleSwitchProfile() {
    if (!isTestMode && authenticatedUserProfile) {
      await logoutFromFirebase().catch((error: unknown) => console.warn("Falha ao sair do Firebase.", error));
    }

    setIsTestMode(false);
    setRestrictedAccessMessage("");
    setCurrentScreen("login");
  }

  async function loadFirestoreClients(empresaId: string) {
    setClientsLoading(true);
    setClientsError("");

    try {
      const [firestoreClients, firestorePools] = await Promise.all([
        clientesRepository.listByEmpresa(empresaId),
        piscinasRepository.listByEmpresa(empresaId),
      ]);
      const activePools = firestorePools
        .filter((pool) => pool.status !== "inativa")
        .map(sanitizePoolReferencePhoto);

      setClients(
        firestoreClients
          .filter((client) => client.status !== "inativo")
          .map((client) =>
            mapFirestoreClientToAppClient(
              client,
              activePools.find((pool) => pool.clienteId === client.id),
            ),
          ),
      );
      setPools(activePools);
    } catch (error) {
      setClientsError(getFirestoreFriendlyError(error, "Nao foi possivel carregar os clientes do Firestore."));
    } finally {
      setClientsLoading(false);
    }
  }

  async function loadFirestoreClientArea(clienteId: string) {
    setClientsLoading(true);
    setClientsError("");

    try {
      const [firestoreClient, firestorePools] = await Promise.all([
        clientesRepository.getById(clienteId),
        piscinasRepository.listByCliente(clienteId),
      ]);

      if (!firestoreClient || firestoreClient.status === "inativo") {
        setClients([]);
        setPools([]);
        return;
      }

      const activePools = firestorePools
        .filter((pool) => pool.status !== "inativa")
        .map(sanitizePoolReferencePhoto);
      setClients([
        mapFirestoreClientToAppClient(
          firestoreClient,
          activePools.find((pool) => pool.clienteId === firestoreClient.id),
        ),
      ]);
      setPools(activePools);
    } catch (error) {
      setClientsError(getFirestoreFriendlyError(error, "Nao foi possivel carregar os dados do cliente."));
    } finally {
      setClientsLoading(false);
    }
  }

  async function loadFirestoreAttendances(profile: NonNullable<typeof authenticatedUserProfile>) {
    try {
      const firestoreAttendances = await atendimentoService.listarPorEmpresa(profile.empresaId);
      const mappedAttendances = firestoreAttendances.map((attendance) =>
        mapFirestoreAttendanceToAttendanceRecord(attendance, clients, pools),
      );

      if (profile.perfil === "funcionario") {
        const employeeId = profile.funcionarioId;
        setAttendances(
          employeeId
            ? mappedAttendances.filter((attendance) =>
                isAttendanceVisibleForEmployee(attendance, agendaItems, employeeId),
              )
            : [],
        );
        return;
      }

      setAttendances(mappedAttendances);
    } catch (error) {
      setAgendaError(getFirestoreFriendlyError(error, "Nao foi possivel carregar o historico de atendimentos."));
    }
  }

  async function loadFirestoreEmployees(empresaId: string) {
    try {
      const firestoreEmployees = await funcionariosRepository.listByEmpresa(empresaId);
      const mappedEmployees = firestoreEmployees.map(mapFuncionarioToEmployee);

      setEmployees((currentEmployees) => {
        const ownerEmployee =
          authenticatedUserProfile?.perfil === "dono"
            ? {
                email: authenticatedUserProfile.email,
                id: authenticatedUserProfile.funcionarioId ?? authenticatedUserProfile.uid,
                name: authenticatedUserProfile.nome,
                phone: "",
                role: "owner" as const,
                status: "active" as const,
              }
            : currentEmployees.find((employee) => employee.role === "owner");

        return ownerEmployee ? [ownerEmployee, ...mappedEmployees] : mappedEmployees;
      });
    } catch (error) {
      setAgendaError(getFirestoreFriendlyError(error, "Nao foi possivel carregar funcionarios do Firestore."));
    }
  }

  async function loadFirestoreAgenda(profile: NonNullable<typeof authenticatedUserProfile>, diagnosticTraceId?: string) {
    setAgendaLoading(true);
    setAgendaError("");

    try {
      logSmartAgendaStep(diagnosticTraceId, "Inicio do carregamento da agenda Firestore.", {
        empresaId: profile.empresaId,
        perfil: profile.perfil,
        funcionarioId: profile.funcionarioId,
      });

      if (profile.perfil === "funcionario" && !profile.funcionarioId) {
        logSmartAgendaStep(diagnosticTraceId, "Agenda Firestore sem funcionarioId operacional. Interface sera limpa.");
        setAgendaItems([]);
        setAgendaError("Funcionario sem vinculo operacional configurado.");
        return;
      }

      const funcionarioId = profile.funcionarioId;
      const firestoreVisits =
        profile.perfil === "funcionario" && funcionarioId
          ? await visitasRepository.listByFuncionario(profile.empresaId, funcionarioId)
          : await visitasRepository.listByEmpresa(profile.empresaId);
      let agendaClients = clients;
      let agendaPools = pools;

      logSmartAgendaStep(diagnosticTraceId, "Visitas carregadas para atualizacao da interface.", {
        totalVisitas: firestoreVisits.length,
      });

      if (profile.perfil === "funcionario") {
        const operationalData = await loadOperationalDataForVisits(firestoreVisits);
        agendaClients = operationalData.clients;
        agendaPools = operationalData.pools;
      }

      if (profile.perfil === "funcionario") {
        setClients((currentClients) =>
          haveSameOperationalClients(currentClients, agendaClients) ? currentClients : agendaClients,
        );
        setPools(agendaPools);
      }

      logSmartAgendaStep(diagnosticTraceId, "Antes da atualizacao da interface da agenda.", {
        totalVisitas: firestoreVisits.length,
      });
      setAgendaItems(firestoreVisits.map((visit) => mapFirestoreVisitToAgendaItem(visit, agendaClients, employees, agendaPools)));
      logSmartAgendaStep(diagnosticTraceId, "Depois da atualizacao da interface da agenda.", {
        totalVisitas: firestoreVisits.length,
      });
    } catch (error) {
      logSmartAgendaError(diagnosticTraceId, "Erro ao carregar agenda Firestore.", error, {
        empresaId: profile.empresaId,
        perfil: profile.perfil,
        funcionarioId: profile.funcionarioId,
      });
      setAgendaError(getFirestoreFriendlyError(error, "Nao foi possivel carregar a agenda do Firestore."));
    } finally {
      setAgendaLoading(false);
    }
  }

  async function loadOperationalDataForVisits(visits: Visita[]) {
    const uniqueClienteIds = Array.from(new Set(visits.map((visit) => visit.clienteId).filter(Boolean)));
    const uniquePiscinaIds = Array.from(new Set(visits.map((visit) => visit.piscinaId).filter(Boolean)));
    const [visitClients, visitPools] = await Promise.all([
      Promise.all(uniqueClienteIds.map((clienteId) => clientesRepository.getById(clienteId))),
      Promise.all(uniquePiscinaIds.map((piscinaId) => piscinasRepository.getById(piscinaId))),
    ]);
    const validPools = visitPools.filter((pool): pool is Piscina => Boolean(pool));
    const validClients = visitClients.filter(
      (client): client is Cliente => client !== null && client.status !== "inativo",
    );

    return {
      clients: validClients
      .map((client) =>
        mapFirestoreClientToOperationalClient(
          client,
          validPools.find((pool) => pool.clienteId === client.id && pool.status !== "inativa"),
        ),
      ),
      pools: validPools.filter((pool) => pool.status !== "inativa").map(sanitizePoolReferencePhoto),
    };
  }

  async function handleSaveClient(clientData: ClientFormData) {
    if (!canAccessClients) {
      blockRestrictedEmployeeAccess();
      return;
    }

    if (!isTestMode && (authenticatedUserProfile?.perfil === "dono" || authenticatedUserProfile?.perfil === "socio")) {
      try {
        const clienteId = await clientesRepository.create({
          bairro: clientData.neighborhood,
          cidade: clientData.city,
          email: clientData.email ?? "",
          empresaId: authenticatedUserProfile.empresaId,
          endereco: clientData.address,
          nome: clientData.name,
          observacoes: clientData.notes,
          status: "ativo",
          telefone: clientData.phone,
        });
        const initialReferencePhotoUrl = getPersistedPhotoUri(clientData.referencePhotoUri);
        const initialReferencePhotoData = initialReferencePhotoUrl ? { fotoReferenciaUrl: initialReferencePhotoUrl } : {};
        const piscinaId = await piscinasRepository.create({
          clienteId,
          diaVencimento: clientData.diaVencimento,
          empresaId: authenticatedUserProfile.empresaId,
          ...initialReferencePhotoData,
          litros: clientData.liters,
          nome: clientData.poolName?.trim() || "Piscina principal",
          observacoes: clientData.poolNotes ?? "",
          planoAtendimento: mapClientPlanToPlanoAtendimento(clientData.plan),
          dataAvulsa: clientData.dataAtendimentoAvulso ?? "",
          diaMensal: clientData.diaMesAtendimento,
          diasAtendimento: clientData.diasAtendimento ?? [],
          status: "ativa",
          tipo: clientData.poolType,
          valorMensal: clientData.valorMensal,
        });
        const uploadedPhoto = await uploadPoolReferencePhotoIfNeeded(
          authenticatedUserProfile.empresaId,
          clienteId,
          piscinaId,
          clientData.referencePhotoUri,
        );

        const photoFields = getUploadedPhotoFields(uploadedPhoto);

        if (photoFields) {
          await piscinasRepository.update(piscinaId, photoFields);
        }

        const newClient: Client = {
          id: clienteId,
          piscinaId,
          ...clientData,
          referencePhotoUri: photoFields?.fotoReferenciaUrl ?? initialReferencePhotoUrl,
        };
        const newPool: Piscina = {
          clienteId,
          diaVencimento: clientData.diaVencimento,
          empresaId: authenticatedUserProfile.empresaId,
          fotoReferenciaPath: photoFields?.fotoReferenciaPath,
          fotoReferenciaUrl: photoFields?.fotoReferenciaUrl ?? initialReferencePhotoUrl,
          id: piscinaId,
          litros: clientData.liters,
          nome: clientData.poolName?.trim() || "Piscina principal",
          observacoes: clientData.poolNotes ?? "",
          planoAtendimento: mapClientPlanToPlanoAtendimento(clientData.plan),
          dataAvulsa: clientData.dataAtendimentoAvulso ?? "",
          diaMensal: clientData.diaMesAtendimento,
          diasAtendimento: clientData.diasAtendimento ?? [],
          status: "ativa",
          tipo: clientData.poolType,
          valorMensal: clientData.valorMensal,
        };

        await refreshFutureSmartAgendaForPool(authenticatedUserProfile.empresaId, newPool).catch((error: unknown) => {
          setAgendaError(getFirestoreFriendlyError(error, "Cliente salvo, mas nao foi possivel atualizar as visitas futuras."));
        });
        setClients((currentClients) => [newClient, ...currentClients]);
        setPools((currentPools) => [newPool, ...currentPools]);
        showPoolPhotoUploadWarning(uploadedPhoto.warningMessage);
        setCurrentScreen("clients");
        return;
      } catch (error) {
        throw new Error(getFirestoreFriendlyError(error, "Nao foi possivel salvar cliente e piscina no Firestore."));
      }
    }

    const newClient: Client = {
      id: String(Date.now()),
      ...clientData,
    };

    setClients((currentClients) => [newClient, ...currentClients]);
    setPools((currentPools) => [
      {
        clienteId: newClient.id,
        diaVencimento: newClient.diaVencimento,
        empresaId: "test-mode",
        fotoReferenciaUrl: getPersistedPhotoUri(newClient.referencePhotoUri),
        id: `${newClient.id}-pool`,
        litros: newClient.liters,
        nome: newClient.poolName?.trim() || "Piscina principal",
        observacoes: newClient.poolNotes ?? "",
        planoAtendimento: mapClientPlanToPlanoAtendimento(newClient.plan),
        dataAvulsa: newClient.dataAtendimentoAvulso ?? "",
        diaMensal: newClient.diaMesAtendimento,
        diasAtendimento: newClient.diasAtendimento ?? [],
        status: "ativa",
        tipo: newClient.poolType,
        valorMensal: newClient.valorMensal,
      },
      ...currentPools,
    ]);
    setCurrentScreen("clients");
  }

  async function handleSavePool(poolData: PiscinaFormData) {
    if (!canAccessClients) {
      blockRestrictedEmployeeAccess();
      return;
    }

    const linkedClient = clients.find((client) => client.id === poolData.clienteId);

    if (!linkedClient) {
      throw new Error("Cliente vinculado nao encontrado.");
    }

    if (!isTestMode && (authenticatedUserProfile?.perfil === "dono" || authenticatedUserProfile?.perfil === "socio")) {
      try {
        const firestoreClient = await clientesRepository.getById(poolData.clienteId);

        if (
          !firestoreClient ||
          firestoreClient.empresaId !== authenticatedUserProfile.empresaId ||
          firestoreClient.status !== "ativo"
        ) {
          throw new Error("Selecione um cliente real ativo da sua empresa antes de salvar a piscina.");
        }

        if (selectedPoolId) {
          const uploadedPhoto = await uploadPoolReferencePhotoIfNeeded(
            authenticatedUserProfile.empresaId,
            poolData.clienteId,
            selectedPoolId,
            poolData.fotoReferenciaUrl,
          );
          const photoFields = getUploadedPhotoFields(uploadedPhoto);
          const existingPhotoUrl =
            getPersistedPhotoUri(selectedPool?.fotoReferenciaUrl) ??
            getPersistedPhotoUri(poolData.fotoReferenciaUrl);
          const nextPoolData = {
            ...poolData,
            ...photoFields,
            fotoReferenciaPath: photoFields?.fotoReferenciaPath ?? selectedPool?.fotoReferenciaPath,
            fotoReferenciaUrl: photoFields?.fotoReferenciaUrl ?? existingPhotoUrl ?? "",
          };

          await withOperationTimeout(
            piscinasRepository.update(selectedPoolId, {
              clienteId: nextPoolData.clienteId,
              diaVencimento: nextPoolData.diaVencimento,
              empresaId: authenticatedUserProfile.empresaId,
              fotoReferenciaPath: nextPoolData.fotoReferenciaPath,
              fotoReferenciaUrl: nextPoolData.fotoReferenciaUrl,
              litros: nextPoolData.litros,
              nome: nextPoolData.nome,
              observacoes: nextPoolData.observacoes,
              planoAtendimento: nextPoolData.planoAtendimento,
              dataAvulsa: nextPoolData.dataAvulsa,
              diaMensal: nextPoolData.diaMensal,
              frequenciaSemanal: nextPoolData.frequenciaSemanal,
              diasAtendimento: nextPoolData.diasAtendimento,
              status: "ativa",
              tipo: nextPoolData.tipo,
              valorMensal: nextPoolData.valorMensal,
            }),
            "Tempo esgotado ao atualizar a piscina no Firestore.",
          );

          await refreshFutureSmartAgendaForPool(authenticatedUserProfile.empresaId, {
            ...selectedPool,
            ...nextPoolData,
            empresaId: authenticatedUserProfile.empresaId,
            id: selectedPoolId,
            status: "ativa",
          }).catch((error: unknown) => {
            setAgendaError(getFirestoreFriendlyError(error, "Piscina salva, mas nao foi possivel atualizar as visitas futuras."));
          });

          setPools((currentPools) =>
            currentPools.map((pool) =>
              pool.id === selectedPoolId
                ? {
                    ...pool,
                    ...nextPoolData,
                    empresaId: authenticatedUserProfile.empresaId,
                    status: "ativa",
                  }
                : pool,
            ),
          );
          setSelectedPoolId(null);
          setSelectedClientId(poolData.clienteId);
          showPoolPhotoUploadWarning(uploadedPhoto.warningMessage);
          setCurrentScreen("client-detail");
          return;
        }

        const initialPhotoUrl = getPersistedPhotoUri(poolData.fotoReferenciaUrl);
        const initialPhotoData = initialPhotoUrl
          ? {
              fotoReferenciaPath: poolData.fotoReferenciaPath,
              fotoReferenciaUrl: initialPhotoUrl,
            }
          : {};
        const piscinaId = await withOperationTimeout(
          piscinasRepository.create({
            clienteId: poolData.clienteId,
            diaVencimento: poolData.diaVencimento,
            empresaId: authenticatedUserProfile.empresaId,
            ...initialPhotoData,
            litros: poolData.litros,
            nome: poolData.nome,
            observacoes: poolData.observacoes,
            planoAtendimento: poolData.planoAtendimento,
            dataAvulsa: poolData.dataAvulsa,
            diaMensal: poolData.diaMensal,
            frequenciaSemanal: poolData.frequenciaSemanal,
            diasAtendimento: poolData.diasAtendimento,
            status: "ativa",
            tipo: poolData.tipo,
            valorMensal: poolData.valorMensal,
          }),
          "Tempo esgotado ao criar a piscina no Firestore.",
        );
        const uploadedPhoto = await uploadPoolReferencePhotoIfNeeded(
          authenticatedUserProfile.empresaId,
          poolData.clienteId,
          piscinaId,
          poolData.fotoReferenciaUrl,
        );

        const photoFields = getUploadedPhotoFields(uploadedPhoto);

        if (photoFields) {
          await withOperationTimeout(
            piscinasRepository.update(piscinaId, photoFields),
            "Tempo esgotado ao atualizar a foto da piscina no Firestore.",
          );
        }

        const savedPoolData = {
          ...poolData,
          ...initialPhotoData,
          ...photoFields,
          fotoReferenciaUrl: photoFields?.fotoReferenciaUrl ?? initialPhotoData.fotoReferenciaUrl ?? "",
        };
        const savedPool: Piscina = {
          ...savedPoolData,
          empresaId: authenticatedUserProfile.empresaId,
          id: piscinaId,
          status: "ativa",
        };

        await refreshFutureSmartAgendaForPool(authenticatedUserProfile.empresaId, savedPool).catch((error: unknown) => {
          setAgendaError(getFirestoreFriendlyError(error, "Piscina salva, mas nao foi possivel atualizar as visitas futuras."));
        });

        setPools((currentPools) => [savedPool, ...currentPools]);
        setSelectedClientId(poolData.clienteId);
        showPoolPhotoUploadWarning(uploadedPhoto.warningMessage);
        setCurrentScreen("client-detail");
        return;
      } catch (error) {
        throw new Error(getFirestoreFriendlyError(error, "Nao foi possivel salvar a piscina no Firestore."));
      }
    }

    if (selectedPoolId) {
      setPools((currentPools) =>
        currentPools.map((pool) =>
          pool.id === selectedPoolId
            ? {
                ...pool,
                ...poolData,
                empresaId: pool.empresaId,
                status: "ativa",
              }
            : pool,
        ),
      );
      setSelectedPoolId(null);
      setSelectedClientId(poolData.clienteId);
      setCurrentScreen("client-detail");
      return;
    }

    setPools((currentPools) => [
      {
        ...poolData,
        empresaId: "test-mode",
        id: String(Date.now()),
        status: "ativa",
      },
      ...currentPools,
    ]);
    setSelectedClientId(poolData.clienteId);
    setCurrentScreen("client-detail");
  }

  async function uploadPoolReferencePhotoIfNeeded(
    _empresaId: string,
    _clienteId: string,
    _piscinaId: string,
    fotoReferenciaUrl?: string,
  ): Promise<PoolReferencePhotoUploadResult> {
    if (!fotoReferenciaUrl || !isTemporaryPhotoUri(fotoReferenciaUrl)) {
      return {};
    }

    return {
      warningMessage: POOL_REFERENCE_PHOTO_UPLOAD_WARNING,
    };
  }

  function getUploadedPhotoFields(uploadedPhoto: PoolReferencePhotoUploadResult) {
    if (!uploadedPhoto.fotoReferenciaPath || !uploadedPhoto.fotoReferenciaUrl) {
      return undefined;
    }

    return {
      fotoReferenciaPath: uploadedPhoto.fotoReferenciaPath,
      fotoReferenciaUrl: uploadedPhoto.fotoReferenciaUrl,
    };
  }

  function showPoolPhotoUploadWarning(message?: string) {
    if (!message) {
      return;
    }

    Alert.alert("Aviso", message);
  }

  function isTemporaryPhotoUri(uri: string) {
    return isTemporaryLocalUri(uri);
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
    if (!canAccessClients) {
      blockRestrictedEmployeeAccess();
      return;
    }

    setSelectedClientId(clientId);
    setCurrentScreen("client-detail");
  }

  async function handleOpenNewPool(clientId?: string) {
    if (!canAccessClients) {
      blockRestrictedEmployeeAccess();
      return;
    }

    setSelectedPoolId(null);

    if (clientId) {
      setSelectedClientId(clientId);
    }

    if (!isTestMode && authenticatedUserProfile?.empresaId) {
      await loadFirestoreClients(authenticatedUserProfile.empresaId);
    }

    setCurrentScreen("new-pool");
  }

  function handleOpenEditPool(poolId: string) {
    if (!canAccessClients) {
      blockRestrictedEmployeeAccess();
      return;
    }

    const pool = pools.find((currentPool) => currentPool.id === poolId);

    if (!pool) {
      return;
    }

    setSelectedPoolId(poolId);
    setSelectedClientId(pool.clienteId);
    setCurrentScreen("new-pool");
  }

  async function handleDeletePool(poolId: string) {
    if (!canAccessClients) {
      blockRestrictedEmployeeAccess();
      return;
    }

    const pool = pools.find((currentPool) => currentPool.id === poolId);

    if (!pool) {
      throw new Error("Piscina nao encontrada.");
    }

    if (!isTestMode && (authenticatedUserProfile?.perfil === "dono" || authenticatedUserProfile?.perfil === "socio")) {
      try {
        await Promise.all([
          agendaService.removeFuturePendingVisitsForPool(authenticatedUserProfile.empresaId, poolId),
          piscinasRepository.delete(poolId),
        ]);

        if (pool.fotoReferenciaPath) {
          await storageService.remover(pool.fotoReferenciaPath).catch((error: unknown) => {
            console.warn("Nao foi possivel excluir a foto de referencia da piscina.", error);
          });
        }
      } catch (error) {
        throw new Error(getFirestoreFriendlyError(error, "Nao foi possivel excluir a piscina no Firestore."));
      }
    }

    setPools((currentPools) => currentPools.filter((currentPool) => currentPool.id !== poolId));
    setAgendaItems((currentItems) =>
      currentItems.filter((item) => item.piscinaId !== poolId || item.status === "finished"),
    );
    setClients((currentClients) =>
      currentClients.map((client) =>
        client.piscinaId === poolId
          ? {
              ...client,
              dataAtendimentoAvulso: "",
              diaMesAtendimento: undefined,
              diasAtendimento: [],
              liters: undefined,
              piscinaId: undefined,
              poolName: undefined,
              poolNotes: undefined,
              poolType: "",
              referencePhotoUri: undefined,
              valorMensal: 0,
            }
          : client,
      ),
    );
  }

  async function handleUpdateClient(clientData: ClientFormData) {
    if (!selectedClientId) {
      return;
    }

    if (!isTestMode && (authenticatedUserProfile?.perfil === "dono" || authenticatedUserProfile?.perfil === "socio")) {
      try {
        await clientesRepository.update(selectedClientId, {
          bairro: clientData.neighborhood,
          cidade: clientData.city,
          email: clientData.email ?? "",
          endereco: clientData.address,
          nome: clientData.name,
          observacoes: clientData.notes,
          telefone: clientData.phone,
        });

        if (clientData.piscinaId) {
          const piscinaId = clientData.piscinaId;
          const currentPool = pools.find((pool) => pool.id === piscinaId);
          const uploadedPhoto = await uploadPoolReferencePhotoIfNeeded(
            authenticatedUserProfile.empresaId,
            selectedClientId,
            piscinaId,
            clientData.referencePhotoUri,
          );
          const photoFields = getUploadedPhotoFields(uploadedPhoto);
          const existingPhotoUrl =
            getPersistedPhotoUri(currentPool?.fotoReferenciaUrl) ??
            getPersistedPhotoUri(clientData.referencePhotoUri);
          clientData = {
            ...clientData,
            referencePhotoUri: photoFields?.fotoReferenciaUrl ?? existingPhotoUrl,
          };
          await piscinasRepository.update(piscinaId, {
            diaVencimento: clientData.diaVencimento,
            fotoReferenciaPath: photoFields?.fotoReferenciaPath ?? currentPool?.fotoReferenciaPath,
            fotoReferenciaUrl: clientData.referencePhotoUri ?? "",
            litros: clientData.liters,
            nome: clientData.poolName?.trim() || "Piscina principal",
            observacoes: clientData.poolNotes ?? "",
            planoAtendimento: mapClientPlanToPlanoAtendimento(clientData.plan),
            dataAvulsa: clientData.dataAtendimentoAvulso ?? "",
            diaMensal: clientData.diaMesAtendimento,
            diasAtendimento: clientData.diasAtendimento ?? [],
            tipo: clientData.poolType,
            valorMensal: clientData.valorMensal,
          });
          await refreshFutureSmartAgendaForPool(authenticatedUserProfile.empresaId, {
            ...currentPool,
            clienteId: selectedClientId,
            diaVencimento: clientData.diaVencimento,
            empresaId: authenticatedUserProfile.empresaId,
            fotoReferenciaPath: photoFields?.fotoReferenciaPath ?? currentPool?.fotoReferenciaPath,
            fotoReferenciaUrl: clientData.referencePhotoUri ?? "",
            id: piscinaId,
            litros: clientData.liters,
            nome: clientData.poolName?.trim() || "Piscina principal",
            observacoes: clientData.poolNotes ?? "",
            planoAtendimento: mapClientPlanToPlanoAtendimento(clientData.plan),
            dataAvulsa: clientData.dataAtendimentoAvulso ?? "",
            diaMensal: clientData.diaMesAtendimento,
            diasAtendimento: clientData.diasAtendimento ?? [],
            status: "ativa",
            tipo: clientData.poolType,
            valorMensal: clientData.valorMensal,
          }).catch((error: unknown) => {
            setAgendaError(getFirestoreFriendlyError(error, "Cliente salvo, mas nao foi possivel atualizar as visitas futuras."));
          });
          showPoolPhotoUploadWarning(uploadedPhoto.warningMessage);
        } else {
          const initialReferencePhotoUrl = getPersistedPhotoUri(clientData.referencePhotoUri);
          const initialReferencePhotoData = initialReferencePhotoUrl ? { fotoReferenciaUrl: initialReferencePhotoUrl } : {};
          const piscinaId = await piscinasRepository.create({
            clienteId: selectedClientId,
            diaVencimento: clientData.diaVencimento,
            empresaId: authenticatedUserProfile.empresaId,
            ...initialReferencePhotoData,
            litros: clientData.liters,
            nome: clientData.poolName?.trim() || "Piscina principal",
            observacoes: clientData.poolNotes ?? "",
            planoAtendimento: mapClientPlanToPlanoAtendimento(clientData.plan),
            dataAvulsa: clientData.dataAtendimentoAvulso ?? "",
            diaMensal: clientData.diaMesAtendimento,
            diasAtendimento: clientData.diasAtendimento ?? [],
            status: "ativa",
            tipo: clientData.poolType,
            valorMensal: clientData.valorMensal,
          });
          const uploadedPhoto = await uploadPoolReferencePhotoIfNeeded(
            authenticatedUserProfile.empresaId,
            selectedClientId,
            piscinaId,
            clientData.referencePhotoUri,
          );

          const photoFields = getUploadedPhotoFields(uploadedPhoto);

          if (photoFields) {
            await piscinasRepository.update(piscinaId, photoFields);
          }

          clientData = {
            ...clientData,
            piscinaId,
            referencePhotoUri: photoFields?.fotoReferenciaUrl ?? initialReferencePhotoUrl,
          };
          await refreshFutureSmartAgendaForPool(authenticatedUserProfile.empresaId, {
            clienteId: selectedClientId,
            diaVencimento: clientData.diaVencimento,
            empresaId: authenticatedUserProfile.empresaId,
            fotoReferenciaPath: photoFields?.fotoReferenciaPath,
            fotoReferenciaUrl: clientData.referencePhotoUri ?? "",
            id: piscinaId,
            litros: clientData.liters,
            nome: clientData.poolName?.trim() || "Piscina principal",
            observacoes: clientData.poolNotes ?? "",
            planoAtendimento: mapClientPlanToPlanoAtendimento(clientData.plan),
            dataAvulsa: clientData.dataAtendimentoAvulso ?? "",
            diaMensal: clientData.diaMesAtendimento,
            diasAtendimento: clientData.diasAtendimento ?? [],
            status: "ativa",
            tipo: clientData.poolType,
            valorMensal: clientData.valorMensal,
          }).catch((error: unknown) => {
            setAgendaError(getFirestoreFriendlyError(error, "Cliente salvo, mas nao foi possivel atualizar as visitas futuras."));
          });
          showPoolPhotoUploadWarning(uploadedPhoto.warningMessage);
        }
      } catch (error) {
        throw new Error(getFirestoreFriendlyError(error, "Nao foi possivel atualizar cliente e piscina no Firestore."));
      }
    }

    setClients((currentClients) =>
      currentClients.map((client) =>
        client.id === selectedClientId ? { id: client.id, ...clientData } : client,
      ),
    );
    if (clientData.piscinaId) {
      setPools((currentPools) =>
        currentPools.map((pool) =>
          pool.id === clientData.piscinaId
            ? {
                ...pool,
                diaVencimento: clientData.diaVencimento,
                fotoReferenciaPath: pool.fotoReferenciaPath,
                fotoReferenciaUrl: getPersistedPhotoUri(clientData.referencePhotoUri),
                litros: clientData.liters,
                nome: clientData.poolName?.trim() || "Piscina principal",
                observacoes: clientData.poolNotes ?? "",
                planoAtendimento: mapClientPlanToPlanoAtendimento(clientData.plan),
                dataAvulsa: clientData.dataAtendimentoAvulso ?? "",
                diaMensal: clientData.diaMesAtendimento,
                diasAtendimento: clientData.diasAtendimento ?? [],
                tipo: clientData.poolType,
                valorMensal: clientData.valorMensal,
              }
            : pool,
        ),
      );
    }
    setCurrentScreen("client-detail");
  }

  async function handleDeleteClient() {
    if (!canAccessClients) {
      blockRestrictedEmployeeAccess();
      return;
    }

    if (!selectedClientId) {
      return;
    }

    if (!isTestMode && authenticatedUserProfile?.perfil === "dono") {
      await clientesRepository.update(selectedClientId, { status: "inativo" }).catch((error: unknown) => {
        console.warn("Nao foi possivel inativar cliente no Firestore.", error);
      });
    }

    setClients((currentClients) =>
      currentClients.filter((client) => client.id !== selectedClientId),
    );
    setSelectedClientId(null);
    setCurrentScreen("clients");
  }

  async function handleSaveAttendance(attendance: AttendanceRecord) {
    const completedItems = Array.isArray(attendance.completedItems) ? attendance.completedItems : [];
    const missingProducts = Array.isArray(attendance.missingProducts) ? attendance.missingProducts : [];
    const productsUsedItems = Array.isArray(attendance.productsUsedItems) ? attendance.productsUsedItems : [];
    const attendanceWithEmployee: AttendanceRecord = {
      ...attendance,
      completedItems,
      employeeId: selectedAgendaItem ? getAgendaAssignedEmployeeId(selectedAgendaItem) : activeEmployee?.id,
      employeeName: selectedAgendaItem?.assignedEmployeeName ?? activeEmployee?.name,
      missingProducts,
      productsUsedItems,
    };

    if (isEmployeeProfileView) {
      if (!selectedAgendaItem || !activeEmployee || !isAgendaItemAssignedToEmployee(selectedAgendaItem, activeEmployee.id)) {
        throw new Error("Funcionario so pode finalizar visitas atribuidas a ele.");
      }
    }

    if (!isTestMode && authenticatedUserProfile && selectedAgendaItem) {
      if (authenticatedUserProfile.perfil === "funcionario") {
        const assignedEmployeeId = selectedAgendaItem.assignedEmployeeId ?? selectedAgendaItem.funcionarioId;

        if (!authenticatedUserProfile.funcionarioId || assignedEmployeeId !== authenticatedUserProfile.funcionarioId) {
          throw new Error("Voce so pode finalizar visitas atribuidas a voce.");
        }
      }

      try {
        const clienteId = attendanceWithEmployee.clienteId ?? selectedAgendaItem.clientId;
        const piscinaId = attendanceWithEmployee.piscinaId ?? selectedAgendaItem.piscinaId;

        if (!clienteId || !piscinaId) {
          throw new Error("Visita sem cliente ou piscina vinculada.");
        }

        const atendimentoId = await atendimentoService.criarAtendimento({
          atendidoPor: attendanceWithEmployee.employeeName ?? activeEmployee?.name ?? "Sem responsavel",
          checklist: mapAttendanceChecklist(attendanceWithEmployee.completedItems),
          clienteId,
          cloro: attendanceWithEmployee.chlorine,
          data: attendanceWithEmployee.attendanceDate,
          empresaId: authenticatedUserProfile.empresaId,
          fotoAntesPlaceholder: attendanceWithEmployee.beforePhotoUri,
          fotoDepoisPlaceholder: attendanceWithEmployee.afterPhotoUri,
          fotoAntesUrl: attendanceWithEmployee.beforePhotoUri,
          fotoDepoisUrl: attendanceWithEmployee.afterPhotoUri,
          funcionarioId: attendanceWithEmployee.employeeId ?? activeEmployee?.id,
          observacoes: attendanceWithEmployee.observations,
          parametrosAgua: {
            alcalinidade: attendanceWithEmployee.alkalinity,
            cloro: attendanceWithEmployee.chlorine,
            ph: attendanceWithEmployee.ph,
            temperatura: attendanceWithEmployee.temperature,
          },
          ph: attendanceWithEmployee.ph,
          piscinaId,
          status: "concluido",
          produtosNecessarios: missingProducts.map((item) => ({
            observacao: item.observation,
            produto: item.product,
            quantidade: item.quantity,
            unidade: item.unit,
          })),
          produtosFaltando: missingProducts.map((item) => ({
            observacao: item.observation,
            produto: item.product,
            quantidade: item.quantity,
            unidade: item.unit,
          })),
          produtosUtilizadosLista: productsUsedItems.map((item) => ({
            produto: item.product,
            quantidade: item.quantity,
            unidade: item.unit,
          })),
          produtosUtilizados: attendanceWithEmployee.productsUsed,
          visitaId: selectedAgendaItem.id,
        });

        await visitasRepository.update(selectedAgendaItem.id, {
          funcionarioId: attendanceWithEmployee.employeeId ?? activeEmployee?.id ?? selectedAgendaItem.funcionarioId ?? null,
          responsavelNome: attendanceWithEmployee.employeeName ?? activeEmployee?.name ?? selectedAgendaItem.assignedEmployeeName ?? null,
          status: "concluida",
        });

        attendanceWithEmployee.id = atendimentoId;
        attendanceWithEmployee.empresaId = authenticatedUserProfile.empresaId;
        attendanceWithEmployee.visitaId = selectedAgendaItem.id;
      } catch (error) {
        throw new Error(getFirestoreFriendlyError(error, "Nao foi possivel salvar o atendimento no Firestore."));
      }
    }

    setAttendances((currentAttendances) => [attendanceWithEmployee, ...currentAttendances]);

    if (missingProducts.length > 0) {
      const selectedClientForAttendance = clients.find(
        (client) => client.name === attendanceWithEmployee.clientName,
      );
      const nextVisitDate =
        getNextVisitDateForProductRequest(selectedAgendaItem, agendaItems) ?? attendanceWithEmployee.attendanceDate;

      const productRequest: ProductRequest = {
        id: `${attendanceWithEmployee.id}-products`,
        address: selectedClientForAttendance?.address ?? selectedAgendaItem?.address,
        attendanceId: attendanceWithEmployee.id,
        clientId: attendanceWithEmployee.clienteId ?? selectedAgendaItem?.clientId ?? selectedClientForAttendance?.id,
        clientName: attendanceWithEmployee.clientName,
        neighborhood: selectedClientForAttendance?.neighborhood ?? "Nao informado",
        nextVisitDate,
        piscinaId: attendanceWithEmployee.piscinaId ?? selectedAgendaItem?.piscinaId,
        poolName: attendanceWithEmployee.poolName ?? selectedAgendaItem?.poolName,
        status: "pending-approval",
        items: missingProducts.map((item) => ({
          ...item,
          status: "pending",
        })),
        visitId: selectedAgendaItem?.id ?? attendanceWithEmployee.visitaId,
      };

      setProductRequests((currentRequests) => [productRequest, ...currentRequests]);
    }

    if (selectedAgendaItemId) {
      setAgendaItems((currentItems) =>
        currentItems.map((item) => (item.id === selectedAgendaItemId ? { ...item, status: "finished" } : item)),
      );
    }
  }

  async function handleUpdateAgendaStatus(agendaItemId: string, status: AgendaStatus) {
    const agendaItem = agendaItems.find((item) => item.id === agendaItemId);

    if (isEmployeeProfileView && (!activeEmployee || !agendaItem || !isAgendaItemAssignedToEmployee(agendaItem, activeEmployee.id))) {
      setAgendaError("Voce so pode alterar visitas atribuidas a voce.");
      return;
    }

    if (!isTestMode && authenticatedUserProfile) {
      try {
        await visitasRepository.update(agendaItemId, {
          status: mapAgendaStatusToVisitaStatus(status),
        });
      } catch (error) {
        setAgendaError(getFirestoreFriendlyError(error, "Nao foi possivel atualizar a visita no Firestore."));
        return;
      }
    }

    setAgendaItems((currentItems) =>
      currentItems.map((item) => (item.id === agendaItemId ? { ...item, status } : item)),
    );
  }

  async function handleAddAgendaItem(client: Client, visitDate: string) {
    if (!canAccessAdmin) {
      setAgendaError("Apenas o dono pode adicionar visitas manualmente.");
      return;
    }

    const defaultEmployee = activeEmployee ?? employees[0];
    let visitId = String(Date.now());

    if (!isTestMode && authenticatedUserProfile) {
      if (!client.piscinaId) {
        setAgendaError("Este cliente ainda nao possui piscina principal vinculada no Firestore.");
        return;
      }

      try {
        visitId = await visitasRepository.create({
          clienteId: client.id,
          data: visitDate,
          empresaId: authenticatedUserProfile.empresaId,
          funcionarioId: defaultEmployee?.id,
          origem: "manual",
          piscinaId: client.piscinaId,
          status: "pendente",
        });
      } catch (error) {
        setAgendaError(getFirestoreFriendlyError(error, "Nao foi possivel criar a visita no Firestore."));
        return;
      }
    }

    const agendaItem: AgendaItem = {
      address: client.address,
      clientId: client.id,
      clientName: client.name,
      data: visitDate,
      id: visitId,
      neighborhood: client.neighborhood,
      piscinaId: client.piscinaId,
      poolName: client.poolName,
      assignedEmployeeId: defaultEmployee?.id,
      assignedEmployeeName: defaultEmployee?.name,
      funcionarioId: defaultEmployee?.id,
      origem: "Manual",
      status: "pending",
      visitDate,
    };

    setAgendaItems((currentItems) => [...currentItems, agendaItem]);
  }

  async function handleAssignAgendaItem(agendaItemId: string, employeeId: string) {
    if (!canAccessAdmin) {
      setAgendaError("Apenas o dono pode distribuir visitas.");
      return;
    }

    const employee = employees.find((currentEmployee) => currentEmployee.id === employeeId);

    if (!employee) {
      return;
    }

    if (!isTestMode && authenticatedUserProfile) {
      try {
        await visitasRepository.update(agendaItemId, {
          funcionarioId: employee.id,
        });
        const agendaItem = agendaItems.find((item) => item.id === agendaItemId);

        if (agendaItem?.piscinaId) {
          await piscinasRepository.update(agendaItem.piscinaId, {
            funcionarioId: employee.id,
          });
        }
      } catch (error) {
        setAgendaError(getFirestoreFriendlyError(error, "Nao foi possivel atribuir a visita no Firestore."));
        return;
      }
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

  async function handleAssignClientsToEmployee(employeeId: string, clientIds: string[]) {
    const employee = employees.find((currentEmployee) => currentEmployee.id === employeeId);

    if (!employee) {
      return;
    }

    const todayLabel = new Date().toLocaleDateString("pt-BR");
    const firestoreAssignedIds = new Map<string, string>();

    if (!isTestMode && authenticatedUserProfile) {
      try {
        for (const clientId of clientIds) {
          const client = clients.find((currentClient) => currentClient.id === clientId);

          if (!client?.piscinaId) {
            continue;
          }

          const existingItem = agendaItems.find(
            (item) => item.clientId === client.id || item.clientName === client.name,
          );

          if (existingItem) {
            await visitasRepository.update(existingItem.id, {
              funcionarioId: employee.id,
              origem: "manual",
            });
            await piscinasRepository.update(client.piscinaId, {
              funcionarioId: employee.id,
            });
            firestoreAssignedIds.set(client.id, existingItem.id);
          } else {
            const visitId = await visitasRepository.create({
              clienteId: client.id,
              data: todayLabel,
              empresaId: authenticatedUserProfile.empresaId,
              funcionarioId: employee.id,
              origem: "manual",
              piscinaId: client.piscinaId,
              status: "pendente",
            });
            await piscinasRepository.update(client.piscinaId, {
              funcionarioId: employee.id,
            });
            firestoreAssignedIds.set(client.id, visitId);
          }
        }
      } catch (error) {
        setAgendaError(getFirestoreFriendlyError(error, "Nao foi possivel salvar as atribuicoes no Firestore."));
        throw new Error(getFirestoreFriendlyError(error, "Nao foi possivel salvar as atribuicoes no Firestore."));
      }
    }

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
          id: firestoreAssignedIds.get(client.id) ?? (existingIndex >= 0 ? nextItems[existingIndex].id : `${Date.now()}-${client.id}`),
          neighborhood: client.neighborhood,
          piscinaId: client.piscinaId,
          poolName: client.poolName,
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

  async function refreshFutureSmartAgendaForPool(empresaId: string, pool: Piscina) {
    await agendaService.refreshFutureVisitsForPool(empresaId, pool);

    if (authenticatedUserProfile) {
      await loadFirestoreAgenda(authenticatedUserProfile);
    }
  }

  async function handleStartAgendaAttendance(agendaItem: AgendaItem) {
    if (isEmployeeProfileView && (!activeEmployee || !isAgendaItemAssignedToEmployee(agendaItem, activeEmployee.id))) {
      setAgendaError("Voce so pode atender visitas atribuidas a voce.");
      return;
    }

    setSelectedAgendaItemId(agendaItem.id);
    setCurrentScreen("attendance");
  }

  async function handleBeginSelectedAgendaAttendance() {
    if (!selectedAgendaItem) {
      return;
    }

    if (isEmployeeProfileView && (!activeEmployee || !isAgendaItemAssignedToEmployee(selectedAgendaItem, activeEmployee.id))) {
      throw new Error("Voce so pode atender visitas atribuidas a voce.");
    }

    if (!isTestMode && authenticatedUserProfile) {
      await visitasRepository.update(selectedAgendaItem.id, {
        status: "em andamento",
      });
    }

    setAgendaItems((currentItems) =>
      currentItems.map((item) => (item.id === selectedAgendaItem.id ? { ...item, status: "in-progress" } : item)),
    );

    return;
  }

  function handleOpenStandaloneAttendance() {
    if (isEmployeeProfileView) {
      setRestrictedAccessMessage("Funcionario deve iniciar o atendimento por uma visita atribuida na agenda.");
      setCurrentScreen("agenda");
      return;
    }

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
    if (
      isEmployeeProfileView &&
      !visibleProductRequests.some((request) => request.id === requestId)
    ) {
      setRestrictedAccessMessage("Funcionario so pode entregar produtos vinculados as piscinas atribuidas.");
      setCurrentScreen("products");
      return;
    }

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
    <>
      {currentScreen === "splash" ? (
        <SplashScreen
          onFinish={() => {
            if (authLoading) {
              return;
            }

            setCurrentScreen(
              !isTestMode && authenticatedUserProfile
                ? getInitialScreenForPerfil(authenticatedUserProfile.perfil)
                : "login"
            );
          }}
        />
      ) : null}

      {currentScreen === "login" ? (
        <LoginScreen
          firstAccessMessage={firstAccessMessage}
          onFirebaseLogin={handleFirebaseLogin}
          onLogin={handleLogin}
          onOpenFirstAccess={() => {
            setFirstAccessMessage("");
            setCurrentScreen("first-access");
          }}
          onPasswordReset={handlePasswordReset}
          showFirstAccessButton={showFirstAccessButton}
        />
      ) : null}

      {currentScreen === "first-access" ? (
        <PrimeiroAcessoScreen
          onBack={() => setCurrentScreen("login")}
          onConfigured={() => {
            setFirstAccessMessage("Primeiro acesso criado com sucesso. Faça login.");
            setShowFirstAccessButton(false);
            setCurrentScreen("login");
            void checkFirstAccessAvailability();
          }}
        />
      ) : null}

      {currentScreen === "home" ? (
        <HomeScreen
          agendaItems={visibleAgendaItems}
          canAccessClients={canAccessClients}
          canAccessFinance={canAccessFinance}
          canAccessAdmin={canAccessAdmin}
          canOpenStandaloneAttendance={!isEmployeeProfileView}
          canViewCommercialData={canViewCommercialData}
          clients={clients}
          completionSummary={completionSummary}
          dashboardMetrics={visibleDashboardMetrics}
          employeeSummaries={activeRole === "owner" ? employeeSummaries : []}
          canManageTeam={canAccessAdmin}
          noticeMessage={restrictedAccessMessage}
          onOpenClients={() => openScreenWithPermission("clients", canAccessClients)}
          onOpenProducts={() => setCurrentScreen("products")}
          onOpenAttendance={handleOpenStandaloneAttendance}
          onOpenHistory={() => setCurrentScreen("history")}
          onOpenAgenda={() => setCurrentScreen("agenda")}
          onOpenFinance={() => openScreenWithPermission("finance", canAccessFinance)}
          onOpenFirebaseDiagnostics={() => setCurrentScreen("firebase-diagnostics")}
          onOpenClientArea={() => openScreenWithPermission("client-area", !isEmployeeProfileView)}
          onOpenTeam={() => openScreenWithPermission("admin", canAccessAdmin)}
          onOpenAdmin={() => openScreenWithPermission("admin", canAccessAdmin)}
          onStartAttendance={handleStartAgendaAttendance}
          onSwitchProfile={handleSwitchProfile}
          onLogout={handleSwitchProfile}
          profileLabel={profileLabel}
        />
      ) : null}

      {currentScreen === "clients" && canAccessClients ? (
        <ClientsScreen
          clients={clients}
          errorMessage={clientsError}
          loading={clientsLoading}
          onBack={() => setCurrentScreen("home")}
          onOpenClient={handleOpenClient}
          onNewClient={() => setCurrentScreen("new-client")}
          onNewPool={() => void handleOpenNewPool()}
        />
      ) : null}

      {currentScreen === "new-client" && canAccessClients ? (
        <NewClientScreen
          onBack={() => setCurrentScreen("clients")}
          onSave={handleSaveClient}
        />
      ) : null}

      {currentScreen === "new-pool" && canAccessClients ? (
        <NewPoolScreen
          canViewContactData={canViewCommercialData}
          clients={clients}
          editingPool={selectedPool}
          errorMessage={clientsError}
          initialClientId={selectedClientId ?? undefined}
          loadingClients={clientsLoading}
          onBack={() => setCurrentScreen(selectedClientId ? "client-detail" : "clients")}
          onSave={handleSavePool}
        />
      ) : null}

      {currentScreen === "client-detail" && selectedClient && canAccessClients ? (
        <ClientDetailScreen
          client={selectedClient}
          agendaItems={agendaItems.filter((item) => item.clientId === selectedClient.id || item.clientName === selectedClient.name)}
          attendances={attendances.filter(
            (attendance) => attendance.clienteId === selectedClient.id || attendance.clientName === selectedClient.name,
          )}
          canViewFinancialData={canViewCommercialData}
          onAddPool={() => void handleOpenNewPool(selectedClient.id)}
          onBack={() => setCurrentScreen("clients")}
          onDelete={handleDeleteClient}
          onDeletePool={handleDeletePool}
          onEdit={() => setCurrentScreen("edit-client")}
          onEditPool={handleOpenEditPool}
          pools={selectedClientPools}
        />
      ) : null}

      {currentScreen === "edit-client" && selectedClient && canAccessClients ? (
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

      {currentScreen === "attendance" && canRenderAttendance ? (
        <AtendimentoScreen
          canViewCommercialData={canViewCommercialData}
          clients={clients}
          initialAddress={selectedAgendaClient?.address ?? selectedAgendaItem?.address}
          initialAttendanceDate={selectedAgendaItem?.data ?? selectedAgendaItem?.visitDate}
          initialBairro={selectedAgendaClient?.neighborhood ?? selectedAgendaItem?.neighborhood}
          initialClientId={selectedAgendaItem?.clientId}
          onBack={() => setCurrentScreen("home")}
          onSaveAttendance={handleSaveAttendance}
          onStartAttendance={handleBeginSelectedAgendaAttendance}
          initialClientName={selectedAgendaItem?.clientName}
          initialEmpresaId={authenticatedUserProfile?.empresaId}
          initialPiscinaId={selectedAgendaItem?.piscinaId}
          initialPoolName={selectedAgendaPool?.nome ?? selectedAgendaItem?.poolName}
          initialPoolNotes={selectedAgendaPool?.observacoes}
          initialReferencePhotoUri={selectedAgendaPool?.fotoReferenciaUrl ?? selectedAgendaClient?.referencePhotoUri}
          initialVisitId={selectedAgendaItem?.id}
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
          canViewCommercialData={canViewCommercialData}
          clients={clients}
          employees={canAccessAdmin ? employees.filter((employee) => employee.status === "active") : []}
          errorMessage={agendaError}
          loading={agendaLoading}
          onBack={() => setCurrentScreen("home")}
          onAddAgendaItem={handleAddAgendaItem}
          onAssignAgendaItem={handleAssignAgendaItem}
          canDistribute={canAccessAdmin}
          onStartAttendance={handleStartAgendaAttendance}
          onUpdateStatus={handleUpdateAgendaStatus}
        />
      ) : null}

      {currentScreen === "team" && canAccessAdmin ? (
        <EquipeScreen
          agendaItems={agendaItems}
          clients={clients}
          employees={employees}
          errorMessage={agendaError}
          onBack={() => setCurrentScreen("home")}
          onAssignClientsToEmployee={handleAssignClientsToEmployee}
          onCreateEmployee={handleCreateEmployee}
          onToggleEmployeeStatus={handleToggleEmployeeStatus}
          onUpdateEmployee={handleUpdateEmployee}
        />
      ) : null}

      {currentScreen === "admin" && canAccessAdmin ? (
        <AdministracaoScreen
          agendaItems={agendaItems}
          clients={clients}
          empresaId={authenticatedUserProfile?.empresaId}
          isOwner={canAccessAdmin}
          onAssignClientsToEmployee={handleAssignClientsToEmployee}
          onBack={() => setCurrentScreen("home")}
          onEmployeesChanged={() => {
            if (authenticatedUserProfile?.empresaId) {
              void loadFirestoreEmployees(authenticatedUserProfile.empresaId);
            }
          }}
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

      {currentScreen === "client-area" && !isEmployeeProfileView ? (
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

      {currentScreen === "firebase-diagnostics" && canAccessAdmin ? (
        <FirebaseDiagnosticsScreen onBack={() => setCurrentScreen("home")} />
      ) : null}

    </>
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

function getInitialScreenForPerfil(perfil: UsuarioPerfil): AppScreen {
  return perfil === "cliente" ? "client-area" : "home";
}

type SmartAgendaIgnoredPool = {
  poolName: string;
  reasons: string[];
};

type SmartAgendaGenerationResult = {
  activePools: number;
  createdCount: number;
  ignoredPools: SmartAgendaIgnoredPool[];
  removedCount: number;
  totalPools: number;
};

async function removeFuturePendingSmartAgendaVisits(
  empresaId: string,
  existingVisits: Visita[],
  diagnosticTraceId?: string,
) {
  const today = startOfDate(new Date());
  const end = addDaysToDate(today, 29);
  const visitsToRemove = existingVisits.filter((visit) =>
    shouldRemoveForSmartAgendaRecalculation(visit, empresaId, today, end),
  );
  const removedVisitIds = new Set<string>();

  logSmartAgendaStep(diagnosticTraceId, "Inicio da limpeza de visitas futuras pendentes da agenda inteligente.", {
    empresaId,
    fimJanela: formatDateLabel(end),
    inicioJanela: formatDateLabel(today),
    visitasCandidatas: existingVisits.length,
    visitasParaRemover: visitsToRemove.length,
  });

  for (const visit of visitsToRemove) {
    try {
      logSmartAgendaStep(diagnosticTraceId, "Antes de remover visita antiga da agenda inteligente.", {
        data: visit.data,
        origem: visit.origem,
        piscinaId: visit.piscinaId,
        status: visit.status,
        visitaId: visit.id,
      });
      await visitasRepository.delete(visit.id);
      removedVisitIds.add(visit.id);
      logSmartAgendaStep(diagnosticTraceId, "Depois de remover visita antiga da agenda inteligente.", {
        data: visit.data,
        piscinaId: visit.piscinaId,
        visitaId: visit.id,
      });
    } catch (error) {
      logSmartAgendaError(diagnosticTraceId, "Erro ao remover visita antiga da agenda inteligente.", error, {
        data: visit.data,
        empresaId: visit.empresaId,
        piscinaId: visit.piscinaId,
        visitaId: visit.id,
      });
      throw error;
    }
  }

  return {
    removedCount: removedVisitIds.size,
    removedVisitIds,
  };
}

async function createSmartFirestoreVisits(
  empresaId: string,
  currentPools: Piscina[],
  existingVisits: Visita[],
  diagnosticTraceId?: string,
) {
  const existingKeys = new Set(existingVisits.map((visit) => getVisitDedupKey(visit.empresaId, visit.piscinaId, visit.data)));
  const result: SmartAgendaGenerationResult = {
    activePools: 0,
    createdCount: 0,
    ignoredPools: [],
    removedCount: 0,
    totalPools: currentPools.length,
  };

  logSmartAgendaStep(diagnosticTraceId, "Inicio da criacao de visitas no Firestore.", {
    empresaId,
    piscinasEncontradas: currentPools.length,
    piscinasAtivas: currentPools.filter(isSmartAgendaPoolActive).length,
    visitasExistentes: existingVisits.length,
  });

  for (const pool of currentPools) {
    let currentVisitDate = "";

    try {
      const analysis = analyzePoolForSmartAgenda(pool);
      const poolDiagnostic = getSmartAgendaPoolDiagnostic(analysis.pool);

      logSmartAgendaStep(diagnosticTraceId, "Piscina analisada.", {
        ...poolDiagnostic,
        aceita: analysis.active && analysis.reasons.length === 0,
        datasGeradas: analysis.dates,
        ignorada: !analysis.active || analysis.reasons.length > 0,
        motivo: analysis.reasons.length > 0 ? analysis.reasons.join("; ") : "Piscina aceita para geracao.",
      });

      if (!analysis.active) {
        result.ignoredPools.push({ poolName: analysis.poolName, reasons: analysis.reasons });
        continue;
      }

      result.activePools += 1;

      if (analysis.reasons.length > 0) {
        result.ignoredPools.push({ poolName: analysis.poolName, reasons: analysis.reasons });
        continue;
      }

      const funcionarioId = getPoolResponsibleId(analysis.pool, existingVisits);

      for (const data of analysis.dates) {
        currentVisitDate = data;
        const dedupKey = getVisitDedupKey(empresaId, analysis.pool.id, data);

        if (existingKeys.has(dedupKey)) {
          logSmartAgendaStep(diagnosticTraceId, "Visita duplicada ignorada.", {
            ...poolDiagnostic,
            data,
            dedupKey,
          });
          continue;
        }

        const visitPayload = {
          clienteId: analysis.pool.clienteId,
          data,
          empresaId,
          funcionarioId: funcionarioId ?? null,
          origem: "agenda-inteligente" as const,
          piscinaId: analysis.pool.id,
          responsavelNome: funcionarioId ? null : "Sem responsavel",
          status: "pendente" as const,
        };

        logSmartAgendaStep(diagnosticTraceId, "Antes de criar visita no Firestore.", {
          ...poolDiagnostic,
          dedupKey,
          visita: visitPayload,
        });
        const visitId = await visitasRepository.create(visitPayload);
        logSmartAgendaStep(diagnosticTraceId, "Depois de salvar visita no Firestore.", {
          ...poolDiagnostic,
          data,
          dedupKey,
          visitId,
        });
        existingKeys.add(dedupKey);
        result.createdCount += 1;
      }
    } catch (error) {
      logSmartAgendaError(diagnosticTraceId, "Erro ao processar piscina na agenda inteligente.", error, {
        piscina: getSmartAgendaPoolDiagnostic(pool),
        dataTentada: currentVisitDate,
      });
      throw error;
    }
  }

  logSmartAgendaStep(diagnosticTraceId, "Fim da criacao de visitas no Firestore.", result);

  return result;
}

function generateLocalSmartAgendaItems(
  currentPools: Piscina[],
  currentAgendaItems: AgendaItem[],
  currentClients: Client[],
  currentEmployees: Employee[],
  diagnosticTraceId?: string,
) {
  const existingKeys = new Set(
    currentAgendaItems
      .filter((item) => item.piscinaId)
      .map((item) => getVisitDedupKey("test-mode", item.piscinaId!, item.data ?? item.visitDate ?? "")),
  );
  const nextItems = [...currentAgendaItems];
  const result: SmartAgendaGenerationResult = {
    activePools: 0,
    createdCount: 0,
    ignoredPools: [],
    removedCount: 0,
    totalPools: currentPools.length,
  };

  logSmartAgendaStep(diagnosticTraceId, "Inicio da geracao local de visitas.", {
    piscinasEncontradas: currentPools.length,
    piscinasAtivas: currentPools.filter(isSmartAgendaPoolActive).length,
    visitasExistentes: currentAgendaItems.length,
  });

  currentPools.forEach((pool) => {
    try {
      const analysis = analyzePoolForSmartAgenda(pool);
      const poolDiagnostic = getSmartAgendaPoolDiagnostic(analysis.pool);

      logSmartAgendaStep(diagnosticTraceId, "Piscina analisada em modo teste.", {
        ...poolDiagnostic,
        aceita: analysis.active && analysis.reasons.length === 0,
        datasGeradas: analysis.dates,
        ignorada: !analysis.active || analysis.reasons.length > 0,
        motivo: analysis.reasons.length > 0 ? analysis.reasons.join("; ") : "Piscina aceita para geracao.",
      });

      if (!analysis.active) {
        result.ignoredPools.push({ poolName: analysis.poolName, reasons: analysis.reasons });
        return;
      }

      result.activePools += 1;

      if (analysis.reasons.length > 0) {
        result.ignoredPools.push({ poolName: analysis.poolName, reasons: analysis.reasons });
        return;
      }

      const client = currentClients.find((currentClient) => currentClient.id === analysis.pool.clienteId);

      if (!client) {
        logSmartAgendaStep(diagnosticTraceId, "Piscina ignorada em modo teste.", {
          ...poolDiagnostic,
          motivo: "Cliente vinculado nao encontrado no app.",
        });
        result.ignoredPools.push({ poolName: analysis.poolName, reasons: ["Cliente vinculado nao encontrado no app."] });
        return;
      }

      const funcionarioId = getPoolResponsibleId(
      analysis.pool,
        currentAgendaItems.map((item) => ({
          clienteId: item.clientId ?? client.id,
          data: item.data ?? item.visitDate ?? "",
        empresaId: analysis.pool.empresaId,
          funcionarioId: item.funcionarioId,
          id: item.id,
          origem: item.origem === "Manual" ? "manual" : item.origem === "Agenda Inteligente" ? "agenda-inteligente" : "agenda",
        piscinaId: item.piscinaId ?? analysis.pool.id,
          status: mapAgendaStatusToVisitaStatus(item.status),
        })),
      );
      const employee = currentEmployees.find((currentEmployee) => currentEmployee.id === funcionarioId);

    analysis.dates.forEach((data) => {
      const dedupKey = getVisitDedupKey("test-mode", analysis.pool.id, data);

        if (existingKeys.has(dedupKey)) {
          logSmartAgendaStep(diagnosticTraceId, "Visita local duplicada ignorada.", {
            ...poolDiagnostic,
            data,
            dedupKey,
          });
          return;
        }

        logSmartAgendaStep(diagnosticTraceId, "Antes de criar visita local.", {
          ...poolDiagnostic,
          data,
          dedupKey,
        });
        nextItems.push({
          address: client.address,
          assignedEmployeeId: employee?.id,
          assignedEmployeeName: employee?.name,
          clientId: client.id,
          clientName: client.name,
          data,
          funcionarioId: employee?.id,
        id: `smart-${analysis.pool.id}-${data}`,
          neighborhood: client.neighborhood,
          origem: "Agenda Inteligente",
        piscinaId: analysis.pool.id,
        poolName: analysis.pool.nome,
          status: "pending",
          visitDate: data,
        });
        logSmartAgendaStep(diagnosticTraceId, "Depois de criar visita local.", {
          ...poolDiagnostic,
          data,
          dedupKey,
        });
        existingKeys.add(dedupKey);
      result.createdCount += 1;
      });
    } catch (error) {
      logSmartAgendaError(diagnosticTraceId, "Erro ao processar piscina em modo teste.", error, {
        piscina: getSmartAgendaPoolDiagnostic(pool),
      });
      throw error;
    }
    });

  logSmartAgendaStep(diagnosticTraceId, "Fim da geracao local de visitas.", result);

  return { ...result, items: nextItems };
}

function generateSmartVisitDates(pool: Piscina, startDate = new Date(), daysAhead = 30) {
  const normalizedPool = normalizePoolForSmartAgenda(pool);
  const start = startOfDate(startDate);
  const end = addDaysToDate(start, daysAhead - 1);
  const dates: Date[] = [];

  if (normalizedPool.planoAtendimento === "todo_dia") {
    for (let index = 0; index < daysAhead; index += 1) {
      dates.push(addDaysToDate(start, index));
    }
  }

  if (normalizedPool.planoAtendimento === "mensal" || normalizedPool.planoAtendimento === "semanal") {
    dates.push(...generateWeeklyDates(start, end, normalizedPool.diasAtendimento ?? [], 7));
  }

  if (normalizedPool.planoAtendimento === "quinzenal") {
    dates.push(...generateWeeklyDates(start, end, normalizedPool.diasAtendimento ?? [], 14));
  }

  if (normalizedPool.planoAtendimento === "avulso") {
    const avulsoDate = parseDateLabel(normalizedPool.dataAvulsa ?? normalizedPool.dataAtendimentoAvulso);

    if (avulsoDate && avulsoDate >= start && avulsoDate <= end) {
      dates.push(avulsoDate);
    }
  }

  return Array.from(new Set(dates.map(formatDateLabel))).sort(sortDateLabels);
}

function analyzePoolForSmartAgenda(pool: Piscina) {
  const normalizedPool = normalizePoolForSmartAgenda(pool);
  const active = isSmartAgendaPoolActive(pool);
  const reasons: string[] = [];

  if (!active) {
    reasons.push(`Status "${safeText((pool as unknown as { status?: unknown }).status, "nao informado")}" nao esta ativo.`);
  }

  if (!normalizedPool.id) {
    reasons.push("Piscina sem piscinaId.");
  }

  if (!normalizedPool.empresaId) {
    reasons.push("Piscina sem empresaId.");
  }

  if (!normalizedPool.clienteId) {
    reasons.push("Piscina sem clienteId.");
  }

  if (!normalizedPool.planoAtendimento) {
    reasons.push("Plano de atendimento nao informado ou nao reconhecido.");
  }

  const dates = reasons.length === 0 ? generateSmartVisitDates(normalizedPool) : [];

  if (reasons.length === 0 && dates.length === 0) {
    reasons.push(getNoDatesReason(normalizedPool));
  }

  return {
    active,
    dates,
    pool: normalizedPool,
    poolName: getSmartAgendaPoolName(normalizedPool),
    reasons,
  };
}

function normalizePoolForSmartAgenda(pool: Piscina): Piscina {
  const rawPool = pool as unknown as Record<string, unknown>;

  return {
    ...pool,
    clienteId: safeText(rawPool.clienteId),
    dataAtendimentoAvulso: safeOptionalText(rawPool.dataAtendimentoAvulso),
    dataAvulsa: safeOptionalText(rawPool.dataAvulsa),
    diaMensal: normalizeDayOfMonth(rawPool.diaMensal ?? rawPool.diaMesAtendimento),
    diaMesAtendimento: normalizeDayOfMonth(rawPool.diaMesAtendimento ?? rawPool.diaMensal),
    diasAtendimento: normalizeWeekDays(rawPool.diasAtendimento),
    empresaId: safeText(rawPool.empresaId),
    funcionarioId: safeOptionalText(rawPool.funcionarioId) ?? null,
    id: safeText(rawPool.id),
    nome: safeText(rawPool.nome, "Piscina principal"),
    planoAtendimento: normalizePlanoAtendimento(rawPool.planoAtendimento),
    status: isSmartAgendaPoolActive(pool) ? "ativa" : "inativa",
  };
}

function normalizePlanoAtendimento(value: unknown): Piscina["planoAtendimento"] {
  const normalizedValue = normalizeTextToken(value);

  const aliases: Record<string, Piscina["planoAtendimento"]> = {
    avulso: "avulso",
    biweekly: "quinzenal",
    daily: "todo_dia",
    mensal: "mensal",
    monthly: "mensal",
    onetime: "avulso",
    one_time: "avulso",
    quinzenal: "quinzenal",
    semanal: "semanal",
    semana: "semanal",
    semanalmente: "semanal",
    todo_dia: "todo_dia",
    tododia: "todo_dia",
    todos_os_dias: "todo_dia",
    todososdias: "todo_dia",
    weekly: "semanal",
  };

  return aliases[normalizedValue];
}

function normalizeWeekDays(value: unknown): WeekDay[] {
  const rawItems = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? value.split(/[,/;|]+|\s+\+\s+|\s+e\s+/i)
      : [];
  const weekDays = rawItems
    .map((item) => normalizeWeekDay(item))
    .filter((item): item is WeekDay => Boolean(item));

  return Array.from(new Set(weekDays));
}

function normalizeWeekDay(value: unknown): WeekDay | null {
  const normalizedValue = normalizeTextToken(value);
  const aliases: Record<string, WeekDay> = {
    dom: "sunday",
    domingo: "sunday",
    friday: "friday",
    fri: "friday",
    monday: "monday",
    mon: "monday",
    quarta: "wednesday",
    quartafeira: "wednesday",
    quinta: "thursday",
    quintafeira: "thursday",
    sab: "saturday",
    sabado: "saturday",
    saturday: "saturday",
    sat: "saturday",
    segunda: "monday",
    segundafeira: "monday",
    sexta: "friday",
    sextafeira: "friday",
    sunday: "sunday",
    quinta_feira: "thursday",
    quarta_feira: "wednesday",
    segunda_feira: "monday",
    sexta_feira: "friday",
    terca: "tuesday",
    tercafeira: "tuesday",
    terca_feira: "tuesday",
    thursday: "thursday",
    thu: "thursday",
    tuesday: "tuesday",
    tue: "tuesday",
    wednesday: "wednesday",
    wed: "wednesday",
  };

  return aliases[normalizedValue] ?? null;
}

function normalizeDayOfMonth(value: unknown) {
  const numberValue = typeof value === "number" ? value : Number(String(value ?? "").trim());
  return Number.isInteger(numberValue) && numberValue >= 1 && numberValue <= 31 ? numberValue : undefined;
}

function isSmartAgendaPoolActive(pool: Piscina) {
  const rawStatus = normalizeTextToken((pool as unknown as { status?: unknown }).status);

  if (!rawStatus) {
    return true;
  }

  return rawStatus === "ativa" || rawStatus === "ativo";
}

function getNoDatesReason(pool: Piscina) {
  if (pool.planoAtendimento === "mensal" || pool.planoAtendimento === "semanal" || pool.planoAtendimento === "quinzenal") {
    return "Piscina ignorada: selecione os dias de atendimento.";
  }

  if (pool.planoAtendimento === "avulso") {
    return "Plano avulso sem dataAvulsa valida nos proximos 30 dias.";
  }

  return "Nenhuma data encontrada nos proximos 30 dias.";
}

function getSmartAgendaPoolName(pool: Piscina) {
  return safeText(pool.nome, pool.id ? `Piscina ${pool.id}` : "Piscina sem identificacao");
}

function normalizeTextToken(value: unknown) {
  return safeText(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}

function formatSmartAgendaResultMessage(result: SmartAgendaGenerationResult) {
  const baseMessage = `Agenda atualizada: ${result.createdCount} visita(s) criada(s), ${result.removedCount} visita(s) antiga(s) removida(s). ${result.ignoredPools.length} piscina(s) ignorada(s). Encontradas: ${result.totalPools}, ativas: ${result.activePools}.`;

  if (result.ignoredPools.length === 0) {
    return baseMessage;
  }

  const ignoredDetails = result.ignoredPools
    .slice(0, 5)
    .map((pool) => `${pool.poolName}: ${pool.reasons.join("; ")}`)
    .join(" | ");

  const remainingCount = result.ignoredPools.length > 5 ? ` | +${result.ignoredPools.length - 5} piscina(s) ignorada(s).` : "";

  return `${baseMessage} Motivos: ${ignoredDetails}${remainingCount}`;
}

function logSmartAgendaDiagnostics(result: SmartAgendaGenerationResult, diagnosticTraceId?: string) {
  logSmartAgendaStep(diagnosticTraceId, "Diagnostico final da Agenda Inteligente.", {
    piscinasAtivas: result.activePools,
    piscinasEncontradas: result.totalPools,
    piscinasIgnoradas: result.ignoredPools.length,
    motivos: result.ignoredPools,
    visitasCriadas: result.createdCount,
  });
}

function logSmartAgendaStep(diagnosticTraceId: string | undefined, step: string, payload?: unknown) {
  const prefix = diagnosticTraceId ? `[Agenda Inteligente][${diagnosticTraceId}]` : "[Agenda Inteligente]";

  if (payload === undefined) {
    console.info(`${prefix} ${step}`);
    return;
  }

  console.info(`${prefix} ${step}`, payload);
}

function logSmartAgendaError(
  diagnosticTraceId: string | undefined,
  step: string,
  error: unknown,
  context?: Record<string, unknown>,
) {
  const prefix = diagnosticTraceId ? `[Agenda Inteligente][${diagnosticTraceId}]` : "[Agenda Inteligente]";
  const stack = error instanceof Error ? error.stack : undefined;

  console.error(`${prefix} ${step}`, {
    context,
    error,
    message: error instanceof Error ? error.message : safeText(error, "Erro desconhecido"),
    stack,
  });
}

function createSmartAgendaTraceId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function getSmartAgendaPoolDiagnostic(pool: Piscina) {
  return {
    clienteId: safeText(pool.clienteId, "nao informado"),
    dataAvulsa: safeOptionalText(pool.dataAvulsa ?? pool.dataAtendimentoAvulso) ?? null,
    diasAtendimento: Array.isArray(pool.diasAtendimento) ? pool.diasAtendimento : [],
    empresaId: safeText(pool.empresaId, "nao informado"),
    frequencia: pool.frequenciaSemanal ?? null,
    nome: getSmartAgendaPoolName(pool),
    piscinaId: safeText(pool.id, "nao informado"),
    plano: pool.planoAtendimento ?? "nao informado",
    status: safeText((pool as unknown as { status?: unknown }).status, "nao informado"),
  };
}

function generateWeeklyDates(start: Date, end: Date, weekDays: WeekDay[], intervalDays: 7 | 14) {
  return weekDays.flatMap((weekDay) => {
    const dates: Date[] = [];
    let currentDate = getNextDateForWeekDay(start, weekDay);

    while (currentDate <= end) {
      dates.push(currentDate);
      currentDate = addDaysToDate(currentDate, intervalDays);
    }

    return dates;
  });
}

function generateMonthlyDates(start: Date, end: Date, dayOfMonth?: number) {
  if (!dayOfMonth || dayOfMonth < 1 || dayOfMonth > 31) {
    return [];
  }

  const dates: Date[] = [];
  const monthCursor = new Date(start.getFullYear(), start.getMonth(), 1);

  for (let index = 0; index < 2; index += 1) {
    const candidate: Date = new Date(monthCursor.getFullYear(), monthCursor.getMonth() + index, dayOfMonth);

    if (candidate.getDate() === dayOfMonth && candidate >= start && candidate <= end) {
      dates.push(startOfDate(candidate));
    }
  }

  return dates;
}

function getNextDateForWeekDay(start: Date, weekDay: WeekDay) {
  const targetDay = weekDayIndexes[weekDay];
  const distance = (targetDay - start.getDay() + 7) % 7;
  return addDaysToDate(start, distance);
}

function getPoolResponsibleId(pool: Piscina, existingVisits: Visita[]) {
  if (pool.funcionarioId) {
    return pool.funcionarioId;
  }

  return existingVisits
    .filter((visit) => visit.piscinaId === pool.id && Boolean(visit.funcionarioId))
    .sort((left, right) => sortDateLabels(right.data, left.data))[0]?.funcionarioId;
}

function getVisitDedupKey(empresaId: string, piscinaId: string, data: string) {
  return `${empresaId}__${piscinaId}__${data}`;
}

function shouldRemoveForSmartAgendaRecalculation(visit: Visita, empresaId: string, start: Date, end: Date) {
  const visitDate = parseDateLabel(visit.data);

  return Boolean(
    visit.empresaId === empresaId &&
      visit.origem === "agenda-inteligente" &&
      visit.status === "pendente" &&
      visitDate &&
      visitDate >= start &&
      visitDate <= end,
  );
}

function formatDateLabel(date: Date) {
  return date.toLocaleDateString("pt-BR");
}

function parseDateLabel(value?: string) {
  if (!value || value === "Hoje") {
    return value === "Hoje" ? startOfDate(new Date()) : null;
  }

  const brDate = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);

  if (brDate) {
    return startOfDate(new Date(Number(brDate[3]), Number(brDate[2]) - 1, Number(brDate[1])));
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : startOfDate(parsed);
}

function sortDateLabels(left: string, right: string) {
  const leftDate = parseDateLabel(left)?.getTime() ?? 0;
  const rightDate = parseDateLabel(right)?.getTime() ?? 0;
  return leftDate - rightDate;
}

function startOfDate(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDaysToDate(date: Date, days: number) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return startOfDate(nextDate);
}

const weekDayIndexes: Record<WeekDay, number> = {
  friday: 5,
  monday: 1,
  saturday: 6,
  sunday: 0,
  thursday: 4,
  tuesday: 2,
  wednesday: 3,
};

function mapFirestoreClientToAppClient(cliente: Cliente, piscina?: Piscina): Client {
  const referencePhotoUri = getPersistedPhotoUri(piscina?.fotoReferenciaUrl);

  return {
    address: cliente.endereco ?? "",
    city: cliente.cidade ?? "",
    diaVencimento: piscina?.diaVencimento ?? 1,
    email: cliente.email ?? "",
    frequency: "once",
    id: cliente.id,
    liters: piscina?.litros,
    name: cliente.nome,
    neighborhood: cliente.bairro ?? "",
    notes: cliente.observacoes ?? "",
    phone: cliente.telefone ?? "",
    piscinaId: piscina?.id,
    poolName: piscina?.nome,
    poolNotes: piscina?.observacoes ?? "",
    plan: mapPlanoAtendimentoToClientPlan(piscina?.planoAtendimento),
    dataAtendimentoAvulso: piscina?.dataAvulsa ?? piscina?.dataAtendimentoAvulso,
    diaMesAtendimento: piscina?.diaMensal ?? piscina?.diaMesAtendimento,
    diasAtendimento: piscina?.diasAtendimento ?? [],
    poolType: piscina?.tipo ?? "",
    referencePhotoUri,
    valorMensal: piscina?.valorMensal ?? 0,
    weekDays: [],
  };
}

function mapFirestoreClientToOperationalClient(cliente: Cliente, piscina?: Piscina): Client {
  const referencePhotoUri = getPersistedPhotoUri(piscina?.fotoReferenciaUrl);

  return {
    address: cliente.endereco ?? "",
    city: cliente.cidade ?? "",
    diaVencimento: 1,
    email: "",
    frequency: "once",
    id: cliente.id,
    liters: piscina?.litros,
    name: cliente.nome,
    neighborhood: cliente.bairro ?? "",
    notes: "",
    phone: "",
    piscinaId: piscina?.id,
    poolName: piscina?.nome,
    poolNotes: piscina?.observacoes ?? "",
    plan: "monthly",
    dataAtendimentoAvulso: piscina?.dataAvulsa ?? piscina?.dataAtendimentoAvulso ?? "",
    diaMesAtendimento: undefined,
    diasAtendimento: piscina?.diasAtendimento ?? [],
    poolType: piscina?.tipo ?? "",
    referencePhotoUri,
    valorMensal: 0,
    weekDays: [],
  };
}

function haveSameOperationalClients(currentClients: Client[], nextClients: Client[]) {
  if (currentClients.length !== nextClients.length) {
    return false;
  }

  return nextClients.every((nextClient) => {
    const currentClient = currentClients.find((client) => client.id === nextClient.id);

    return (
      currentClient?.address === nextClient.address &&
      currentClient?.name === nextClient.name &&
      currentClient?.neighborhood === nextClient.neighborhood &&
      currentClient?.piscinaId === nextClient.piscinaId &&
      currentClient?.poolType === nextClient.poolType &&
      currentClient?.referencePhotoUri === nextClient.referencePhotoUri &&
      currentClient?.liters === nextClient.liters
    );
  });
}

function getPersistedPhotoUri(uri?: string | null) {
  if (typeof uri !== "string") {
    return undefined;
  }

  const trimmedUri = uri.trim();

  if (!trimmedUri || isTemporaryLocalUri(trimmedUri)) {
    return undefined;
  }

  return trimmedUri;
}

function sanitizePoolReferencePhoto(pool: Piscina): Piscina {
  return {
    ...pool,
    fotoReferenciaUrl: getPersistedPhotoUri(pool.fotoReferenciaUrl),
  };
}

function getAgendaAssignedEmployeeId(item: AgendaItem) {
  return item.assignedEmployeeId ?? item.funcionarioId;
}

function isAgendaItemAssignedToEmployee(item: AgendaItem, employeeId: string) {
  return getAgendaAssignedEmployeeId(item) === employeeId;
}

function isAttendanceVisibleForEmployee(
  attendance: AttendanceRecord,
  visibleAgendaItems: AgendaItem[],
  employeeId: string,
) {
  if (attendance.employeeId === employeeId) {
    return true;
  }

  return visibleAgendaItems.some((item) => {
    if (attendance.visitaId && item.id === attendance.visitaId) {
      return true;
    }

    if (attendance.piscinaId && item.piscinaId === attendance.piscinaId) {
      return true;
    }

    if (attendance.clienteId && item.clientId === attendance.clienteId) {
      return true;
    }

    return Boolean(attendance.clientName && item.clientName === attendance.clientName);
  });
}

function isProductRequestVisibleForEmployee(request: ProductRequest, visibleAgendaItems: AgendaItem[]) {
  return visibleAgendaItems.some((item) => {
    if (request.visitId && item.id === request.visitId) {
      return true;
    }

    if (request.piscinaId && item.piscinaId === request.piscinaId) {
      return true;
    }

    if (request.clientId && item.clientId === request.clientId) {
      return true;
    }

    return Boolean(request.clientName && item.clientName === request.clientName);
  });
}

function isTemporaryLocalUri(uri: string) {
  return (
    uri.startsWith("blob:") ||
    uri.startsWith("file:") ||
    uri.startsWith("data:") ||
    uri.startsWith("content:") ||
    uri.startsWith("asset:")
  );
}

function safeText(value: unknown, fallback = "") {
  if (value === null || value === undefined) {
    return fallback;
  }

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  return fallback;
}

function safeOptionalText(value: unknown) {
  const text = safeText(value);
  return text || undefined;
}

function mapFirestoreVisitToAgendaItem(
  visit: Visita,
  currentClients: Client[],
  currentEmployees: Employee[],
  currentPools: Piscina[],
): AgendaItem {
  const client = currentClients.find((currentClient) => currentClient.id === visit.clienteId);
  const employee = currentEmployees.find((currentEmployee) => currentEmployee.id === visit.funcionarioId);
  const pool = currentPools.find((currentPool) => currentPool.id === visit.piscinaId);

  return {
    address: safeText(client?.address, "Endereco nao informado"),
    assignedEmployeeId: visit.funcionarioId ?? undefined,
    assignedEmployeeName: safeOptionalText(employee?.name ?? visit.responsavelNome),
    clientId: visit.clienteId,
    clientName: safeText(client?.name, "Cliente nao encontrado"),
    data: safeText(visit.data),
    funcionarioId: visit.funcionarioId ?? undefined,
    id: visit.id,
    neighborhood: safeText(client?.neighborhood, "Bairro nao informado"),
    origem: mapVisitaOrigemToAgendaOrigem(visit.origem),
    piscinaId: visit.piscinaId,
    poolName: safeText(pool?.nome ?? client?.poolName, "Piscina nao encontrada"),
    status: mapVisitaStatusToAgendaStatus(visit.status),
    visitDate: safeText(visit.data),
  };
}

function mapFuncionarioToEmployee(funcionario: Funcionario): Employee {
  return {
    email: funcionario.email ?? "",
    id: funcionario.id,
    name: funcionario.nome,
    phone: funcionario.telefone ?? "",
    role: funcionario.funcao === "socio" ? "partner" : "staff",
    status: funcionario.status === "ativo" ? "active" : "inactive",
  };
}

function mapAgendaStatusToVisitaStatus(status: AgendaStatus): VisitaStatus {
  const statuses: Record<AgendaStatus, VisitaStatus> = {
    finished: "concluida",
    "in-progress": "em andamento",
    pending: "pendente",
  };

  return statuses[status];
}

function mapVisitaStatusToAgendaStatus(status: VisitaStatus): AgendaStatus {
  const statuses: Record<VisitaStatus, AgendaStatus> = {
    concluida: "finished",
    "em andamento": "in-progress",
    pendente: "pending",
  };

  return statuses[status] ?? "pending";
}

function mapVisitaOrigemToAgendaOrigem(origem: VisitaOrigem): NonNullable<AgendaItem["origem"]> {
  if (origem === "manual") {
    return "Manual";
  }

  if (origem === "agenda-inteligente") {
    return "Agenda Inteligente";
  }

  return "Automatica";
}

function mapAttendanceChecklist(completedItems: string[]): AtendimentoChecklist {
  return {
    aspiracao: completedItems.includes("Aspirar piscina") || completedItems.includes("Aspiracao"),
    completarNivelAgua: completedItems.includes("Completar nivel da agua (quando necessario)"),
    conferirEquipamentos: completedItems.includes("Conferir equipamentos"),
    escovarParedes: completedItems.includes("Escovar paredes") || completedItems.includes("Escovacao das bordas"),
    limparBorda: completedItems.includes("Limpar borda"),
    limparCestos: completedItems.includes("Limpar cestos"),
    medicaoCloro: completedItems.includes("Medir Cloro") || completedItems.includes("Medicao de cloro"),
    medicaoPh: completedItems.includes("Medir pH") || completedItems.includes("Medicao de pH"),
    retrolavarFiltro: completedItems.includes("Retrolavar filtro") || completedItems.includes("Lavagem do filtro"),
    verificarCasaMaquinas: completedItems.includes("Verificar casa de maquinas"),
    verificarVazamentos: completedItems.includes("Verificar vazamentos"),
  };
}

function mapFirestoreAttendanceToAttendanceRecord(
  attendance: Atendimento,
  currentClients: Client[],
  currentPools: Piscina[],
): AttendanceRecord {
  const client = currentClients.find((currentClient) => currentClient.id === attendance.clienteId);
  const pool = currentPools.find((currentPool) => currentPool.id === attendance.piscinaId);
  const missingProducts = attendance.produtosNecessarios ?? attendance.produtosFaltando ?? [];
  const productsUsedItems = attendance.produtosUtilizadosLista ?? [];

  return {
    afterPhotoUri: attendance.fotoDepoisUrl ?? attendance.fotoDepoisPlaceholder ?? "",
    alkalinity: attendance.parametrosAgua?.alcalinidade ?? "",
    attendanceDate: safeText(attendance.data, "Data nao informada"),
    beforePhotoUri: attendance.fotoAntesUrl ?? attendance.fotoAntesPlaceholder ?? "",
    chlorine: attendance.parametrosAgua?.cloro ?? attendance.cloro ?? "",
    clienteId: attendance.clienteId,
    clientName: safeText(client?.name, "Cliente nao encontrado"),
    completedItems: mapChecklistLabels(attendance.checklist),
    employeeId: attendance.funcionarioId,
    employeeName: attendance.atendidoPor,
    empresaId: attendance.empresaId,
    id: attendance.id,
    missingProducts:
      missingProducts.map((item, index) => ({
        id: `${attendance.id}-missing-${index}`,
        observation: item.observacao ?? "",
        product: safeText(item.produto, "Produto nao informado"),
        quantity: safeText(item.quantidade, "Quantidade nao informada"),
      })),
    observations: attendance.observacoes ?? "",
    ph: attendance.parametrosAgua?.ph ?? attendance.ph ?? "",
    piscinaId: attendance.piscinaId,
    poolName: safeText(pool?.nome, "Piscina nao encontrada"),
    productsUsed: attendance.produtosUtilizados ?? "",
    productsUsedItems:
      productsUsedItems.map((item, index) => ({
        id: `${attendance.id}-used-${index}`,
        product: safeText(item.produto, "Produto nao informado"),
        quantity: safeText(item.quantidade),
        unit: item.unidade ?? "",
      })),
    status: attendance.status ?? "concluido",
    temperature: attendance.parametrosAgua?.temperatura ?? "",
    visitaId: attendance.visitaId,
    waterParameters: {
      alkalinity: attendance.parametrosAgua?.alcalinidade ?? "",
      chlorine: attendance.parametrosAgua?.cloro ?? attendance.cloro ?? "",
      ph: attendance.parametrosAgua?.ph ?? attendance.ph ?? "",
      temperature: attendance.parametrosAgua?.temperatura ?? "",
    },
  };
}

function mapChecklistLabels(checklist?: Partial<AtendimentoChecklist>) {
  const labels: string[] = [];

  if (checklist?.aspiracao) labels.push("Aspiracao");
  if (checklist?.medicaoPh) labels.push("Medicao de pH");
  if (checklist?.medicaoCloro) labels.push("Medicao de cloro");
  if (checklist?.escovarParedes) labels.push("Escovar paredes");
  if (checklist?.limparBorda) labels.push("Limpar borda");
  if (checklist?.limparCestos) labels.push("Limpar cestos");
  if (checklist?.retrolavarFiltro) labels.push("Retrolavar filtro");
  if (checklist?.completarNivelAgua) labels.push("Completar nivel da agua");
  if (checklist?.verificarCasaMaquinas) labels.push("Verificar casa de maquinas");
  if (checklist?.verificarVazamentos) labels.push("Verificar vazamentos");
  if (checklist?.conferirEquipamentos) labels.push("Conferir equipamentos");

  return labels;
}

function mapClientPlanToPlanoAtendimento(plan: ClientPlan): PlanoAtendimento {
  const plans: Record<ClientPlan, PlanoAtendimento> = {
    biweekly: "quinzenal",
    daily: "todo_dia",
    monthly: "mensal",
    "one-time": "avulso",
    weekly: "semanal",
  };

  return plans[plan];
}

function mapPlanoAtendimentoToClientPlan(plan?: PlanoAtendimento): ClientPlan {
  const plans: Record<PlanoAtendimento, ClientPlan> = {
    avulso: "one-time",
    mensal: "monthly",
    quinzenal: "biweekly",
    semanal: "weekly",
    todo_dia: "daily",
  };

  return plan ? plans[plan] : "monthly";
}

function getFirestoreFriendlyError(error: unknown, fallback: string) {
  const code =
    typeof error === "object" && error !== null && "code" in error
      ? (error as { code?: unknown }).code
      : "";

  if (code === "permission-denied") {
    return "Sem permissao no Firestore para acessar clientes e piscinas desta empresa.";
  }

  if (code === "unavailable") {
    return "Firestore indisponivel no momento. Tente novamente em instantes.";
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

function withOperationTimeout<T>(promise: Promise<T>, message: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(message)), POOL_SAVE_OPERATION_TIMEOUT_MS);

    promise
      .then(resolve)
      .catch(reject)
      .finally(() => clearTimeout(timer));
  });
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
          deliveredAt:
            status === "delivered" ? item.deliveredAt ?? getTodayLabel() : item.deliveredAt,
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

function getNextVisitDateForProductRequest(selectedAgendaItem?: AgendaItem, agendaItems: AgendaItem[] = []) {
  if (!selectedAgendaItem) {
    return undefined;
  }

  const currentVisitDate = parseDateLabel(selectedAgendaItem.data ?? selectedAgendaItem.visitDate);
  const selectedPoolId = selectedAgendaItem.piscinaId;
  const selectedClientId = selectedAgendaItem.clientId;
  const selectedClientName = selectedAgendaItem.clientName;

  const nextVisit = agendaItems
    .filter((item) => {
      if (item.id === selectedAgendaItem.id || item.status === "finished") {
        return false;
      }

      const samePool = selectedPoolId ? item.piscinaId === selectedPoolId : false;
      const sameClient = selectedClientId
        ? item.clientId === selectedClientId
        : item.clientName === selectedClientName;

      if (!samePool && !sameClient) {
        return false;
      }

      const itemDate = parseDateLabel(item.data ?? item.visitDate);
      return currentVisitDate && itemDate ? itemDate > currentVisitDate : true;
    })
    .sort((left, right) => sortDateLabels(left.data ?? left.visitDate ?? "", right.data ?? right.visitDate ?? ""))[0];

  return nextVisit?.data ?? nextVisit?.visitDate;
}
