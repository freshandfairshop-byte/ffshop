export interface InventoryItem {
  id: number;
  item_name: string;
  stock_level: number;
  price: number; // Selling price in ৳ BDT (can be inserted manually or from 5% suggestion tab)
  shipment_code?: string; // Shipment batch code (e.g. SHP-2025-01)
  buying_price?: number; // Base buying price per unit in ৳ BDT
  transport_cost_shipment?: number; // Total transport cost for this shipment in ৳ BDT
  other_handling_cost?: number; // Other handling cost for this shipment in ৳ BDT
  items_in_shipment?: number; // Count of items in this shipment across which costs are equally dispersed
  dispersed_transport_cost?: number; // Transport cost equally dispersed per item in ৳ BDT
  dispersed_handling_cost?: number; // Handling cost equally dispersed per item in ৳ BDT
  total_buying_cost?: number; // Landed buying cost (buying_price + dispersed_transport + dispersed_handling)
  suggested_price_5pct?: number; // 5% profit suggested selling price (total_buying_cost * 1.05)
  base_cost?: number; // Legacy alias for buying price
  transport_cost_per_unit?: number; // Legacy alias for dispersed transport
  landed_cost?: number; // Legacy alias for total buying cost
  category?: string;
  sku?: string;
  updated_by: string;
  last_updated: string;
}

export interface ShipmentBatchIntake {
  shipment_code: string;
  transport_cost: number; // Total transport cost for this shipment in ৳ BDT
  other_handling_cost: number; // Other handling cost for shipment in ৳ BDT
  items: Array<{
    item_name: string;
    category?: string;
    sku?: string;
    stock_level: number;
    buying_price: number; // Base purchase price per unit
    selling_price: number; // Selling price (manually entered or suggested with 5% profit)
  }>;
}

export interface CustomerProfile {
  id: string;
  name: string;
  phone: string;
  address: string;
  total_orders: number;
  last_order_date?: string;
}

export interface SaleRecord {
  id: number;
  item_id: number;
  item_name: string;
  unit_price: number; // in ৳ BDT
  quantity_sold: number;
  subtotal_amount: number; // in ৳ BDT
  transport_cost: number; // Outbound shipping / transport fee in ৳ BDT (calculated separately)
  discount_amount: number; // in ৳ BDT
  total_amount: number; // (quantity * unit_price) + transport_cost - discount_amount in ৳ BDT
  sale_date: string;
  processed_by: string;
  receipt_number?: string;
  customer_name: string;
  customer_address: string;
  customer_phone: string;
}

export interface UserAccount {
  id: string;
  email: string;
  role: 'admin' | 'cashier' | 'manager';
  created_at: string;
  last_login?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  user_email: string;
  action_type: 'ADD_ITEM' | 'UPDATE_STOCK' | 'SALE' | 'MIGRATION' | 'CREATE_USER' | 'AUTH_LOGIN';
  details: string;
  target_id?: number | string;
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  serviceKey: string;
  isConnected: boolean;
  useLiveConnection: boolean;
}
