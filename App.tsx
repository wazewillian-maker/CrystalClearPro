import React, { useEffect, useState } from "react";
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
import { storageService } from "./src/services/storage-service";
import colors from "./src/theme/colors";
import type { AgendaItem, AgendaStatus } from "./src/types/agenda";
import type { AttendanceRecord } from "./src/types/attendance";
import type { Client, ClientFormData, ClientPlan } from "./src/types/client";
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
  const authenticatedPerfil = authenticatedUserProfile?.perfil;
  const isOperationalStaffView = isTestMode ? activeRole === "staff" : authenticatedPerfil === "funcionario";
  const canAccessClients =
    isTestMode ? activeRole === "owner" : authenticatedPerfil === "dono" || authenticatedPerfil === "socio";
  const canAccessFinance =
    isTestMode ? activeRole === "owner" : authenticatedPerfil === "dono" || authenticatedPerfil === "socio";
  const canAccessAdmin = isTestMode ? activeRole === "owner" : authenticatedPerfil === "dono";
  const canViewCommercialData = canAccessClients;
  const isRestrictedEmployee = !isTestMode && authenticatedPerfil === "funcionario";
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
      ? agendaItems.filter((item) => item.assignedEmployeeId === activeEmployee.id)
      : agendaItems;
  const visibleAttendances =
    isOperationalStaffView && activeEmployee
      ? attendances.filter((attendance) => attendance.employeeId === activeEmployee.id)
      : attendances;
  const visibleClientNames = new Set(visibleAgendaItems.map((item) => item.clientName));
  const visibleProductRequests =
    isOperationalStaffView
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
  }, [authLoading, authenticatedUserProfile?.empresaId, isTestMode]);

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
    const restrictedScreens: AppScreen[] = [
      "admin",
      "client-detail",
      "clients",
      "edit-client",
      "finance",
      "new-client",
      "new-pool",
      "team",
    ];

    if (authLoading || !isRestrictedEmployee || !restrictedScreens.includes(currentScreen)) {
      return;
    }

    blockRestrictedEmployeeAccess();
  }, [authLoading, currentScreen, isRestrictedEmployee]);

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

      setClients(
        firestoreClients
          .filter((client) => client.status !== "inativo")
          .map((client) =>
            mapFirestoreClientToAppClient(
              client,
              firestorePools.find((pool) => pool.clienteId === client.id && pool.status !== "inativa"),
            ),
          ),
      );
      setPools(firestorePools.filter((pool) => pool.status !== "inativa"));
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

      const activePools = firestorePools.filter((pool) => pool.status !== "inativa");
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

  async function loadFirestoreAgenda(profile: NonNullable<typeof authenticatedUserProfile>) {
    setAgendaLoading(true);
    setAgendaError("");

    try {
      const firestoreVisits =
        profile.perfil === "dono" || profile.perfil === "socio" || !profile.funcionarioId
          ? await visitasRepository.listByEmpresa(profile.empresaId)
          : await visitasRepository.listByFuncionario(profile.empresaId, profile.funcionarioId);
      const agendaClients =
        profile.perfil === "funcionario"
          ? await loadOperationalClientsForVisits(firestoreVisits)
          : clients;

      if (profile.perfil === "funcionario") {
        setClients((currentClients) =>
          haveSameOperationalClients(currentClients, agendaClients) ? currentClients : agendaClients,
        );
      }

      setAgendaItems(firestoreVisits.map((visit) => mapFirestoreVisitToAgendaItem(visit, agendaClients, employees)));
    } catch (error) {
      setAgendaError(getFirestoreFriendlyError(error, "Nao foi possivel carregar a agenda do Firestore."));
    } finally {
      setAgendaLoading(false);
    }
  }

  async function loadOperationalClientsForVisits(visits: Visita[]) {
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

    return validClients
      .map((client) =>
        mapFirestoreClientToOperationalClient(
          client,
          validPools.find((pool) => pool.clienteId === client.id && pool.status !== "inativa"),
        ),
      );
  }

  async function handleSaveClient(clientData: ClientFormData) {
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
        const initialReferencePhotoUrl = !isTemporaryPhotoUri(clientData.referencePhotoUri ?? "")
          ? clientData.referencePhotoUri
          : undefined;
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
        fotoReferenciaUrl: newClient.referencePhotoUri,
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
            selectedPool?.fotoReferenciaUrl ??
            (!isTemporaryPhotoUri(poolData.fotoReferenciaUrl ?? "") ? poolData.fotoReferenciaUrl : undefined);
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

        const initialPhotoData = isTemporaryPhotoUri(poolData.fotoReferenciaUrl ?? "")
          ? {}
          : {
              fotoReferenciaPath: poolData.fotoReferenciaPath,
              fotoReferenciaUrl: poolData.fotoReferenciaUrl,
            };
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

        setPools((currentPools) => [
          {
            ...savedPoolData,
            empresaId: authenticatedUserProfile.empresaId,
            id: piscinaId,
            status: "ativa",
          },
          ...currentPools,
        ]);
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
    return (
      uri.startsWith("blob:") ||
      uri.startsWith("file:") ||
      uri.startsWith("data:") ||
      uri.startsWith("content:") ||
      uri.startsWith("asset:")
    );
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
    const pool = pools.find((currentPool) => currentPool.id === poolId);

    if (!pool) {
      return;
    }

    setSelectedPoolId(poolId);
    setSelectedClientId(pool.clienteId);
    setCurrentScreen("new-pool");
  }

  async function handleDeletePool(poolId: string) {
    const pool = pools.find((currentPool) => currentPool.id === poolId);

    if (!pool) {
      throw new Error("Piscina nao encontrada.");
    }

    if (!isTestMode && (authenticatedUserProfile?.perfil === "dono" || authenticatedUserProfile?.perfil === "socio")) {
      try {
        const linkedVisits = await visitasRepository.listByPiscina(authenticatedUserProfile.empresaId, poolId);
        await Promise.all([
          piscinasRepository.delete(poolId),
          ...linkedVisits
            .filter((visit) => visit.status !== "concluida")
            .map((visit) => visitasRepository.delete(visit.id)),
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
            currentPool?.fotoReferenciaUrl ??
            (!isTemporaryPhotoUri(clientData.referencePhotoUri ?? "") ? clientData.referencePhotoUri : undefined);
          clientData = {
            ...clientData,
            referencePhotoUri: photoFields?.fotoReferenciaUrl ?? existingPhotoUrl,
          };
          await piscinasRepository.update(piscinaId, {
            diaVencimento: clientData.diaVencimento,
            fotoReferenciaPath: photoFields?.fotoReferenciaPath ?? currentPool?.fotoReferenciaPath,
            fotoReferenciaUrl: clientData.referencePhotoUri,
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
          showPoolPhotoUploadWarning(uploadedPhoto.warningMessage);
        } else {
          const initialReferencePhotoUrl = !isTemporaryPhotoUri(clientData.referencePhotoUri ?? "")
            ? clientData.referencePhotoUri
            : undefined;
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
                fotoReferenciaUrl: clientData.referencePhotoUri,
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

  async function handleUpdateAgendaStatus(agendaItemId: string, status: AgendaStatus) {
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
    const employee = employees.find((currentEmployee) => currentEmployee.id === employeeId);

    if (!employee) {
      return;
    }

    if (!isTestMode && authenticatedUserProfile) {
      try {
        await visitasRepository.update(agendaItemId, {
          funcionarioId: employee.id,
        });
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

  async function handleStartAgendaAttendance(agendaItem: AgendaItem) {
    setSelectedAgendaItemId(agendaItem.id);
    await handleUpdateAgendaStatus(agendaItem.id, "in-progress");
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
          onOpenClientArea={() => setCurrentScreen("client-area")}
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
          attendances={attendances.filter((attendance) => attendance.clientName === selectedClient.name)}
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

      {currentScreen === "attendance" ? (
        <AtendimentoScreen
          canViewCommercialData={canViewCommercialData}
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
          canViewCommercialData={canViewCommercialData}
          clients={clients}
          employees={employees.filter((employee) => employee.status === "active")}
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

function mapFirestoreClientToAppClient(cliente: Cliente, piscina?: Piscina): Client {
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
    referencePhotoUri: piscina?.fotoReferenciaUrl,
    valorMensal: piscina?.valorMensal ?? 0,
    weekDays: [],
  };
}

function mapFirestoreClientToOperationalClient(cliente: Cliente, piscina?: Piscina): Client {
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
    referencePhotoUri: piscina?.fotoReferenciaUrl,
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

function mapFirestoreVisitToAgendaItem(visit: Visita, currentClients: Client[], currentEmployees: Employee[]): AgendaItem {
  const client = currentClients.find((currentClient) => currentClient.id === visit.clienteId);
  const employee = currentEmployees.find((currentEmployee) => currentEmployee.id === visit.funcionarioId);

  return {
    address: client?.address ?? "Endereco nao informado",
    assignedEmployeeId: visit.funcionarioId,
    assignedEmployeeName: employee?.name,
    clientId: visit.clienteId,
    clientName: client?.name ?? "Cliente nao encontrado",
    data: visit.data,
    funcionarioId: visit.funcionarioId,
    id: visit.id,
    neighborhood: client?.neighborhood ?? "Bairro nao informado",
    origem: mapVisitaOrigemToAgendaOrigem(visit.origem),
    piscinaId: visit.piscinaId,
    status: mapVisitaStatusToAgendaStatus(visit.status),
    visitDate: visit.data,
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

  return statuses[status];
}

function mapVisitaOrigemToAgendaOrigem(origem: VisitaOrigem): NonNullable<AgendaItem["origem"]> {
  return origem === "manual" ? "Manual" : "Automatica";
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
