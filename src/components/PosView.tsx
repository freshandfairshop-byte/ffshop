import React, { useState, useEffect } from 'react';
import { InventoryItem, SaleRecord, CustomerProfile } from '../types';
import {
  ShoppingCart,
  CheckCircle,
  AlertCircle,
  Receipt,
  UserCheck,
  CreditCard,
  Printer,
  Sparkles,
  Search,
  FileSpreadsheet,
  FileText,
  FileDown,
  User,
  MapPin,
  Phone,
  Truck,
  Tag,
  Clock,
  ArrowRight,
  Info,
} from 'lucide-react';
import { exportToXlsx, exportToPdf, exportToDoc } from '../utils/documentExporters';
import { store } from '../services/storeService';

interface PosViewProps {
  inventory: InventoryItem[];
  sales: SaleRecord[];
  currentUserEmail: string;
  onProcessSale: (
    itemId: number,
    quantity: number,
    customerName?: string,
    customerAddress?: string,
    customerPhone?: string,
    transportCost?: number,
    discountAmount?: number
  ) => { success: boolean; error?: string; sale?: SaleRecord };
  onViewReceipt: (sale: SaleRecord) => void;
}

export const PosView: React.FC<PosViewProps> = ({
  inventory,
  sales,
  currentUserEmail,
  onProcessSale,
  onViewReceipt,
}) => {
  const [selectedItemId, setSelectedItemId] = useState<number>(
    inventory.length > 0 ? inventory[0].id : 0
  );
  const [quantity, setQuantity] = useState<number>(1);
  const [salesSearch, setSalesSearch] = useState<string>('');

  // Customer state
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>('');
  const [customerAddress, setCustomerAddress] = useState<string>('');
  const [showPhoneSuggestions, setShowPhoneSuggestions] = useState<boolean>(false);

  // Financial adjustments (Calculated separately)
  const [transportCost, setTransportCost] = useState<number>(120); // Delivery fee in ৳ BDT
  const [discountAmount, setDiscountAmount] = useState<number>(0); // Discount in ৳ BDT

  const [lastCompletedSale, setLastCompletedSale] = useState<SaleRecord | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );

  const selectedItem = inventory.find((i) => i.id === selectedItemId) || inventory[0];
  const knownCustomers = store.getCustomers();

  // Filtered customer suggestions based on typed phone number or name
  const filteredSuggestions = knownCustomers.filter((c) => {
    const cleanInput = customerPhone.replace(/[^0-9]/g, '');
    const cleanCustPhone = c.phone.replace(/[^0-9]/g, '');
    if (!cleanInput) return true;
    return cleanCustPhone.includes(cleanInput) || c.name.toLowerCase().includes(customerPhone.toLowerCase());
  }).slice(0, 4);

  // Autofill handler when user taps a suggested customer
  const handleSelectCustomer = (c: CustomerProfile) => {
    setCustomerPhone(c.phone);
    setCustomerName(c.name);
    setCustomerAddress(c.address);
    setShowPhoneSuggestions(false);
  };

  const handleSaleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;

    if (quantity <= 0) {
      setFeedback({ type: 'error', message: 'Quantity must be at least 1.' });
      return;
    }

    if (quantity > selectedItem.stock_level) {
      setFeedback({
        type: 'error',
        message: `Insufficient stock! Requested ${quantity} units, but only ${selectedItem.stock_level} available for "${selectedItem.item_name}".`,
      });
      return;
    }

    const result = onProcessSale(
      selectedItem.id,
      quantity,
      customerName || 'Walk-in Customer',
      customerAddress || 'In-store Purchase',
      customerPhone || '01700-000000',
      transportCost,
      discountAmount
    );

    if (result.success && result.sale) {
      setLastCompletedSale(result.sale);
      setFeedback({
        type: 'success',
        message: `Sale completed! Sold ${quantity}x "${selectedItem.item_name}" for ${customerName || 'Walk-in Customer'} (Total: ৳${result.sale.total_amount.toLocaleString()} BDT).`,
      });
      setQuantity(1);
    } else {
      setFeedback({
        type: 'error',
        message: result.error || 'Failed to complete transaction.',
      });
    }
  };

  const unitPrice = selectedItem?.price || 0;
  const currentStock = selectedItem?.stock_level || 0;
  const subtotal = quantity * unitPrice;
  const grandTotal = Math.max(0, subtotal + transportCost - discountAmount);
  const isOutOfStock = currentStock <= 0;

  // Filtered sales
  const filteredSales = sales.filter((s) => {
    const q = salesSearch.toLowerCase().trim();
    if (!q) return true;
    return (
      s.item_name.toLowerCase().includes(q) ||
      s.processed_by.toLowerCase().includes(q) ||
      (s.customer_name && s.customer_name.toLowerCase().includes(q)) ||
      (s.customer_phone && s.customer_phone.includes(q)) ||
      (s.receipt_number && s.receipt_number.toLowerCase().includes(q)) ||
      String(s.id).includes(q)
    );
  });

  const handleExportSalesXlsx = () => {
    const data = filteredSales.map((s) => ({
      'Sale ID': s.id,
      'Receipt #': s.receipt_number || `INV-${s.id}`,
      'Item Description': s.item_name,
      'Unit Price (৳ BDT)': s.unit_price,
      'Quantity Sold': s.quantity_sold,
      'Subtotal (৳ BDT)': s.subtotal_amount,
      'Transport / Shipping (৳ BDT)': s.transport_cost,
      'Discount (৳ BDT)': s.discount_amount,
      'Total Paid (৳ BDT)': s.total_amount,
      'Customer Name': s.customer_name,
      'Customer Phone': s.customer_phone,
      'Customer Address': s.customer_address,
      'Sale Date': new Date(s.sale_date).toLocaleString(),
      'Cashier': s.processed_by,
    }));
    exportToXlsx(data, `Sales_Ledger_${new Date().toISOString().slice(0, 10)}`);
  };

  const handleExportSalesPdf = () => {
    const headers = ['Receipt #', 'Item', 'Qty', 'Subtotal', 'Transport', 'Total (৳ BDT)', 'Customer', 'Phone'];
    const rows = filteredSales.map((s) => [
      s.receipt_number || `#${s.id}`,
      s.item_name,
      s.quantity_sold,
      `৳${s.subtotal_amount.toLocaleString()}`,
      `৳${s.transport_cost.toLocaleString()}`,
      `৳${s.total_amount.toLocaleString()}`,
      s.customer_name,
      s.customer_phone,
    ]);
    exportToPdf(
      'Sales Transactions & Customer Ledger (BDT)',
      headers,
      rows,
      `Sales_Ledger_${new Date().toISOString().slice(0, 10)}`,
      `Currency: Bangladeshi Taka (৳ BDT) | Total Orders: ${filteredSales.length}`
    );
  };

  const handleExportSalesDoc = () => {
    const headers = ['Receipt #', 'Item Description', 'Qty', 'Unit Price', 'Transport', 'Grand Total', 'Customer', 'Phone', 'Address'];
    const rows = filteredSales.map((s) => [
      s.receipt_number || `INV-${s.id}`,
      s.item_name,
      s.quantity_sold,
      `৳${s.unit_price.toFixed(2)}`,
      `৳${s.transport_cost.toFixed(2)}`,
      `৳${s.total_amount.toFixed(2)}`,
      s.customer_name,
      s.customer_phone,
      s.customer_address,
    ]);
    exportToDoc(
      'Sales Ledger with Customer Details (BDT)',
      headers,
      rows,
      `Sales_Ledger_${new Date().toISOString().slice(0, 10)}`,
      `Currency: Bangladeshi Taka (৳ BDT)`
    );
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
          <span>🛒</span>
          <span>Point of Sale & Invoicing</span>
          <span className="text-xs font-mono bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded border border-emerald-800">
            Currency: ৳ BDT
          </span>
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Customer information is stored exclusively in this sales terminal. Type or tap a phone number to auto-fill previous customer records.
        </p>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-xl border flex items-start gap-3 transition-all ${
            feedback.type === 'success'
              ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-200'
              : 'bg-red-950/40 border-red-800/60 text-red-200'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          )}
          <div className="flex-1 text-xs">
            <span className="font-semibold block mb-0.5">
              {feedback.type === 'success' ? 'Transaction Confirmed' : 'Transaction Blocked'}
            </span>
            <span>{feedback.message}</span>
            {feedback.type === 'success' && lastCompletedSale && (
              <div className="mt-2.5 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => onViewReceipt(lastCompletedSale)}
                  className="px-3.5 py-1.5 bg-emerald-500 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1.5 cursor-pointer hover:bg-emerald-400 transition-colors shadow-sm"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Tax Invoice #{lastCompletedSale.receipt_number} (৳{lastCompletedSale.total_amount.toLocaleString()} BDT)</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Clarification banner on Multiple Shipments & Transport Costs */}
      <div className="p-3.5 bg-slate-900/90 border border-slate-800 rounded-xl text-xs text-slate-300 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <span className="font-semibold text-white">How Multiple Shipments & Transport Costs Are Calculated:</span>
          <p className="text-slate-400 mt-0.5">
            <b>Yes, they are calculated separately!</b> Customer transport / courier charges are added as a separate line item per order (<span className="text-emerald-400 font-mono">৳ BDT</span>). Simultaneously, inbound stock shipments retain their own base supplier cost and freight fee per unit, allowing distinct landed cost accounting across different replenishment batches.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: POS Form */}
        <div className="lg:col-span-6 bg-slate-900/90 border border-slate-800 rounded-xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-400" />
              <span>Checkout Register</span>
            </h2>
            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
              <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span className="truncate max-w-[150px]">{currentUserEmail}</span>
            </div>
          </div>

          <form onSubmit={handleSaleSubmit} className="space-y-4">
            {/* Item Dropdown */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Select Item to Sell
              </label>
              <select
                value={selectedItemId}
                onChange={(e) => {
                  setSelectedItemId(Number(e.target.value));
                  setFeedback(null);
                }}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 cursor-pointer"
              >
                {inventory.map((item) => (
                  <option key={item.id} value={item.id} className="bg-slate-900">
                    {item.item_name} — ৳{item.price.toLocaleString()} BDT ({item.stock_level} in stock)
                  </option>
                ))}
              </select>
            </div>

            {/* Selected Item Detail */}
            {selectedItem && (
              <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl grid grid-cols-3 gap-2 text-center text-xs">
                <div>
                  <span className="text-slate-500 block text-[10px]">Current Stock</span>
                  <span
                    className={`font-mono font-bold text-sm ${
                      currentStock < 10 ? 'text-amber-400' : 'text-emerald-400'
                    }`}
                  >
                    {currentStock} units
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Unit Price (BDT)</span>
                  <span className="font-mono font-bold text-sm text-white">
                    ৳{unitPrice.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">SKU Code</span>
                  <span className="font-mono text-slate-300 text-xs">{selectedItem.sku || `#${selectedItem.id}`}</span>
                </div>
              </div>
            )}

            {/* Quantity Input */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-slate-300">
                  Quantity Sold
                </label>
                <span className="text-[11px] text-slate-500">
                  Available in Stock: {currentStock} units
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={quantity <= 1}
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-slate-800 text-white font-bold flex items-center justify-center text-base cursor-pointer"
                >
                  -
                </button>
                <input
                  type="number"
                  min="1"
                  max={Math.max(1, currentStock)}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="flex-1 px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-center text-base font-mono font-bold text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
                <button
                  type="button"
                  disabled={quantity >= currentStock}
                  onClick={() => setQuantity(Math.min(currentStock, quantity + 1))}
                  className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-slate-800 text-white font-bold flex items-center justify-center text-base cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>

            {/* CUSTOMER PHONE & AUTOFILL SECTION */}
            <div className="p-4 bg-slate-950/90 border border-slate-800 rounded-xl space-y-3 relative">
              <div className="flex items-center justify-between text-xs border-b border-slate-800 pb-2">
                <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Customer Information (Sales Terminal Only)</span>
                </span>
                <span className="text-[10px] text-emerald-400 font-mono">Auto-fills on Phone Tap</span>
              </div>

              {/* Quick Select Dropdown */}
              {knownCustomers.length > 0 && (
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">
                    Select Previous Customer (Instant Auto-Fill)
                  </label>
                  <select
                    onChange={(e) => {
                      const cust = knownCustomers.find((c) => c.phone === e.target.value);
                      if (cust) handleSelectCustomer(cust);
                    }}
                    defaultValue=""
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                  >
                    <option value="">-- Choose Existing Customer or Type Below --</option>
                    {knownCustomers.map((c) => (
                      <option key={c.id} value={c.phone}>
                        {c.phone} — {c.name} ({c.address})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Phone Input with Suggestion Trigger */}
              <div className="relative">
                <label className="block text-[11px] font-medium text-slate-400 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Phone className="w-3 h-3 text-slate-500" />
                    <span>Customer Phone Number</span>
                  </span>
                  <span className="text-[10px] text-slate-500">Tap below to auto-fill</span>
                </label>
                <input
                  type="text"
                  value={customerPhone}
                  onFocus={() => setShowPhoneSuggestions(true)}
                  onChange={(e) => {
                    setCustomerPhone(e.target.value);
                    setShowPhoneSuggestions(true);
                  }}
                  placeholder="e.g. 01712-345678"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                />

                {/* Quick Suggestion Chips: Known previous customers */}
                {knownCustomers.length > 0 && (
                  <div className="mt-2 space-y-1">
                    <div className="text-[10px] text-slate-500 flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" />
                      <span>Previous Customer Quick-Fill (Tap to auto-fill):</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {filteredSuggestions.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => handleSelectCustomer(c)}
                          className="px-2 py-1 bg-slate-900 hover:bg-emerald-950/60 hover:border-emerald-700/60 border border-slate-800 rounded-md text-[11px] text-slate-300 hover:text-emerald-300 transition-colors cursor-pointer text-left flex items-center gap-1.5"
                        >
                          <span className="font-semibold text-white">{c.name}</span>
                          <span className="font-mono text-[10px] text-emerald-400">({c.phone})</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Customer Name */}
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Customer / Business Name
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Tanvir Ahmed or Walk-in Customer"
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {/* Customer Address */}
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-slate-500" />
                  <span>Delivery Address</span>
                </label>
                <input
                  type="text"
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  placeholder="e.g. House 42, Banani, Dhaka"
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* TRANSPORTATION / SHIPPING & DISCOUNT (CALCULATED SEPARATELY) */}
            <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-3">
              <div className="flex items-center justify-between text-xs border-b border-slate-800 pb-2">
                <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Shipment & Transport Cost (Calculated Separately)</span>
                </span>
                <span className="text-[10px] text-cyan-400 font-mono">BDT (৳)</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1 flex items-center justify-between">
                    <span>Delivery / Transport Fee (৳)</span>
                    <span className="text-[10px] text-slate-500">RedX / Steadfast / Local</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="10"
                    value={transportCost}
                    onChange={(e) => setTransportCost(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono text-cyan-300 focus:outline-none focus:ring-1 focus:ring-cyan-500 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1 flex items-center justify-between">
                    <span>Discount / Promo (৳)</span>
                    <span className="text-[10px] text-slate-500">Optional</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="10"
                    value={discountAmount}
                    onChange={(e) => setDiscountAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono text-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>
            </div>

            {/* Price Calculations */}
            <div className="pt-2 border-t border-slate-800 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Items Subtotal ({quantity} × ৳{unitPrice.toLocaleString()})</span>
                <span className="font-mono text-slate-300">৳{subtotal.toLocaleString()} BDT</span>
              </div>
              <div className="flex justify-between text-cyan-400">
                <span>+ Transport / Delivery Charge</span>
                <span className="font-mono">৳{transportCost.toLocaleString()} BDT</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-amber-400">
                  <span>- Discount Applied</span>
                  <span className="font-mono">-৳{discountAmount.toLocaleString()} BDT</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold text-white pt-2 border-t border-slate-800/60">
                <span>Total Amount Due (BDT)</span>
                <span className="font-mono text-emerald-400 text-base">
                  ৳{grandTotal.toLocaleString()} BDT
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <button
              type="submit"
              disabled={isOutOfStock}
              className={`w-full py-3 px-4 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
                isOutOfStock
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20 active:scale-[0.99]'
              }`}
            >
              <ShoppingCart className="w-4 h-4" />
              <span>
                {isOutOfStock ? 'Item Out of Stock' : `Complete Sale (৳${grandTotal.toLocaleString()} BDT)`}
              </span>
            </button>
          </form>
        </div>

        {/* Right Column: Recent Sales with Customer Data, Transport Fee & Print Action */}
        <div className="lg:col-span-6 bg-slate-900/90 border border-slate-800 rounded-xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 flex-wrap gap-2">
            <div>
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <Receipt className="w-4 h-4 text-emerald-400" />
                <span>Sales Ledger & Print Center (BDT)</span>
              </h2>
              <span className="text-[11px] text-slate-500">Live query with customer details and transport charges</span>
            </div>

            {/* Export Buttons */}
            <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-lg p-1">
              <button
                onClick={handleExportSalesXlsx}
                title="Export sales to Excel (.xlsx)"
                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded text-[11px] font-mono flex items-center gap-1 cursor-pointer"
              >
                <FileSpreadsheet className="w-3 h-3" />
                <span>.xlsx</span>
              </button>
              <button
                onClick={handleExportSalesPdf}
                title="Export sales to PDF (.pdf)"
                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-rose-400 rounded text-[11px] font-mono flex items-center gap-1 cursor-pointer"
              >
                <FileText className="w-3 h-3" />
                <span>.pdf</span>
              </button>
              <button
                onClick={handleExportSalesDoc}
                title="Export sales to Word (.doc)"
                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-400 rounded text-[11px] font-mono flex items-center gap-1 cursor-pointer"
              >
                <FileDown className="w-3 h-3" />
                <span>.doc</span>
              </button>
            </div>
          </div>

          {/* Search Sales Bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={salesSearch}
              onChange={(e) => setSalesSearch(e.target.value)}
              placeholder="Search by customer name, phone number, item, or invoice ID..."
              className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div className="space-y-2.5 max-h-[480px] overflow-y-auto pr-1">
            {filteredSales.length === 0 ? (
              <div className="text-center py-10 text-slate-500 text-xs">
                {salesSearch ? `No sales matching "${salesSearch}".` : 'No transactions recorded yet today.'}
              </div>
            ) : (
              filteredSales.map((sale) => (
                <div
                  key={sale.id}
                  className="p-3 bg-slate-950 border border-slate-800/80 rounded-xl hover:border-slate-700 transition-all flex items-center justify-between gap-3 group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-200 truncate group-hover:text-emerald-400 transition-colors">
                        {sale.item_name}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {sale.receipt_number || `#${sale.id}`}
                      </span>
                    </div>

                    {/* Customer Information display */}
                    <div className="text-[11px] text-emerald-400 font-medium mt-0.5 flex items-center gap-1.5">
                      <User className="w-3 h-3 text-emerald-400 shrink-0" />
                      <span className="truncate">{sale.customer_name}</span>
                      <span className="text-slate-600">·</span>
                      <span className="text-slate-400 font-mono text-[10px]">{sale.customer_phone}</span>
                    </div>

                    <div className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-2 truncate">
                      <span>{sale.quantity_sold}x @ ৳{sale.unit_price.toLocaleString()}</span>
                      <span>·</span>
                      <span className="text-cyan-400">Transport: ৳{sale.transport_cost}</span>
                      <span>·</span>
                      <span className="truncate">{sale.customer_address}</span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="font-mono font-bold text-sm text-emerald-400">
                      ৳{sale.total_amount.toLocaleString()} BDT
                    </div>
                    {/* Direct Print Button */}
                    <button
                      type="button"
                      onClick={() => onViewReceipt(sale)}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-emerald-500 hover:text-slate-950 text-slate-300 rounded text-[11px] font-medium transition-colors mt-1 cursor-pointer flex items-center gap-1 justify-end ml-auto"
                      title="Open printable tax invoice"
                    >
                      <Printer className="w-3 h-3" />
                      <span>Print</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
