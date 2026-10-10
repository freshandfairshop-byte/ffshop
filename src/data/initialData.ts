import { InventoryItem, SaleRecord, UserAccount, AuditLog, CustomerProfile } from '../types';

export const INITIAL_CUSTOMERS: CustomerProfile[] = [
  {
    id: 'cust_01',
    name: 'Tanvir Ahmed',
    phone: '01712-345678',
    address: 'House 42, Road 11, Banani, Dhaka-1213',
    total_orders: 5,
    last_order_date: '2026-10-08T12:00:00Z',
  },
  {
    id: 'cust_02',
    name: 'Nusrat Jahan',
    phone: '01819-876543',
    address: 'Apt 5B, Green Heritage, Dhanmondi 27, Dhaka',
    total_orders: 3,
    last_order_date: '2026-10-09T08:30:00Z',
  },
  {
    id: 'cust_03',
    name: 'Rafiqul Islam',
    phone: '01911-223344',
    address: 'GEC Circle, Nasirabad, Chattogram',
    total_orders: 8,
    last_order_date: '2026-10-07T15:20:00Z',
  },
  {
    id: 'cust_04',
    name: 'Anika Tabassum',
    phone: '01678-990011',
    address: 'Sector 7, Road 14, Uttara, Dhaka-1230',
    total_orders: 2,
    last_order_date: '2026-10-09T09:15:00Z',
  },
  {
    id: 'cust_05',
    name: 'Zubair Hossain',
    phone: '01755-443322',
    address: 'Zindabazar, Amberkhana Road, Sylhet',
    total_orders: 4,
    last_order_date: '2026-10-05T11:10:00Z',
  },
];

