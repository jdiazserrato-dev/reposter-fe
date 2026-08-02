export interface Client {
  id: number;
  name: string;
  phone: string;
}

export interface Product {
  id: number;
  name: string;
  category: string;
  basePrice: number;
  photoPath?: string | null;
}

export interface Ingredient {
  id: number;
  name: string;
}

export type Unit = 'g' | 'ml' | 'und';

export interface RecipeItem {
  id?: number;
  ingredientId?: number | null;
  ingredientName: string;
  quantity: number;
  unit: Unit;
}

export interface Recipe {
  id: number;
  name: string;
  servings?: number | null;
  prepTime?: number | null;
  procedure?: string[] | null;
  notes?: string | null;
  photoPath?: string | null;
  items: RecipeItem[];
}

export type OrderStatus =
  | 'PENDING'
  | 'IN_PRODUCTION'
  | 'READY_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED';

export interface OrderItem {
  id?: number;
  productId?: number | null;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal?: number;
}

export interface Order {
  id: number;
  orderNumber: string;
  clientId: number;
  client: Client;
  totalAmount: number;
  deliveryDate: string;
  status: OrderStatus;
  notes?: string | null;
  photoPath?: string | null;
  items: OrderItem[];
}

export interface TopProduct {
  productId: number | null;
  productName: string;
  quantity: number;
}

export interface DashboardSummary {
  revenueWeek: number;
  revenueMonth: number;
  revenueYear: number;
  ordersCount: number;
  deliveredCount: number;
  cancelledCount: number;
  topProduct: TopProduct | null;
  recentOrders: Order[];
}
