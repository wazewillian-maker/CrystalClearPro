import type { MissingProductItem } from "./product-request";

export type AttendanceProductUsed = {
  id: string;
  product: string;
  quantity: string;
  unit: string;
};

export type AttendanceWaterParameters = {
  alkalinity?: string;
  chlorine?: string;
  ph?: string;
  temperature?: string;
};

export type AttendanceRecord = {
  id: string;
  status?: "concluido";
  clienteId?: string;
  clientName: string;
  empresaId?: string;
  attendanceDate: string;
  completedAt?: string;
  employeeId?: string;
  employeeName?: string;
  piscinaId?: string;
  poolName?: string;
  visitaId?: string;
  completedItems: string[];
  ph?: string;
  chlorine?: string;
  alkalinity?: string;
  temperature?: string;
  waterParameters?: AttendanceWaterParameters;
  productsUsedItems?: AttendanceProductUsed[];
  productsUsed: string;
  observations: string;
  missingProducts: MissingProductItem[];
  beforePhotoUri: string;
  afterPhotoUri: string;
};