export const INITIAL_INVENTORY: InventoryItem[] = [
  {
    id: 1,
    item_name: 'Premium Arabica Coffee Beans (1kg)',
    stock_level: 35,
    price: 3200.00, // ৳ BDT Selling Price
    shipment_code: 'SHP-2026-01',
    buying_price: 2400.00,
    transport_cost_shipment: 600.00,
    other_handling_cost: 150.00,
    items_in_shipment: 3,
    dispersed_transport_cost: 200.00, // 600 / 3 items
    dispersed_handling_cost: 50.00, // 150 / 3 items
    total_buying_cost: 2650.00, // 2400 + 200 + 50
    suggested_price_5pct: 2782.50, // 2650 * 1.05
    base_cost: 2400.00,
    transport_cost_per_unit: 200.00,
    landed_cost: 2650.00,
    category: 'Coffee Beans',
    sku: 'CB-ARA-001',
    updated_by: 'system@inventory.internal',
    last_updated: '2026-10-08T14:20:00Z',
  },
  {
    id: 2,
    item_name: 'Espresso Dark Roast Beans (500g)',
    stock_level: 8, // Low stock alert! (<10)
    price: 1650.00, // ৳ BDT Selling Price
    shipment_code: 'SHP-2026-01',
    buying_price: 1100.00,
    transport_cost_shipment: 600.00,
    other_handling_cost: 150.00,
    items_in_shipment: 3,
    dispersed_transport_cost: 200.00, // 600 / 3 items
    dispersed_handling_cost: 50.00, // 150 / 3 items
    total_buying_cost: 1350.00, // 1100 + 200 + 50
    suggested_price_5pct: 1417.50, // 1350 * 1.05
    base_cost: 1100.00,
    transport_cost_per_unit: 200.00,
    landed_cost: 1350.00,
    category: 'Coffee Beans',
    sku: 'CB-ESP-002',
    updated_by: 'sarah.manager@company.com',
    last_updated: '2026-10-09T08:15:00Z',
  },
  {
    id: 3,
    item_name: 'Barista Grade Oat Milk (1L)',
    stock_level: 70,
    price: 580.00, // ৳ BDT Selling Price
    shipment_code: 'SHP-2026-02',
    buying_price: 380.00,
    transport_cost_shipment: 360.00,
    other_handling_cost: 80.00,
    items_in_shipment: 2,
    dispersed_transport_cost: 180.00, // 360 / 2 items
    dispersed_handling_cost: 40.00, // 80 / 2 items
    total_buying_cost: 600.00,
    suggested_price_5pct: 630.00,
    base_cost: 380.00,
    transport_cost_per_unit: 180.00,
    landed_cost: 600.00,
    category: 'Dairy & Milks',
    sku: 'DM-OAT-003',
    updated_by: 'alex.cashier@company.com',
    last_updated: '2026-10-07T11:45:00Z',
  },
  {
    id: 4,
    item_name: 'Ceramic Pour-Over V60 Dripper',
    stock_level: 6, // Low stock alert! (<10)
    price: 2450.00, // ৳ BDT Selling Price
    shipment_code: 'SHP-2026-03',
    buying_price: 1600.00,
    transport_cost_shipment: 800.00,
    other_handling_cost: 200.00,
    items_in_shipment: 4,
    dispersed_transport_cost: 200.00, // 800 / 4 items
    dispersed_handling_cost: 50.00, // 200 / 4 items
    total_buying_cost: 1850.00,
    suggested_price_5pct: 1942.50,
    base_cost: 1600.00,
    transport_cost_per_unit: 200.00,
    landed_cost: 1850.00,
    category: 'Brewing Gear',
    sku: 'BG-V60-004',
    updated_by: 'admin@company.com',
    last_updated: '2026-10-08T17:00:00Z',
  },
  {
    id: 5,
    item_name: 'Japanese Organic Ceremonial Matcha (50g)',
    stock_level: 22,
    price: 2950.00, // ৳ BDT Selling Price
    shipment_code: 'SHP-2026-03',
    buying_price: 1950.00,
    transport_cost_shipment: 800.00,
    other_handling_cost: 200.00,
    items_in_shipment: 4,
    dispersed_transport_cost: 200.00,
    dispersed_handling_cost: 50.00,
    total_buying_cost: 2200.00,
    suggested_price_5pct: 2310.00,
    base_cost: 1950.00,
    transport_cost_per_unit: 200.00,
    landed_cost: 2200.00,
    category: 'Teas & Powders',
    sku: 'TP-MAT-005',
    updated_by: 'sarah.manager@company.com',
    last_updated: '2026-10-06T15:30:00Z',
  },
  {
    id: 6,
    item_name: 'Insulated Thermal Tumbler (400ml)',
    stock_level: 5, // Low stock alert! (<10)
    price: 1850.00, // ৳ BDT Selling Price
    shipment_code: 'SHP-2026-03',
    buying_price: 1150.00,
    transport_cost_shipment: 800.00,
    other_handling_cost: 200.00,
    items_in_shipment: 4,
    dispersed_transport_cost: 200.00,
    dispersed_handling_cost: 50.00,
    total_buying_cost: 1400.00,
    suggested_price_5pct: 1470.00,
    base_cost: 1150.00,
    transport_cost_per_unit: 200.00,
    landed_cost: 1400.00,
    category: 'Drinkware',
    sku: 'DW-TUM-006',
    updated_by: 'alex.cashier@company.com',
    last_updated: '2026-10-09T07:45:00Z',
  },
  {
    id: 7,
    item_name: 'French Vanilla Syrup Bottle (750ml)',
    stock_level: 35,
    price: 1400.00, // ৳ BDT Selling Price
    shipment_code: 'SHP-2026-04',
    buying_price: 900.00,
    transport_cost_shipment: 300.00,
    other_handling_cost: 60.00,
    items_in_shipment: 2,
    dispersed_transport_cost: 150.00,
    dispersed_handling_cost: 30.00,
    total_buying_cost: 1080.00,
    suggested_price_5pct: 1134.00,
    base_cost: 900.00,
    transport_cost_per_unit: 150.00,
    landed_cost: 1080.00,
    category: 'Syrups & Flavors',
    sku: 'SF-VAN-007',
    updated_by: 'admin@company.com',
    last_updated: '2026-10-05T09:10:00Z',
  },
  {
    id: 8,
    item_name: 'Japanese V60 Filter Paper (100 Sheets)',
    stock_level: 45,
    price: 750.00, // ৳ BDT Selling Price
    shipment_code: 'SHP-2026-03',
    buying_price: 450.00,
    transport_cost_shipment: 800.00,
    other_handling_cost: 200.00,
    items_in_shipment: 4,
    dispersed_transport_cost: 200.00,
    dispersed_handling_cost: 50.00,
    total_buying_cost: 700.00,
    suggested_price_5pct: 735.00,
    base_cost: 450.00,
    transport_cost_per_unit: 200.00,
    landed_cost: 700.00,
    category: 'Brewing Gear',
    sku: 'BG-FIL-008',
    updated_by: 'sarah.manager@company.com',
    last_updated: '2026-10-07T13:25:00Z',
  },
];

