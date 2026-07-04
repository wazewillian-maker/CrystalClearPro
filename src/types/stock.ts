export type StockUnit = "kg" | "g" | "litros" | "ml" | "unidade";

export type StockProduct = {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: StockUnit;
  minimumStock: number;
};

export const unitOptions: StockUnit[] = ["kg", "g", "litros", "ml", "unidade"];

export const initialStockProducts: StockProduct[] = [
  {
    id: "1",
    name: "Cloro granulado",
    category: "Tratamento",
    quantity: 8,
    unit: "kg",
    minimumStock: 5,
  },
  {
    id: "2",
    name: "Clarificante",
    category: "Tratamento",
    quantity: 1,
    unit: "litros",
    minimumStock: 2,
  },
  {
    id: "3",
    name: "Peneira",
    category: "Equipamentos",
    quantity: 3,
    unit: "unidade",
    minimumStock: 1,
  },
];

export function isLowStock(product: StockProduct) {
  return product.quantity <= product.minimumStock;
}
