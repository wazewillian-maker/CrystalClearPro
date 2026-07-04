import React, { useState } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AgendaScreen } from "./src/screens/AgendaScreen";
import { AtendimentoScreen } from "./src/screens/AtendimentoScreen";
import { ClientsScreen } from "./src/screens/clients-screen";
import { ClientDetailScreen } from "./src/screens/client-detail-screen";
import { EditClientScreen } from "./src/screens/edit-client-screen";
import { EstoqueScreen } from "./src/screens/EstoqueScreen";
import { FinanceiroScreen } from "./src/screens/FinanceiroScreen";
import { HistoricoScreen } from "./src/screens/HistoricoScreen";
import { HomeScreen } from "./src/screens/home-screen";
import { LoginScreen } from "./src/screens/login-screen";
import { NewClientScreen } from "./src/screens/new-client-screen";
import { ProdutosScreen } from "./src/screens/produtos-screen";
import type { AgendaItem, AgendaStatus } from "./src/types/agenda";
import type { AttendanceRecord } from "./src/types/attendance";
import type { Client, ClientFormData } from "./src/types/client";

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
  | "stock";

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<AppScreen>("login");
  const [clients, setClients] = useState<Client[]>([]);
  const [attendances, setAttendances] = useState<AttendanceRecord[]>([]);
  const [agendaItems, setAgendaItems] = useState<AgendaItem[]>(initialAgendaItems);
  const [selectedAgendaItemId, setSelectedAgendaItemId] = useState<string | null>(null);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const selectedClient = clients.find((client) => client.id === selectedClientId);
  const selectedAgendaItem = agendaItems.find((item) => item.id === selectedAgendaItemId);

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

  return (
    <SafeAreaProvider>
      {currentScreen === "login" ? (
        <LoginScreen onLogin={() => setCurrentScreen("home")} />
      ) : null}

      {currentScreen === "home" ? (
        <HomeScreen
          onOpenClients={() => setCurrentScreen("clients")}
          onOpenProducts={() => setCurrentScreen("products")}
          onOpenAttendance={handleOpenStandaloneAttendance}
          onOpenHistory={() => setCurrentScreen("history")}
          onOpenAgenda={() => setCurrentScreen("agenda")}
          onOpenFinance={() => setCurrentScreen("finance")}
          onOpenStock={() => setCurrentScreen("stock")}
          onLogout={() => setCurrentScreen("login")}
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
        <ProdutosScreen onBack={() => setCurrentScreen("home")} />
      ) : null}

      {currentScreen === "attendance" ? (
        <AtendimentoScreen
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

      {currentScreen === "finance" ? (
        <FinanceiroScreen
          clients={clients}
          onBack={() => setCurrentScreen("home")}
        />
      ) : null}

      {currentScreen === "stock" ? (
        <EstoqueScreen onBack={() => setCurrentScreen("home")} />
      ) : null}
    </SafeAreaProvider>
  );
}