export const INITIAL_SALES: SaleRecord[] = [
  {
    id: 101,
    item_id: 1,
    item_name: 'Premium Arabica Coffee Beans (1kg)',
    unit_price: 3200.00,
    quantity_sold: 2,
    subtotal_amount: 6400.00,
    transport_cost: 150.00, // Separate delivery/transport fee in ৳ BDT
    discount_amount: 0.00,
    total_amount: 6550.00, // ৳ 6,550
    sale_date: '2026-10-09T08:30:00Z',
    processed_by: 'alex.cashier@company.com',
    receipt_number: 'INV-20261009-001',
    customer_name: 'Tanvir Ahmed',
    customer_phone: '01712-345678',
    customer_address: 'House 42, Road 11, Banani, Dhaka-1213',
  },
  {
    id: 102,
    item_id: 3,
    item_name: 'Barista Grade Oat Milk (1L)',
    unit_price: 580.00,
    quantity_sold: 4,
    subtotal_amount: 2320.00,
    transport_cost: 100.00, // Delivery fee
    discount_amount: 120.00, // Discount promo
    total_amount: 2300.00, // ৳ 2,300
    sale_date: '2026-10-09T08:45:00Z',
    processed_by: 'alex.cashier@company.com',
    receipt_number: 'INV-20261009-002',
    customer_name: 'Nusrat Jahan',
    customer_phone: '01819-876543',
    customer_address: 'Apt 5B, Green Heritage, Dhanmondi 27, Dhaka',
  },
  {
    id: 103,
    item_id: 2,
    item_name: 'Espresso Dark Roast Beans (500g)',
    unit_price: 1650.00,
    quantity_sold: 1,
    subtotal_amount: 1650.00,
    transport_cost: 120.00,
    discount_amount: 0.00,
    total_amount: 1770.00, // ৳ 1,770
    sale_date: '2026-10-09T09:12:00Z',
    processed_by: 'sarah.manager@company.com',
    receipt_number: 'INV-20261009-003',
    customer_name: 'Rafiqul Islam',
    customer_phone: '01911-223344',
    customer_address: 'GEC Circle, Nasirabad, Chattogram',
  },
];

export const INITIAL_USERS: UserAccount[] = [
  {
    id: 'usr_001',
    email: 'admin@company.com',
    role: 'admin',
    created_at: '2026-09-01T00:00:00Z',
    last_login: '2026-10-09T09:20:00Z',
  },
  {
    id: 'usr_002',
    email: 'sarah.manager@company.com',
    role: 'manager',
    created_at: '2026-09-10T10:00:00Z',
    last_login: '2026-10-09T08:00:00Z',
  },
  {
    id: 'usr_003',
    email: 'alex.cashier@company.com',
    role: 'cashier',
    created_at: '2026-09-15T12:30:00Z',
    last_login: '2026-10-09T07:30:00Z',
  },
];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'aud_001',
    timestamp: '2026-10-09T07:30:00Z',
    user_email: 'alex.cashier@company.com',
    action_type: 'AUTH_LOGIN',
    details: 'User authenticated via Supabase Auth credentials',
  },
  {
    id: 'aud_002',
    timestamp: '2026-10-09T08:30:00Z',
    user_email: 'alex.cashier@company.com',
    action_type: 'SALE',
    details: 'Processed order #101: 2x Premium Arabica to Tanvir Ahmed (01712-345678) [Item: ৳6,400 + Transport: ৳150 = ৳6,550 BDT]',
    target_id: 101,
  },
  {
    id: 'aud_003',
    timestamp: '2026-10-09T08:45:00Z',
    user_email: 'alex.cashier@company.com',
    action_type: 'SALE',
    details: 'Processed order #102: 4x Barista Oat Milk to Nusrat Jahan (01819-876543) [Item: ৳2,320 + Transport: ৳100 - Discount: ৳120 = ৳2,300 BDT]',
    target_id: 102,
  },
  {
    id: 'aud_004',
    timestamp: '2026-10-09T09:12:00Z',
    user_email: 'sarah.manager@company.com',
    action_type: 'SALE',
    details: 'Processed order #103: 1x Espresso Dark Roast to Rafiqul Islam (01911-223344) [Item: ৳1,650 + Transport: ৳120 = ৳1,770 BDT]',
    target_id: 103,
  },
];

export const LEGACY_EXCEL_TEMPLATE_DATA = [
  { item_name: 'Nitro Cold Brew Keg (20L)', stock_level: 12, price: 11500.00 },
  { item_name: 'Digital Pour-Over Scale with Timer', stock_level: 15, price: 3450.00 },
  { item_name: 'Guatemalan Antigua Whole Bean (1kg)', stock_level: 20, price: 3100.00 },
  { item_name: 'Organic Hot Cocoa Powder (500g)', stock_level: 40, price: 950.00 },
  { item_name: 'Stainless Steel Milk Frothing Pitcher (600ml)', stock_level: 18, price: 1850.00 },
  { item_name: 'Specialty Cascara Cherry Tea (250g)', stock_level: 8, price: 1550.00 },
  { item_name: 'Cold Drip Dutch Tower System', stock_level: 3, price: 18500.00 },
  { item_name: 'Eco Bamboo Stir Sticks (Pack of 500)', stock_level: 50, price: 420.00 },
];
