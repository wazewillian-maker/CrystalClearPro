export type PaymentStatus = "overdue" | "pending" | "paid";

export type PaymentStatuses = Record<string, PaymentStatus>;

export type PaymentHistoryRecord = {
  id: string;
  clientId: string;
  amount: number;
  paidAt: string;
  referenceMonth: string;
  status: Extract<PaymentStatus, "paid">;
};
