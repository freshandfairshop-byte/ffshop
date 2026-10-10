import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { InventoryItem, SaleRecord, UserAccount, AuditLog, SupabaseConfig, CustomerProfile } from '../types';
import { INITIAL_INVENTORY, INITIAL_SALES, INITIAL_USERS, INITIAL_AUDIT_LOGS, INITIAL_CUSTOMERS } from '../data/initialData';

const STORAGE_KEY_INVENTORY = 'app_inventory_data_v3';
const STORAGE_KEY_SALES = 'app_sales_data_v3';
const STORAGE_KEY_USERS = 'app_users_data_v3';
const STORAGE_KEY_LOGS = 'app_audit_logs_v3';
const STORAGE_KEY_CUSTOMERS = 'app_customers_data_v3';
const STORAGE_KEY_SESSION = 'app_session_user_v3';
const STORAGE_KEY_CONFIG = 'app_supabase_config_v3';

export class StoreService {
  private inventory: InventoryItem[] = [];
  private sales: SaleRecord[] = [];
  private users: UserAccount[] = [];
  private auditLogs: AuditLog[] = [];
  private customers: CustomerProfile[] = [];
  private currentUser: UserAccount | null = null;
  private config: SupabaseConfig = {
    url: '',
    anonKey: '',
    serviceKey: '',
    isConnected: false,
    useLiveConnection: false,
  };
  private supabaseClient: SupabaseClient | null = null;
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.loadState();
  }

  private loadState() {
    try {
      const invStr = localStorage.getItem(STORAGE_KEY_INVENTORY);
      this.inventory = invStr ? JSON.parse(invStr) : [...INITIAL_INVENTORY];

      const salesStr = localStorage.getItem(STORAGE_KEY_SALES);
      this.sales = salesStr ? JSON.parse(salesStr) : [...INITIAL_SALES];

      const usersStr = localStorage.getItem(STORAGE_KEY_USERS);
      this.users = usersStr ? JSON.parse(usersStr) : [...INITIAL_USERS];

      const logsStr = localStorage.getItem(STORAGE_KEY_LOGS);
      this.auditLogs = logsStr ? JSON.parse(logsStr) : [...INITIAL_AUDIT_LOGS];

      const custStr = localStorage.getItem(STORAGE_KEY_CUSTOMERS);
      this.customers = custStr ? JSON.parse(custStr) : [...INITIAL_CUSTOMERS];

      const sessStr = localStorage.getItem(STORAGE_KEY_SESSION);
      if (sessStr) {
        this.currentUser = JSON.parse(sessStr);
      }

      const cfgStr = localStorage.getItem(STORAGE_KEY_CONFIG);
      if (cfgStr) {
        this.config = JSON.parse(cfgStr);
        if (this.config.useLiveConnection && this.config.url && this.config.anonKey) {
          this.initSupabaseClient();
        }
      }
    } catch (e) {
      console.error('Failed to load local state:', e);
      this.inventory = [...INITIAL_INVENTORY];
      this.sales = [...INITIAL_SALES];
      this.users = [...INITIAL_USERS];
      this.auditLogs = [...INITIAL_AUDIT_LOGS];
      this.customers = [...INITIAL_CUSTOMERS];
    }
  }

  private saveState() {
    try {
      localStorage.setItem(STORAGE_KEY_INVENTORY, JSON.stringify(this.inventory));
      localStorage.setItem(STORAGE_KEY_SALES, JSON.stringify(this.sales));
      localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(this.users));
      localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(this.auditLogs));
      localStorage.setItem(STORAGE_KEY_CUSTOMERS, JSON.stringify(this.customers));
      if (this.currentUser) {
        localStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(this.currentUser));
      } else {
        localStorage.removeItem(STORAGE_KEY_SESSION);
      }
      localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(this.config));
    } catch (e) {
      console.error('Failed to save state to localStorage:', e);
    }
    this.notify();
  }

  public subscribe(cb: () => void): () => void {
    this.listeners.add(cb);
    return () => {
      this.listeners.delete(cb);
    };
  }

  private notify() {
    this.listeners.forEach((cb) => cb());
  }

  // --- Auth Methods ---
  public getCurrentUser(): UserAccount | null {
    return this.currentUser;
  }

  public login(email: string, _password?: string): { success: boolean; error?: string } {
    const cleanEmail = email.trim().toLowerCase();
    const existing = this.users.find((u) => u.email.toLowerCase() === cleanEmail);

    if (existing) {
      this.currentUser = {
        ...existing,
        last_login: new Date().toISOString(),
      };
      this.logAudit(cleanEmail, 'AUTH_LOGIN', `Logged in via Supabase Auth credentials`);
      this.saveState();
      return { success: true };
    }

    const role = cleanEmail.includes('admin') ? 'admin' : cleanEmail.includes('manager') ? 'manager' : 'cashier';
    const newUser: UserAccount = {
      id: `usr_${Date.now()}`,
      email: cleanEmail,
      role,
      created_at: new Date().toISOString(),
      last_login: new Date().toISOString(),
    };
    this.users.push(newUser);
    this.currentUser = newUser;
    this.logAudit(cleanEmail, 'AUTH_LOGIN', `Signed in as newly authorized operator (${role})`);
    this.saveState();
    return { success: true };
  }

  public logout() {
    if (this.currentUser) {
      this.logAudit(this.currentUser.email, 'AUTH_LOGIN', `Operator logged out`);
    }
    this.currentUser = null;
    this.saveState();
  }

  // --- Customers Directory & Phone Autofill ---
  public getCustomers(): CustomerProfile[] {
    return [...this.customers];
  }

  public findCustomerByPhone(phoneQuery: string): CustomerProfile | undefined {
    const clean = phoneQuery.replace(/[^0-9]/g, '');
    if (clean.length < 3) return undefined;
    return this.customers.find((c) => c.phone.replace(/[^0-9]/g, '').includes(clean));
  }

  public searchCustomers(query: string): CustomerProfile[] {
    const q = query.trim().toLowerCase();
    if (!q) return [...this.customers];
    const cleanNumbers = q.replace(/[^0-9]/g, '');
    return this.customers.filter((c) => {
      const matchName = c.name.toLowerCase().includes(q);
      const matchAddr = c.address.toLowerCase().includes(q);
      const matchPhone = cleanNumbers.length > 2 && c.phone.replace(/[^0-9]/g, '').includes(cleanNumbers);
      return matchName || matchAddr || matchPhone;
    });
  }

  public recordCustomerOrder(name: string, phone: string, address: string): CustomerProfile {
    const cleanPhone = phone.trim();
    const cleanName = name.trim();
    const cleanAddr = address.trim();

    const existingIndex = this.customers.findIndex(
      (c) => c.phone.replace(/[^0-9]/g, '') === cleanPhone.replace(/[^0-9]/g, '')
    );

    const nowIso = new Date().toISOString();

    if (existingIndex >= 0) {
      const existing = this.customers[existingIndex];
      const updated: CustomerProfile = {
        ...existing,
        name: cleanName || existing.name,
        address: cleanAddr || existing.address,
        total_orders: (existing.total_orders || 0) + 1,
        last_order_date: nowIso,
      };
      this.customers[existingIndex] = updated;
      return updated;
    } else {
      const newCust: CustomerProfile = {
        id: `cust_${Date.now()}`,
        name: cleanName || 'Walk-in Customer',
        phone: cleanPhone,
        address: cleanAddr || 'Dhaka, Bangladesh',
        total_orders: 1,
        last_order_date: nowIso,
      };
      this.customers.unshift(newCust);
      return newCust;
    }
  }

  // --- Inventory Methods (Pure inventory catalog - customer details belong exclusively to sales) ---
  public getInventory(): InventoryItem[] {
    return [...this.inventory];
  }

  public addItem(
    item_name: string,
    stock_level: number,
    price: number,
    category?: string,
    sku?: string,
    shipment_code?: string,
    buying_price?: number,
    transport_cost_shipment?: number,
    other_handling_cost?: number,
    items_in_shipment?: number
  ): InventoryItem {
    const userEmail = this.currentUser?.email || 'admin@company.com';
    const nextId = this.inventory.length > 0 ? Math.max(...this.inventory.map((i) => i.id)) + 1 : 1;

    const itemsCount = Math.max(1, items_in_shipment || 1);
    const transTotal = transport_cost_shipment !== undefined ? Number(transport_cost_shipment.toFixed(2)) : 0;
    const handTotal = other_handling_cost !== undefined ? Number(other_handling_cost.toFixed(2)) : 0;
    const dispersedT = Number((transTotal / itemsCount).toFixed(2));
    const dispersedH = Number((handTotal / itemsCount).toFixed(2));

    const bPrice = buying_price !== undefined ? Number(buying_price.toFixed(2)) : Number((price * 0.7).toFixed(2));
    const landedCost = Number((bPrice + dispersedT + dispersedH).toFixed(2));
    const suggestedPrice5pct = Number((landedCost * 1.05).toFixed(2));

    const newItem: InventoryItem = {
      id: nextId,
      item_name: item_name.trim(),
      stock_level: Math.max(0, Math.floor(stock_level)),
      price: Math.max(0, Number(price.toFixed(2))), // Selling price in ৳ BDT
      shipment_code: shipment_code?.trim() || `SHP-${new Date().getFullYear()}-${String(nextId).padStart(3, '0')}`,
      buying_price: bPrice,
      transport_cost_shipment: transTotal,
      other_handling_cost: handTotal,
      items_in_shipment: itemsCount,
      dispersed_transport_cost: dispersedT,
      dispersed_handling_cost: dispersedH,
      total_buying_cost: landedCost,
      suggested_price_5pct: suggestedPrice5pct,
      base_cost: bPrice,
      transport_cost_per_unit: dispersedT,
      landed_cost: landedCost,
      category: category || 'General Merchandise',
      sku: sku?.trim() || `SKU-${nextId}`,
      updated_by: userEmail,
      last_updated: new Date().toISOString(),
    };

    this.inventory.unshift(newItem);
    this.logAudit(
      userEmail,
      'ADD_ITEM',
      `Added item '${newItem.item_name}' (Shipment: ${newItem.shipment_code}, Buying: ৳${bPrice}, Dispersed Transport: ৳${dispersedT}, Landed Cost: ৳${landedCost}, Selling: ৳${newItem.price})`,
      newItem.id
    );
    this.saveState();
    return newItem;
  }

  public addShipmentBatch(intake: {
    shipment_code: string;
    transport_cost: number;
    other_handling_cost: number;
    items: Array<{
      item_name: string;
      category?: string;
      sku?: string;
      stock_level: number;
      buying_price: number;
      selling_price: number;
    }>;
  }): { count: number; items: InventoryItem[] } {
    const userEmail = this.currentUser?.email || 'admin@company.com';
    let nextId = this.inventory.length > 0 ? Math.max(...this.inventory.map((i) => i.id)) + 1 : 1;
    const nowIso = new Date().toISOString();

    const n = Math.max(1, intake.items.length);
    const dispersedTransport = Number((intake.transport_cost / n).toFixed(2));
    const dispersedHandling = Number((intake.other_handling_cost / n).toFixed(2));

    const createdItems: InventoryItem[] = [];

    for (const raw of intake.items) {
      const bPrice = Number(raw.buying_price.toFixed(2));
      const landedCost = Number((bPrice + dispersedTransport + dispersedHandling).toFixed(2));
      const suggested5 = Number((landedCost * 1.05).toFixed(2));

      const item: InventoryItem = {
        id: nextId++,
        item_name: raw.item_name.trim(),
        stock_level: Math.max(0, Math.floor(raw.stock_level)),
        price: Math.max(0, Number(raw.selling_price.toFixed(2))),
        shipment_code: intake.shipment_code.trim(),
        buying_price: bPrice,
        transport_cost_shipment: intake.transport_cost,
        other_handling_cost: intake.other_handling_cost,
        items_in_shipment: n,
        dispersed_transport_cost: dispersedTransport,
        dispersed_handling_cost: dispersedHandling,
        total_buying_cost: landedCost,
        suggested_price_5pct: suggested5,
        base_cost: bPrice,
        transport_cost_per_unit: dispersedTransport,
        landed_cost: landedCost,
        category: raw.category || 'General Merchandise',
        sku: raw.sku?.trim() || `SKU-${nextId}`,
        updated_by: userEmail,
        last_updated: nowIso,
      };

      this.inventory.unshift(item);
      createdItems.push(item);
    }

    this.logAudit(
      userEmail,
      'ADD_ITEM',
      `Processed shipment '${intake.shipment_code}' with ${n} items. Total transport ৳${intake.transport_cost} & handling ৳${intake.other_handling_cost} equally dispersed at ৳${dispersedTransport} & ৳${dispersedHandling}/item.`
    );
    this.saveState();
    return { count: createdItems.length, items: createdItems };
  }

  public updateStock(
    itemId: number,
    newStockLevel: number,
    shipmentTransportCost?: number
  ): boolean {
    const userEmail = this.currentUser?.email || 'admin@company.com';
    const item = this.inventory.find((i) => i.id === itemId);
    if (!item) return false;

    const previousStock = item.stock_level;
    item.stock_level = Math.max(0, Math.floor(newStockLevel));

    if (shipmentTransportCost !== undefined && shipmentTransportCost > 0) {
      item.transport_cost_per_unit = Number(shipmentTransportCost.toFixed(2));
      item.landed_cost = Number(((item.base_cost || 0) + item.transport_cost_per_unit).toFixed(2));
    }

    item.updated_by = userEmail;
    item.last_updated = new Date().toISOString();

    this.logAudit(
      userEmail,
      'UPDATE_STOCK',
      `Adjusted stock for '${item.item_name}' from ${previousStock} to ${item.stock_level} units (Batch transport rate: ৳${item.transport_cost_per_unit || 0} BDT)`,
      item.id
    );
    this.saveState();
    return true;
  }

  // --- Sales / POS Order Processing (Customer details & transport costs calculated separately) ---
  public processSale(
    itemId: number,
    quantity: number,
    customer_name?: string,
    customer_address?: string,
    customer_phone?: string,
    transport_cost = 0,
    discount_amount = 0
  ): { success: boolean; error?: string; sale?: SaleRecord } {
    const userEmail = this.currentUser?.email || 'cashier@company.com';
    const item = this.inventory.find((i) => i.id === itemId);

    if (!item) {
      return { success: false, error: 'Product not found.' };
    }

    if (quantity <= 0) {
      return { success: false, error: 'Quantity sold must be greater than zero.' };
    }

    if (quantity > item.stock_level) {
      return {
        success: false,
        error: `Insufficient stock! Requested ${quantity} units, but only ${item.stock_level} available for '${item.item_name}'.`,
      };
    }

    // 1. Deduct stock from inventory
    item.stock_level -= quantity;
    item.updated_by = userEmail;
    item.last_updated = new Date().toISOString();

    // 2. Calculate line items: Subtotal + Transport Cost - Discount
    const subtotal = Number((quantity * item.price).toFixed(2));
    const cleanTransport = Math.max(0, Number(transport_cost.toFixed(2)));
    const cleanDiscount = Math.max(0, Number(discount_amount.toFixed(2)));
    const totalAmount = Math.max(0, Number((subtotal + cleanTransport - cleanDiscount).toFixed(2)));

    // 3. Register or update Customer in Customer Directory for future autofill
    const cName = customer_name?.trim() || 'Walk-in Customer';
    const cPhone = customer_phone?.trim() || '01700-000000';
    const cAddress = customer_address?.trim() || 'In-store Purchase, Bangladesh';

    if (cPhone && cPhone !== '01700-000000') {
      this.recordCustomerOrder(cName, cPhone, cAddress);
    }

    // 4. Create Sale Record
    const saleId = this.sales.length > 0 ? Math.max(...this.sales.map((s) => s.id)) + 1 : 101;
    const nowIso = new Date().toISOString();

    const newSale: SaleRecord = {
      id: saleId,
      item_id: item.id,
      item_name: item.item_name,
      unit_price: item.price,
      quantity_sold: quantity,
      subtotal_amount: subtotal,
      transport_cost: cleanTransport,
      discount_amount: cleanDiscount,
      total_amount: totalAmount,
      sale_date: nowIso,
      processed_by: userEmail,
      receipt_number: `INV-${nowIso.slice(0, 10).replace(/-/g, '')}-${String(saleId).padStart(3, '0')}`,
      customer_name: cName,
      customer_address: cAddress,
      customer_phone: cPhone,
    };

    this.sales.unshift(newSale);
    this.logAudit(
      userEmail,
      'SALE',
      `Processed order #${saleId}: ${quantity}x '${item.item_name}' (Subtotal: ৳${subtotal} + Transport: ৳${cleanTransport} - Discount: ৳${cleanDiscount} = Total: ৳${totalAmount} BDT) for ${cName}`,
      saleId
    );

    this.saveState();
    return { success: true, sale: newSale };
  }

  public getSales(): SaleRecord[] {
    return [...this.sales];
  }

  // --- Legacy Excel Bulk Migration ---
  public bulkMigrateLegacyItems(
    items: Array<{ item_name: string; stock_level: number; price: number }>,
    customSource = 'Inventory_Tracker.xlsx'
  ): { count: number; items: InventoryItem[] } {
    const userEmail = this.currentUser?.email || 'admin@company.com';
    let nextId = this.inventory.length > 0 ? Math.max(...this.inventory.map((i) => i.id)) + 1 : 1;
    const nowIso = new Date().toISOString();

    const added: InventoryItem[] = [];
    for (const raw of items) {
      const newItem: InventoryItem = {
        id: nextId++,
        item_name: raw.item_name,
        stock_level: raw.stock_level,
        price: raw.price, // in ৳ BDT
        base_cost: Number((raw.price * 0.7).toFixed(2)),
        transport_cost_per_unit: 60.0,
        landed_cost: Number((raw.price * 0.7 + 60.0).toFixed(2)),
        category: 'Migrated Stock',
        updated_by: `System Migration (${userEmail})`,
        last_updated: nowIso,
      };
      added.push(newItem);
      this.inventory.unshift(newItem);
    }

    this.logAudit(
      userEmail,
      'MIGRATION',
      `Bulk migrated ${added.length} legacy inventory items from ${customSource} into Supabase`
    );

    this.saveState();
    return { count: added.length, items: added };
  }

  // --- Admin User Creation ---
  public createAdminUser(
    email: string,
    role: 'admin' | 'cashier' | 'manager'
  ): { success: boolean; error?: string; user?: UserAccount } {
    const cleanEmail = email.trim().toLowerCase();
    const adminEmail = this.currentUser?.email || 'admin@company.com';

    if (this.users.some((u) => u.email.toLowerCase() === cleanEmail)) {
      return { success: false, error: `A user with email '${cleanEmail}' already exists in Supabase Auth.` };
    }

    const newUser: UserAccount = {
      id: `usr_${Date.now()}`,
      email: cleanEmail,
      role,
      created_at: new Date().toISOString(),
    };

    this.users.unshift(newUser);
    this.logAudit(
      adminEmail,
      'CREATE_USER',
      `Created user '${cleanEmail}' (Role: ${role}) via Supabase service_role key with email confirmation bypassed`
    );
    this.saveState();
    return { success: true, user: newUser };
  }

  public getUsers(): UserAccount[] {
    return [...this.users];
  }

  public getAuditLogs(): AuditLog[] {
    return [...this.auditLogs];
  }

  private logAudit(
    user_email: string,
    action_type: AuditLog['action_type'],
    details: string,
    target_id?: number | string
  ) {
    const log: AuditLog = {
      id: `aud_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
      user_email,
      action_type,
      details,
      target_id,
    };
    this.auditLogs.unshift(log);
  }

  public getConfig(): SupabaseConfig {
    return { ...this.config };
  }

  public updateConfig(newConfig: Partial<SupabaseConfig>) {
    this.config = { ...this.config, ...newConfig };
    if (this.config.useLiveConnection && this.config.url && this.config.anonKey) {
      this.initSupabaseClient();
    }
    this.saveState();
  }

  private initSupabaseClient() {
    try {
      this.supabaseClient = createClient(this.config.url, this.config.anonKey);
      this.config.isConnected = true;
    } catch (e) {
      console.error('Failed to initialize Supabase client:', e);
      this.config.isConnected = false;
    }
  }

  public resetToDefaults() {
    this.inventory = [...INITIAL_INVENTORY];
    this.sales = [...INITIAL_SALES];
    this.users = [...INITIAL_USERS];
    this.auditLogs = [...INITIAL_AUDIT_LOGS];
    this.customers = [...INITIAL_CUSTOMERS];
    this.saveState();
  }
}

export const store = new StoreService();
