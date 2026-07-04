export type ProductRequestStatus =
  | "pending-approval"
  | "partially-approved"
  | "approved"
  | "rejected";

export type ProductRequestItemStatus = "pending" | "approved" | "rejected" | "delivered";

export type MissingProductItem = {
  id: string;
  product: string;
  quantity: string;
  observation: string;
};

export type ProductRequestItem = MissingProductItem & {
  approvedAt?: string;
  deliveryPhotoUri?: string;
  status: ProductRequestItemStatus;
};

export type ProductRequest = {
  id: string;
  attendanceId: string;
  clientName: string;
  neighborhood: string;
  nextVisitDate: string;
  status: ProductRequestStatus;
  items: ProductRequestItem[];
};

export const initialProductRequests: ProductRequest[] = [
  {
    id: "1",
    attendanceId: "sample-1",
    clientName: "Condominio Lago Azul",
    neighborhood: "Jardim Europa",
    nextVisitDate: "15/07/2026",
    status: "pending-approval",
    items: [
      {
        id: "1-1",
        product: "Cloro granulado",
        quantity: "2 kg",
        observation: "Piscina com cloro baixo no ultimo atendimento.",
        status: "pending",
      },
      {
        id: "1-2",
        product: "Peneira",
        quantity: "1 unidade",
        observation: "Levar na proxima limpeza.",
        status: "pending",
      },
    ],
  },
  {
    id: "2",
    attendanceId: "sample-2",
    clientName: "Marina Costa",
    neighborhood: "Vila Mariana",
    nextVisitDate: "15/07/2026",
    status: "approved",
    items: [
      {
        id: "2-1",
        product: "Barrilha leve",
        quantity: "1 kg",
        observation: "Ajustar pH antes da aspiracao.",
        status: "approved",
      },
    ],
  },
  {
    id: "3",
    attendanceId: "sample-3",
    clientName: "Academia Aqua Fit",
    neighborhood: "Centro",
    nextVisitDate: "16/07/2026",
    status: "rejected",
    items: [
      {
        id: "3-1",
        product: "Clarificante",
        quantity: "500 ml",
        observation: "Deixar reservado para uso apos a limpeza.",
        status: "rejected",
      },
    ],
  },
];
