import type { MissingProductItem } from "./product-request";

export type AttendanceRecord = {
  id: string;
  clientName: string;
  attendanceDate: string;
  completedItems: string[];
  productsUsed: string;
  observations: string;
  missingProducts: MissingProductItem[];
  beforePhotoUri: string;
  afterPhotoUri: string;
};
