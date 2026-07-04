import React, { useState } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AgendaScreen } from "./src/screens/AgendaScreen";
import { AtendimentoScreen } from "./src/screens/AtendimentoScreen";
import { ClienteAreaScreen } from "./src/screens/ClienteAreaScreen";
import { ClientsScreen } from "./src/screens/clients-screen";
import { ClientDetailScreen } from "./src/screens/client-detail-screen";
import { EditClientScreen } from "./src/screens/edit-client-screen";
import { FinanceiroScreen } from "./src/screens/FinanceiroScreen";
import { HistoricoScreen } from "./src/screens/HistoricoScreen";
import { HomeScreen } from "./src/screens/home-screen";
import { LoginScreen, type TestUserRole } from "./src/screens/login-screen";
import { NewClientScreen } from "./src/screens/new-client-screen";
import { ProdutosScreen } from "./src/screens/produtos-screen";
import colors from "./src/theme/colors";
import type { AgendaItem, AgendaStatus } from "./src/types/agenda";
import type { AttendanceRecord } from "./src/types/attendance";
import type { Client, ClientFormData } from "./src/types/client";
import type { PaymentStatuses } from "./src/types/finance";
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
    status: "pending",
  },
  {
    id: "2",
    clientName: "Marina Costa",
    neighborhood: "Vila Mariana",
    address: "Avenida Primavera, 88",
    status: "pending",
  },
  {
    id: "3",
    clientName: "Academia Aqua Fit",
    neighborhood: "Centro",
    address: "Rua do Mercado, 40",
    status: "in-progress",
  },
];

type AppScreen =
  | "login"
  | "home"
  | "clients"
  | "new-client"
  | "edit-client"
  | "client-detail"
  | "products"
  | "attendance"
  | "history"
  | "agenda"
  | "finance"
  | "client-area";

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<AppScreen>("login");
  const [activeRole, setActiveRole] = useState<TestUserRole>("owner");
  const [clients, setClients] = useState<Client[]>([]);
  const [attendances, setAttendances] = useState<AttendanceRecord[]>([]);
  const [agendaItems, setAgendaItems] = useState<AgendaItem[]>(initialAgendaItems);
  const [paymentStatuses, setPaymentStatuses] = useState<PaymentStatuses>({});
  const [productRequests, setProductRequests] = useState<ProductRequest[]>(initialProductRequests);
  const [selectedAgendaItemId, setSelectedAgendaItemId] = useState<string | null>(null);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const selectedClient = clients.find((client) => client.id === selectedClientId);
  const selectedAgendaItem = agendaItems.find((item) => item.id === selectedAgendaItemId);
  const productsPendingCount = productRequests.reduce(
    (total, request) =>
      total + request.items.filter((item) => item.status === "approved").length,
    0,
  );
  const pendingProductApprovalCount = productRequests.filter(
    (request) => request.status === "pending-approval",
  ).length;
  const pendingPaymentCount = clients.filter(
    (client) => hasMonthlyValue(client) && paymentStatuses[client.id] !== "paid",
  ).length;
  const dashboardMetrics = [
    {
      helper: "Itens planejados para hoje",
      id: "agenda",
      label: "Piscinas do dia",
      tone: colors.primary,
      value: String(agendaItems.length),
    },
    {
      helper: "Atendimentos salvos no historico",
      id: "completed",
      label: "Atendimentos concluidos",
      tone: colors.success,
      value: String(attendances.length),
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
  const profileLabel = getProfileLabel(activeRole);
  const testClient = clients[0] ?? fallbackTestClient;
  const testClientPaymentStatus = paymentStatuses[testClient.id] ?? "pending";

  function handleLogin(role: TestUserRole) {
    setActiveRole(role);
    setCurrentScreen(role === "client" ? "client-area" : "home");
  }

  function handleSwitchProfile() {
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
    setAttendances((currentAttendances) => [attendance, ...currentAttendances]);

    if (attendance.missingProducts.length > 0) {
      const selectedClientForAttendance = clients.find(
        (client) => client.name === attendance.clientName,
      );

      const productRequest: ProductRequest = {
        id: `${attendance.id}-products`,
        attendanceId: attendance.id,
        clientName: attendance.clientName,
        neighborhood: selectedClientForAttendance?.neighborhood ?? "Nao informado",
        nextVisitDate: attendance.attendanceDate,
        status: "pending-approval",
        items: attendance.missingProducts.map((item) => ({
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
      {currentScreen === "login" ? (
        <LoginScreen onLogin={handleLogin} />
      ) : null}

      {currentScreen === "home" ? (
        <HomeScreen
          agendaItems={agendaItems}
          canAccessFinance={canAccessFinance}
          dashboardMetrics={visibleDashboardMetrics}
          onOpenClients={() => setCurrentScreen("clients")}
          onOpenProducts={() => setCurrentScreen("products")}
          onOpenAttendance={handleOpenStandaloneAttendance}
          onOpenHistory={() => setCurrentScreen("history")}
          onOpenAgenda={() => setCurrentScreen("agenda")}
          onOpenFinance={() => setCurrentScreen("finance")}
          onOpenClientArea={() => setCurrentScreen("client-area")}
          onSwitchProfile={handleSwitchProfile}
          onLogout={() => setCurrentScreen("login")}
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
          onBack={() => setCurrentScreen("home")}
          onConfirmDelivery={handleConfirmProductDelivery}
          productRequests={productRequests}
        />
      ) : null}

      {currentScreen === "attendance" ? (
        <AtendimentoScreen
          clients={clients}
          onBack={() => setCurrentScreen("home")}
          onSaveAttendance={handleSaveAttendance}
          initialClientName={selectedAgendaItem?.clientName}
        />
      ) : null}

      {currentScreen === "history" ? (
        <HistoricoScreen
          attendances={attendances}
          onBack={() => setCurrentScreen("home")}
        />
      ) : null}

      {currentScreen === "agenda" ? (
        <AgendaScreen
          agendaItems={agendaItems}
          onBack={() => setCurrentScreen("home")}
          onStartAttendance={handleStartAgendaAttendance}
          onUpdateStatus={handleUpdateAgendaStatus}
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
