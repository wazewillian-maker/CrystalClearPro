export type MaintenanceStatus = "scheduled" | "urgent" | "done";

export type MaintenanceTask = {
  id: string;
  poolName: string;
  address: string;
  service: string;
  time: string;
  status: MaintenanceStatus;
};

export type DashboardMetric = {
  id: string;
  label: string;
  value: string;
  helper: string;
  tone: string;
};
