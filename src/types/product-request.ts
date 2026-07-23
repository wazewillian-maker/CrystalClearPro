export type ProductRequestStatus =
  | "pending-approval"
  | "partially-approved"
  | "approved"
  | "rejected";

export type ProductRequestItemStatus = "pending" | "approved" | "rejected" | "delivered";

export type ProductUnit = "kg" | "g" | "L" | "ml" | "unidade";

export type MissingProductItem = {
  id: string;
  product: string;
  quantity: string;
  observation: string;
  unit?: ProductUnit;
};

export type ProductRequestItem = MissingProductItem & {
  approvedAt?: string;
  deliveredAt?: string;
  deliveryPhotoUri?: string;
  status: ProductRequestItemStatus;
};

export type ProductRequest = {
  id: string;
  address?: string;
  attendanceId: string;
  clientId?: string;
  clientName: string;
  neighborhood: string;
  nextVisitDate: string;
  piscinaId?: string;
  poolName?: string;
  status: ProductRequestStatus;
  items: ProductRequestItem[];
  visitId?: string;
};
