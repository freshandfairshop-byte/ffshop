import React, { useState } from 'react';
import { SaleRecord } from '../types';
import {
  X,
  Printer,
  CheckCircle,
  FileText,
  FileSpreadsheet,
  FileDown,
  User,
  MapPin,
  Phone,
  Building,
  Receipt,
  Download,
  Truck,
} from 'lucide-react';
import { exportToPdf, exportToDoc } from '../utils/documentExporters';

interface ReceiptModalProps {
  sale: SaleRecord | null;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ sale, onClose }) => {
  const [printFormat, setPrintFormat] = useState<'thermal' | 'a4_invoice'>('a4_invoice');

  if (!sale) return null;

  const handleTriggerPrint = () => {
    window.print();
  };

  const handleDownloadPdf = () => {
    const headers = ['Receipt #', 'Item', 'Qty', 'Unit Price', 'Subtotal', 'Transport', 'Total Paid', 'Customer', 'Phone'];
    const rows = [
      [
        sale.receipt_number || `INV-${sale.id}`,
        sale.item_name,
        sale.quantity_sold,
        `৳${sale.unit_price.toLocaleString()}`,
        `৳${sale.subtotal_amount.toLocaleString()}`,
        `৳${sale.transport_cost.toLocaleString()}`,
        `৳${sale.total_amount.toLocaleString()}`,
        sale.customer_name || 'Walk-in',
        sale.customer_phone || 'N/A',
      ],
    ];
    exportToPdf(
      `Tax Invoice - ${sale.receipt_number || sale.id}`,
      headers,
      rows,
      `Invoice_${sale.receipt_number || sale.id}`,
      `Billed to: ${sale.customer_name} | Address: ${sale.customer_address} | Currency: ৳ BDT`
    );
  };

  const handleDownloadDoc = () => {
    const headers = ['Receipt #', 'Description', 'Quantity', 'Unit Price (BDT)', 'Transport Fee (BDT)', 'Grand Total (BDT)', 'Customer', 'Address', 'Phone'];
    const rows = [
      [
        sale.receipt_number || `INV-${sale.id}`,
        sale.item_name,
        sale.quantity_sold,
        `৳${sale.unit_price.toFixed(2)}`,
        `৳${sale.transport_cost.toFixed(2)}`,
        `৳${sale.total_amount.toFixed(2)}`,
        sale.customer_name || 'Walk-in',
        sale.customer_address || 'Store',
        sale.customer_phone || 'N/A',
      ],
    ];
    exportToDoc(
      `Commercial Invoice - ${sale.receipt_number || sale.id}`,
      headers,
      rows,
      `Invoice_${sale.receipt_number || sale.id}`,
      `Customer: ${sale.customer_name} (${sale.customer_phone}) | Currency: ৳ BDT`
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-150 overflow-y-auto">
      {/* Print-specific style tags so only the invoice is printed cleanly */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-invoice-container, #printable-invoice-container * {
            visibility: visible;
          }
          #printable-invoice-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 20px;
            background: white !important;
            color: black !important;
            box-shadow: none !important;
            border: none !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-auto">
        {/* Header bar (no-print) */}
        <div className="no-print flex items-center justify-between px-5 py-3.5 bg-slate-950 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Printer className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-semibold text-white">
              Invoice & Printing Station
            </span>
            <span className="text-xs text-slate-500">·</span>
            <span className="text-xs font-mono text-emerald-400">{sale.receipt_number || `#${sale.id}`}</span>
            <span className="text-[11px] bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded border border-emerald-800 font-mono">
              ৳ BDT
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Format toggle */}
            <div className="flex bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setPrintFormat('a4_invoice')}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  printFormat === 'a4_invoice'
                    ? 'bg-emerald-500 text-slate-950 font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                A4 Tax Invoice
              </button>
              <button
                type="button"
                onClick={() => setPrintFormat('thermal')}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  printFormat === 'thermal'
                    ? 'bg-emerald-500 text-slate-950 font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                POS Slip
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Paper Canvas */}
        <div className="p-4 sm:p-6 bg-slate-950/60 max-h-[75vh] overflow-y-auto">
          <div
            id="printable-invoice-container"
            className={`mx-auto bg-white text-slate-950 shadow-2xl transition-all ${
              printFormat === 'thermal'
                ? 'max-w-xs p-6 rounded-lg font-mono text-xs'
                : 'max-w-xl p-8 rounded-xl font-sans text-xs'
            }`}
          >
            {/* FORMAT: A4 COMMERCIAL INVOICE */}
            {printFormat === 'a4_invoice' ? (
              <div className="space-y-6">
                {/* Invoice Header */}
                <div className="flex justify-between items-start border-b border-slate-200 pb-5">
                  <div>
                    <h2 className="text-xl font-black text-slate-900 tracking-tight">
                      CLOUD INVENTORY & POS
                    </h2>
                    <p className="text-slate-500 text-xs mt-0.5">Commercial Sales & Logistics Terminal</p>
                    <p className="text-slate-500 text-[11px]">Dhaka, Bangladesh · Currency: ৳ BDT</p>
                    <p className="text-slate-500 text-[11px]">support@company.com · +880 1700-000000</p>
                  </div>
                  <div className="text-right">
                    <span className="inline-block px-2.5 py-1 bg-emerald-50 text-emerald-800 font-bold text-xs rounded border border-emerald-200 uppercase tracking-wider">
                      TAX INVOICE
                    </span>
                    <div className="mt-2 text-xs font-mono font-bold text-slate-900">
                      {sale.receipt_number || `INV-${sale.id}`}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Date: {new Date(sale.sale_date).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                {/* Customer Details Section (Name, Address, Phone) */}
                <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1">
                      <User className="w-3 h-3 text-emerald-600" />
                      <span>Billed & Shipped To:</span>
                    </div>
                    <div className="font-bold text-slate-900 text-sm">
                      {sale.customer_name || 'Walk-in Customer'}
                    </div>
                    <div className="text-slate-600 flex items-start gap-1 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span>{sale.customer_address || 'In-store Purchase Counter'}</span>
                    </div>
                    <div className="text-slate-600 flex items-center gap-1 mt-0.5 font-mono">
                      <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                      <span>{sale.customer_phone || '01700-000000'}</span>
                    </div>
                  </div>

                  <div className="border-l border-slate-200 pl-4 space-y-1 text-right">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Order Information:
                    </div>
                    <div className="text-slate-700">
                      <span className="text-slate-400">Cashier:</span> {sale.processed_by}
                    </div>
                    <div className="text-slate-700">
                      <span className="text-slate-400">Payment:</span> Supabase Verified
                    </div>
                    <div className="text-slate-700 font-mono text-[11px]">
                      <span className="text-slate-400">Time:</span> {new Date(sale.sale_date).toLocaleTimeString()}
                    </div>
                  </div>
                </div>

                {/* Line Items Table */}
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b-2 border-slate-300 bg-slate-100 text-slate-700 text-[11px]">
                      <th className="py-2.5 px-3 font-bold">ITEM DESCRIPTION</th>
                      <th className="py-2.5 px-3 font-bold text-center">QTY</th>
                      <th className="py-2.5 px-3 font-bold text-right">UNIT PRICE</th>
                      <th className="py-2.5 px-3 font-bold text-right">AMOUNT</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    <tr>
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900">{sale.item_name}</div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          Database Item #{sale.item_id} · Inventory Deduction Verified
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center font-mono font-bold text-slate-900">
                        {sale.quantity_sold}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-700">
                        ৳{sale.unit_price.toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                        ৳{sale.subtotal_amount.toLocaleString()}
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* Separate Shipment Transport Cost & Totals Section */}
                <div className="border-t border-slate-200 pt-3 flex justify-end">
                  <div className="w-72 space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>Item Subtotal:</span>
                      <span className="font-mono">৳{sale.subtotal_amount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-cyan-700 font-semibold">
                      <span>+ Separate Transport Fee:</span>
                      <span className="font-mono">+ ৳{sale.transport_cost.toLocaleString()}</span>
                    </div>
                    {sale.discount_amount > 0 && (
                      <div className="flex justify-between text-amber-600">
                        <span>- Discount Applied:</span>
                        <span className="font-mono">- ৳{sale.discount_amount.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-base text-slate-900 border-t border-slate-300 pt-2">
                      <span>Total Paid (BDT):</span>
                      <span className="font-mono text-emerald-700">৳{sale.total_amount.toLocaleString()} BDT</span>
                    </div>
                  </div>
                </div>

                {/* Footer notes & signature */}
                <div className="border-t border-slate-200 pt-4 flex justify-between items-end text-[10px] text-slate-500">
                  <div>
                    <p className="font-bold text-slate-700">Terms & Conditions:</p>
                    <p>All items synced and backed by Supabase cloud storage.</p>
                    <p>Separate shipment logistics fees tracked per delivery consignment.</p>
                  </div>
                  <div className="text-right">
                    <div className="w-36 border-b border-slate-400 mb-1"></div>
                    <span>Authorized Cashier Signature</span>
                  </div>
                </div>
              </div>
            ) : (
              /* FORMAT: THERMAL POS REGISTER RECEIPT SLIP */
              <div className="space-y-3 font-mono">
                <div className="text-center space-y-1 border-b border-dashed border-slate-300 pb-3">
                  <h3 className="font-bold text-sm tracking-wider uppercase font-sans">
                    CLOUD INVENTORY & POS
                  </h3>
                  <p className="text-[10px] text-slate-600">Terminal Register #01 (BDT)</p>
                  <p className="text-[10px] text-slate-500">{sale.receipt_number || `REC-${sale.id}`}</p>
                  <p className="text-[10px] text-slate-500">{new Date(sale.sale_date).toLocaleString()}</p>
                </div>

                {/* Customer Details on Slip */}
                <div className="py-2 border-b border-dashed border-slate-300 text-[11px] space-y-0.5">
                  <div className="font-bold text-slate-900">
                    CUSTOMER: {sale.customer_name || 'Walk-in Customer'}
                  </div>
                  <div className="text-slate-600 text-[10px]">
                    ADDR: {sale.customer_address || 'In-store'}
                  </div>
                  <div className="text-slate-600 text-[10px]">
                    TEL: {sale.customer_phone || 'N/A'}
                  </div>
                </div>

                {/* Items */}
                <div className="space-y-1.5 py-2 border-b border-dashed border-slate-300 text-xs">
                  <div className="flex justify-between font-bold">
                    <span>ITEM</span>
                    <span>TOTAL</span>
                  </div>
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-sans font-medium text-slate-900">{sale.item_name}</div>
                      <div className="text-[10px] text-slate-500">
                        {sale.quantity_sold} x ৳{sale.unit_price.toLocaleString()}
                      </div>
                    </div>
                    <div className="font-bold text-slate-900 font-mono">
                      ৳{sale.subtotal_amount.toLocaleString()}
                    </div>
                  </div>
                </div>

                <div className="space-y-1 text-right text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>SUBTOTAL:</span>
                    <span className="font-mono">৳{sale.subtotal_amount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-cyan-800">
                    <span>TRANSPORT FEE:</span>
                    <span className="font-mono">+ ৳{sale.transport_cost.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-bold text-slate-900 text-sm pt-1 border-t border-slate-200">
                    <span>TOTAL (BDT):</span>
                    <span className="font-mono">৳{sale.total_amount.toLocaleString()}</span>
                  </div>
                </div>

                <div className="pt-3 text-[10px] text-slate-500 text-center border-t border-dashed border-slate-300 space-y-1">
                  <div>Cashier: {sale.processed_by}</div>
                  <div className="tracking-widest text-[9px] text-slate-400 pt-1">
                    * * * THANK YOU FOR YOUR BUSINESS * * *
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions (no-print) */}
        <div className="no-print p-4 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPdf}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-rose-300 text-xs rounded-xl font-medium transition-colors flex items-center gap-1.5 cursor-pointer border border-slate-700"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>PDF Invoice</span>
            </button>
            <button
              onClick={handleDownloadDoc}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs rounded-xl font-medium transition-colors flex items-center gap-1.5 cursor-pointer border border-slate-700"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>Word Doc</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-xl cursor-pointer"
            >
              Close
            </button>
            <button
              onClick={handleTriggerPrint}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>Print Invoice / Receipt</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
