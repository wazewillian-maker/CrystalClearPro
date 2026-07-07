import type { MissingProductItem } from "./product-request";

export type AttendanceRecord = {
  id: string;
  clienteId?: string;
  clientName: string;
  empresaId?: string;
  attendanceDate: string;
  employeeId?: string;
  employeeName?: string;
  piscinaId?: string;
  poolName?: string;
  visitaId?: string;
  completedItems: string[];
  ph?: string;
  chlorine?: string;
  productsUsed: string;
  observations: string;
  missingProducts: MissingProductItem[];
  beforePhotoUri: string;
  afterPhotoUri: string;
};
