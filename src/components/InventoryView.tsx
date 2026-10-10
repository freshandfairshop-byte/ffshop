import React, { useState } from 'react';
import { InventoryItem, ShipmentBatchIntake } from '../types';
import {
  Truck,
  PlusCircle,
  RefreshCw,
  FileSpreadsheet,
  Download,
  Upload,
  CheckCircle,
  Sparkles,
  Info,
  DollarSign,
  Tag,
  Boxes,
  Trash2,
  PackagePlus,
  HelpCircle,
  ArrowRight,
  TrendingUp,
  Search,
} from 'lucide-react';
import { downloadSampleExcelFile, parseExcelFile } from '../utils/excelGenerator';
import { LEGACY_EXCEL_TEMPLATE_DATA } from '../data/initialData';

interface InventoryViewProps {
  inventory: InventoryItem[];
  currentUserEmail: string;
  onAddItem: (
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
  ) => void;
  onAddShipmentBatch?: (intake: ShipmentBatchIntake) => { count: number; items: InventoryItem[] };
  onUpdateStock: (itemId: number, newStockLevel: number, newPrice?: number) => boolean;
  onBulkMigrate: (
    items: Array<{ item_name: string; stock_level: number; price: number }>,
    sourceName?: string
  ) => { count: number };
}

interface DraftShipmentItem {
  id: string;
  item_name: string;
  category: string;
  sku: string;
  stock_level: number;
  buying_price: number;
  selling_price: number;
  manuallyEditedPrice: boolean;
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  inventory,
  currentUserEmail,
  onAddItem,
  onAddShipmentBatch,
  onUpdateStock,
  onBulkMigrate,
}) => {
  const [activeTab, setActiveTab] = useState<'batch_shipment' | 'single_add' | 'catalog' | 'update' | 'migration'>('batch_shipment');

  // Multi-Item Shipment State
  const [shipmentCode, setShipmentCode] = useState<string>(() => `SHP-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`);
  const [shipmentTransportCost, setShipmentTransportCost] = useState<number>(1200); // ৳ BDT
  const [shipmentHandlingCost, setShipmentHandlingCost] = useState<number>(300); // ৳ BDT
  const [batchFeedback, setBatchFeedback] = useState<string | null>(null);

  const [shipmentItems, setShipmentItems] = useState<DraftShipmentItem[]>([
    {
      id: 'item-1',
      item_name: 'Colombian Supremo Coffee Beans (1kg)',
      category: 'Coffee Beans',
      sku: 'CB-COL-101',
      stock_level: 30,
      buying_price: 2200,
      selling_price: 2835,
      manuallyEditedPrice: false,
    },
    {
      id: 'item-2',
      item_name: 'Ethiopian Yirgacheffe Beans (500g)',
      category: 'Coffee Beans',
      sku: 'CB-ETH-102',
      stock_level: 20,
      buying_price: 1400,
      selling_price: 1995,
      manuallyEditedPrice: false,
    },
    {
      id: 'item-3',
      item_name: 'Barista Milk Steaming Pitcher (600ml)',
      category: 'Brewing Gear',
      sku: 'BG-PIT-103',
      stock_level: 15,
      buying_price: 950,
      selling_price: 1522.5,
      manuallyEditedPrice: false,
    },
  ]);

  // Single Add Form States
  const [singleName, setSingleName] = useState('');
  const [singleStock, setSingleStock] = useState<number>(25);
  const [singleCategory, setSingleCategory] = useState('Coffee Beans');
  const [singleSku, setSingleSku] = useState('');
  const [singleShipmentCode, setSingleShipmentCode] = useState<string>(() => `SHP-${new Date().getFullYear()}-099`);
  const [singleShipmentTransport, setSingleShipmentTransport] = useState<number>(600); // Total transport
  const [singleShipmentHandling, setSingleShipmentHandling] = useState<number>(150); // Total handling
  const [singleItemsInShipment, setSingleItemsInShipment] = useState<number>(2); // items sharing shipment
  const [singleBuyingPrice, setSingleBuyingPrice] = useState<number>(2000); // ৳ BDT buying price
  const [singleSellingPrice, setSingleSellingPrice] = useState<number>(2493.75); // manual or suggested
  const [singleFeedback, setSingleFeedback] = useState<string | null>(null);

  // Form states for Update Stock
  const [selectedUpdateItemId, setSelectedUpdateItemId] = useState<number>(
    inventory.length > 0 ? inventory[0].id : 0
  );
  const [newStockLevel, setNewStockLevel] = useState<number>(
    inventory.length > 0 ? inventory[0].stock_level : 0
  );
  const [newPrice, setNewPrice] = useState<number>(
    inventory.length > 0 ? inventory[0].price : 0
  );
  const [updateFeedback, setUpdateFeedback] = useState<string | null>(null);

  // Catalog search
  const [catalogSearch, setCatalogSearch] = useState('');

  // Migration states
  const [stagedExcelData, setStagedExcelData] = useState<
    Array<{ item_name: string; stock_level: number; price: number }> | null
  >(null);
  const [uploadedFileName, setUploadedFileName] = useState<string>('Inventory_Tracker.xlsx');
  const [migrationFeedback, setMigrationFeedback] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Selected item for update
  const selectedUpdateItem =
    inventory.find((i) => i.id === selectedUpdateItemId) || inventory[0];

  // Equal dispersion calculations for Batch Shipment
  const itemsCountInBatch = Math.max(1, shipmentItems.length);
  const batchDispersedTransportPerItem = Number((shipmentTransportCost / itemsCountInBatch).toFixed(2));
  const batchDispersedHandlingPerItem = Number((shipmentHandlingCost / itemsCountInBatch).toFixed(2));

  // Handler to add another item row into shipment batch
  const handleAddShipmentRow = () => {
    const nextNum = shipmentItems.length + 1;
    const newItem: DraftShipmentItem = {
      id: `item-${Date.now()}-${nextNum}`,
      item_name: '',
      category: 'General Merchandise',
      sku: '',
      stock_level: 20,
      buying_price: 1000,
      selling_price: 1050,
      manuallyEditedPrice: false,
    };
    const updatedList = [...shipmentItems, newItem];
    setShipmentItems(updatedList);
  };

  const handleRemoveShipmentRow = (id: string) => {
    if (shipmentItems.length <= 1) return;
    setShipmentItems(shipmentItems.filter((it) => it.id !== id));
  };

  const handleUpdateItemField = (
    id: string,
    field: keyof DraftShipmentItem,
    value: string | number | boolean
  ) => {
    setShipmentItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const updated = { ...item, [field]: value };

        // If buying price changed and selling price was not manually modified, update suggested price
        if (field === 'buying_price' && !item.manuallyEditedPrice) {
          const effectiveBuying = (Number(value) || 0) + batchDispersedTransportPerItem + batchDispersedHandlingPerItem;
          updated.selling_price = Number((effectiveBuying * 1.05).toFixed(2));
        }

        if (field === 'selling_price') {
          updated.manuallyEditedPrice = true;
        }

        return updated;
      })
    );
  };

  // Suggest 5% profit tab click for specific item in batch
  const handleApply5PercentProfitToItem = (id: string) => {
    setShipmentItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const effectiveBuying = item.buying_price + batchDispersedTransportPerItem + batchDispersedHandlingPerItem;
        const suggested = Number((effectiveBuying * 1.05).toFixed(2));
        return {
          ...item,
          selling_price: suggested,
          manuallyEditedPrice: false,
        };
      })
    );
  };

  // Apply 5% profit to ALL items in shipment batch at once
  const handleApply5PercentProfitToAll = () => {
    setShipmentItems((prev) =>
      prev.map((item) => {
        const effectiveBuying = item.buying_price + batchDispersedTransportPerItem + batchDispersedHandlingPerItem;
        const suggested = Number((effectiveBuying * 1.05).toFixed(2));
        return {
          ...item,
          selling_price: suggested,
          manuallyEditedPrice: false,
        };
      })
    );
  };

  // Submit Multi-Item Shipment
  const handleSubmitBatchShipment = (e: React.FormEvent) => {
    e.preventDefault();
    if (shipmentItems.length === 0) {
      setBatchFeedback('Please add at least one item to this shipment.');
      return;
    }

    const invalid = shipmentItems.some((it) => !it.item_name.trim());
    if (invalid) {
      setBatchFeedback('All items in the shipment must have a product title.');
      return;
    }

    if (onAddShipmentBatch) {
      const intake: ShipmentBatchIntake = {
        shipment_code: shipmentCode.trim() || `SHP-${new Date().getFullYear()}-01`,
        transport_cost: Math.max(0, shipmentTransportCost),
        other_handling_cost: Math.max(0, shipmentHandlingCost),
        items: shipmentItems.map((it) => ({
          item_name: it.item_name.trim(),
          category: it.category,
          sku: it.sku.trim(),
          stock_level: it.stock_level,
          buying_price: it.buying_price,
          selling_price: it.selling_price,
        })),
      };
      const res = onAddShipmentBatch(intake);
      setBatchFeedback(
        `✅ Shipment "${shipmentCode}" received successfully! Committed ${res.count} items into catalog. Transport cost (৳${shipmentTransportCost.toLocaleString()} BDT) equally dispersed at ৳${batchDispersedTransportPerItem.toLocaleString()} BDT per item.`
      );
    } else {
      // Fallback to sequential onAddItem
      shipmentItems.forEach((it) => {
        onAddItem(
          it.item_name.trim(),
          it.stock_level,
          it.selling_price,
          it.category,
          it.sku.trim() || undefined,
          shipmentCode.trim(),
          it.buying_price,
          shipmentTransportCost,
          shipmentHandlingCost,
          shipmentItems.length
        );
      });
      setBatchFeedback(
        `✅ Shipment "${shipmentCode}" processed with ${shipmentItems.length} items. Dispersed transport: ৳${batchDispersedTransportPerItem.toLocaleString()} BDT/item.`
      );
    }

    // Refresh shipment code for next intake
    setShipmentCode(`SHP-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`);
  };

  // Single Add Calculations
  const singleDispersedTransport = Number((singleShipmentTransport / Math.max(1, singleItemsInShipment)).toFixed(2));
  const singleDispersedHandling = Number((singleShipmentHandling / Math.max(1, singleItemsInShipment)).toFixed(2));
  const singleTotalBuyingCost = Number((singleBuyingPrice + singleDispersedTransport + singleDispersedHandling).toFixed(2));
  const singleSuggested5Pct = Number((singleTotalBuyingCost * 1.05).toFixed(2));

  const handleApplySingle5Pct = () => {
    setSingleSellingPrice(singleSuggested5Pct);
  };

  const handleSingleAddItemSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!singleName.trim()) {
      setSingleFeedback('Item name cannot be empty.');
      return;
    }

    onAddItem(
      singleName.trim(),
      singleStock,
      singleSellingPrice,
      singleCategory,
      singleSku.trim() || undefined,
      singleShipmentCode.trim() || undefined,
      singleBuyingPrice,
      singleShipmentTransport,
      singleShipmentHandling,
      singleItemsInShipment
    );

    setSingleFeedback(
      `Product "${singleName}" added (Shipment: ${singleShipmentCode}, Landed Buying Cost: ৳${singleTotalBuyingCost.toLocaleString()} BDT, Selling Price: ৳${singleSellingPrice.toLocaleString()} BDT).`
    );
    setSingleName('');
    setSingleSku('');
    setSingleStock(20);
    setSingleBuyingPrice(1500);
    setSingleShipmentCode(`SHP-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`);
  };

  const handleUpdateStockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUpdateItem) return;
    const ok = onUpdateStock(selectedUpdateItem.id, newStockLevel, newPrice);
    if (ok) {
      setUpdateFeedback(
        `Updated "${selectedUpdateItem.item_name}" stock to ${newStockLevel} units at ৳${newPrice.toLocaleString()} BDT (Operator: ${currentUserEmail}).`
      );
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFileName(file.name);
    setIsProcessing(true);
    setMigrationFeedback(null);

    try {
      const parsed = await parseExcelFile(file);
      if (parsed.length === 0) {
        setMigrationFeedback('No valid rows found in file. Ensure headers: item_name, stock_level, price.');
        setIsProcessing(false);
        return;
      }
      setStagedExcelData(parsed);
      setMigrationFeedback(`Loaded ${parsed.length} items from "${file.name}". Ready to bulk migrate into Supabase!`);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setMigrationFeedback(`Error reading Excel file: ${errorMsg}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRunMigration = () => {
    const dataToMigrate = stagedExcelData || LEGACY_EXCEL_TEMPLATE_DATA;
    const res = onBulkMigrate(dataToMigrate, uploadedFileName);
    setMigrationFeedback(
      `✅ Migration complete! Inserted ${res.count} records into Supabase inventory with updated_by="System Migration".`
    );
    setStagedExcelData(null);
  };

  // Filtered catalog
  const filteredCatalog = inventory.filter((item) => {
    const q = catalogSearch.toLowerCase().trim();
    if (!q) return true;
    return (
      item.item_name.toLowerCase().includes(q) ||
      (item.sku && item.sku.toLowerCase().includes(q)) ||
      (item.shipment_code && item.shipment_code.toLowerCase().includes(q)) ||
      (item.category && item.category.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Page Title & Currency Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <span className="text-2xl">📦</span>
            <span>Inventory Management</span>
            <span className="text-xs font-mono bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded border border-emerald-800">
              Currency: ৳ BDT
            </span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Shipment intake, transport equal dispersion, landed buying cost & 5% profit selling price engine.
          </p>
        </div>
      </div>

      {/* Rules Notice */}
      <div className="p-3.5 bg-slate-900/90 border border-slate-800 rounded-xl text-xs text-slate-300 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
        <div className="leading-relaxed space-y-1">
          <p>
            <b>Shipment Cost Dispersion & 5% Profit Rule:</b> When receiving a shipment with multiple items, the total shipment transport cost (and other handling cost) is <b>equally dispersed across all items</b> into each item’s landed buying cost.
          </p>
          <p className="text-slate-400">
            Suggested selling price is provided via the <b>Suggestion Tab (+5% Profit)</b>: <code className="font-mono text-emerald-400">Total Landed Buying Cost × 1.05</code>. Selling price can also be freely inserted manually.
          </p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-slate-800">
        <div className="flex gap-2 -mb-px overflow-x-auto pb-1">
          <button
            onClick={() => setActiveTab('batch_shipment')}
            className={`pb-3 px-4 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
              activeTab === 'batch_shipment'
                ? 'border-emerald-400 text-emerald-400 bg-emerald-950/20 rounded-t-lg'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Truck className="w-4 h-4" />
            <span>Receive Shipment (Multi-Item Intake)</span>
            <span className="text-[10px] bg-emerald-900/80 text-emerald-300 px-1.5 py-0.2 rounded font-mono">
              Equal Dispersion
            </span>
          </button>

          <button
            onClick={() => setActiveTab('single_add')}
            className={`pb-3 px-4 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
              activeTab === 'single_add'
                ? 'border-emerald-400 text-emerald-400 bg-emerald-950/20 rounded-t-lg'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            <span>Quick Add Single Product</span>
          </button>

          <button
            onClick={() => setActiveTab('catalog')}
            className={`pb-3 px-4 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
              activeTab === 'catalog'
                ? 'border-emerald-400 text-emerald-400 bg-emerald-950/20 rounded-t-lg'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Boxes className="w-4 h-4" />
            <span>Shipment & Landed Cost Catalog</span>
            <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.2 rounded font-mono">
              {inventory.length}
            </span>
          </button>

          <button
            onClick={() => {
              setActiveTab('update');
              if (selectedUpdateItem) {
                setNewStockLevel(selectedUpdateItem.stock_level);
                setNewPrice(selectedUpdateItem.price);
              }
            }}
            className={`pb-3 px-4 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
              activeTab === 'update'
                ? 'border-emerald-400 text-emerald-400 bg-emerald-950/20 rounded-t-lg'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <RefreshCw className="w-4 h-4" />
            <span>Update Stock & Price</span>
          </button>

          <button
            onClick={() => setActiveTab('migration')}
            className={`pb-3 px-4 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
              activeTab === 'migration'
                ? 'border-emerald-400 text-emerald-400 bg-emerald-950/20 rounded-t-lg'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Excel Migration</span>
            <span className="text-[10px] bg-slate-800 px-1.5 py-0.2 rounded text-emerald-400 font-mono">
              .xlsx
            </span>
          </button>
        </div>
      </div>

      {/* TAB 1: MULTI-ITEM SHIPMENT INTAKE (WITH EQUAL TRANSPORT DISPERSION & 5% PROFIT TAB) */}
      {activeTab === 'batch_shipment' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Truck className="w-5 h-5 text-emerald-400" />
                <span>Multi-Item Shipment Intake & Cost Dispersion</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Receive shipments with multiple items. Total transport & handling costs are equally dispersed across items into their buying cost.
              </p>
            </div>
            <button
              type="button"
              onClick={handleApply5PercentProfitToAll}
              className="px-3.5 py-1.5 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700/60 text-emerald-300 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
              title="Click to apply 5% profit suggestion to all items in this shipment"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>Apply 5% Profit Suggestion to All Items</span>
            </button>
          </div>

          {batchFeedback && (
            <div className="p-3.5 bg-emerald-950/60 border border-emerald-800/80 rounded-xl text-xs text-emerald-200 flex items-center gap-2.5">
              <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{batchFeedback}</span>
            </div>
          )}

          <form onSubmit={handleSubmitBatchShipment} className="space-y-6">
            {/* Shipment Overview Header Card */}
            <div className="p-4 bg-slate-950/90 border border-slate-800 rounded-xl space-y-4">
              <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <span>1. Shipment Inbound Credentials & Overhead Costs</span>
                <span className="text-[10px] text-emerald-400 font-mono normal-case bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/60">
                  Currency: ৳ BDT
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Shipment Code / Tracking ID
                  </label>
                  <input
                    type="text"
                    value={shipmentCode}
                    onChange={(e) => setShipmentCode(e.target.value)}
                    placeholder="e.g. SHP-2026-05"
                    required
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm font-mono text-emerald-400 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Assigned identifier for batch tracking
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Transport Cost for Shipment (৳ BDT)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-xs font-bold text-slate-500">৳</span>
                    <input
                      type="number"
                      min="0"
                      step="10"
                      value={shipmentTransportCost}
                      onChange={(e) => setShipmentTransportCost(Math.max(0, parseFloat(e.target.value) || 0))}
                      required
                      className="w-full pl-7 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm font-mono text-white font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Inbound freight / transport for full shipment
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Other Handling Cost (৳ BDT)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-xs font-bold text-slate-500">৳</span>
                    <input
                      type="number"
                      min="0"
                      step="10"
                      value={shipmentHandlingCost}
                      onChange={(e) => setShipmentHandlingCost(Math.max(0, parseFloat(e.target.value) || 0))}
                      required
                      className="w-full pl-7 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm font-mono text-white font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Customs, loading/unloading, handling
                  </span>
                </div>
              </div>

              {/* Real-time Dispersion Callout */}
              <div className="p-3 bg-emerald-950/30 border border-emerald-800/40 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                  <span className="text-slate-300">
                    <b>Equal Dispersion Formula:</b> Total Transport <b>৳{shipmentTransportCost.toLocaleString()}</b> + Handling <b>৳{shipmentHandlingCost.toLocaleString()}</b> ÷ <b>{itemsCountInBatch} items</b>
                  </span>
                </div>
                <div className="flex items-center gap-2 font-mono text-emerald-300">
                  <span className="bg-emerald-900/60 px-2 py-0.5 rounded border border-emerald-700/40">
                    +৳{batchDispersedTransportPerItem.toLocaleString()} Transport / item
                  </span>
                  <span className="bg-emerald-900/60 px-2 py-0.5 rounded border border-emerald-700/40">
                    +৳{batchDispersedHandlingPerItem.toLocaleString()} Handling / item
                  </span>
                </div>
              </div>
            </div>

            {/* Shipment Items List */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <span>2. Items Included in this Shipment ({shipmentItems.length})</span>
                </div>
                <button
                  type="button"
                  onClick={handleAddShipmentRow}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <PlusCircle className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Add Another Item to Shipment</span>
                </button>
              </div>

              <div className="space-y-3">
                {shipmentItems.map((item, index) => {
                  const effectiveLandedBuying = Number((item.buying_price + batchDispersedTransportPerItem + batchDispersedHandlingPerItem).toFixed(2));
                  const suggested5PctPrice = Number((effectiveLandedBuying * 1.05).toFixed(2));
                  const profitAmount = Number((item.selling_price - effectiveLandedBuying).toFixed(2));
                  const profitMarginPct = effectiveLandedBuying > 0 ? Number(((profitAmount / effectiveLandedBuying) * 100).toFixed(1)) : 0;
                  const isExactly5Pct = Math.abs(item.selling_price - suggested5PctPrice) < 0.5;

                  return (
                    <div
                      key={item.id}
                      className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-3 relative group hover:border-slate-700 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-slate-800 text-emerald-400 text-xs font-mono font-bold flex items-center justify-center">
                            {index + 1}
                          </span>
                          <span className="text-xs font-semibold text-slate-200">
                            Shipment Item #{index + 1}
                          </span>
                        </div>
                        {shipmentItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveShipmentRow(item.id)}
                            className="text-slate-500 hover:text-red-400 p-1 rounded transition-colors cursor-pointer"
                            title="Remove item from shipment"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      {/* Item Inputs Row 1: Title, Category, SKU, Quantity */}
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                        <div className="sm:col-span-2">
                          <label className="block text-[11px] font-medium text-slate-400 mb-1">
                            Product Title / Item Name
                          </label>
                          <input
                            type="text"
                            value={item.item_name}
                            onChange={(e) => handleUpdateItemField(item.id, 'item_name', e.target.value)}
                            placeholder="e.g. Arabica Roast Beans"
                            required
                            className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-medium text-slate-400 mb-1">
                            Category
                          </label>
                          <select
                            value={item.category}
                            onChange={(e) => handleUpdateItemField(item.id, 'category', e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                          >
                            <option value="Coffee Beans">Coffee Beans</option>
                            <option value="Brewing Gear">Brewing Gear</option>
                            <option value="Dairy & Milk">Dairy & Milk</option>
                            <option value="Syrups & Flavors">Syrups & Flavors</option>
                            <option value="Teas & Powders">Teas & Powders</option>
                            <option value="Drinkware">Drinkware</option>
                            <option value="General Merchandise">General Merchandise</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[11px] font-medium text-slate-400 mb-1">
                            Quantity (Units)
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={item.stock_level}
                            onChange={(e) => handleUpdateItemField(item.id, 'stock_level', Math.max(1, parseInt(e.target.value) || 1))}
                            required
                            className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          />
                        </div>
                      </div>

                      {/* Item Inputs Row 2: Buying Price, Dispersed Breakdown, Landed Cost, 5% Suggestion Tab & Manual Selling Price */}
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-800/60 items-end">
                        {/* 1. Buying Price */}
                        <div>
                          <label className="block text-[11px] font-medium text-slate-300 mb-1">
                            Buying Price (৳ BDT)
                          </label>
                          <div className="relative">
                            <span className="absolute left-2.5 top-1.5 text-xs font-bold text-slate-500">৳</span>
                            <input
                              type="number"
                              min="0"
                              step="5"
                              value={item.buying_price}
                              onChange={(e) => handleUpdateItemField(item.id, 'buying_price', Math.max(0, parseFloat(e.target.value) || 0))}
                              required
                              className="w-full pl-6 pr-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-white font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            />
                          </div>
                          <span className="text-[10px] text-slate-500 mt-0.5 block">
                            Base supplier cost / unit
                          </span>
                        </div>

                        {/* 2. Dispersed Overhead & Landed Buying Cost Preview */}
                        <div className="p-2 bg-slate-900/90 border border-slate-800 rounded-lg text-[11px]">
                          <div className="text-slate-400 text-[10px] flex items-center justify-between">
                            <span>Dispersed Overhead</span>
                            <span className="font-mono text-emerald-400">+৳{(batchDispersedTransportPerItem + batchDispersedHandlingPerItem).toFixed(0)}</span>
                          </div>
                          <div className="text-xs font-bold text-white font-mono mt-0.5 flex items-center justify-between">
                            <span>Landed Cost:</span>
                            <span className="text-amber-400">৳{effectiveLandedBuying.toLocaleString()} BDT</span>
                          </div>
                          <span className="text-[9px] text-slate-500 block">
                            Buying + (Transport÷{itemsCountInBatch}) + (Handling÷{itemsCountInBatch})
                          </span>
                        </div>

                        {/* 3. 5% Profit Suggestion Tab / Button */}
                        <div>
                          <label className="block text-[11px] font-medium text-slate-400 mb-1 flex items-center justify-between">
                            <span>5% Profit Tab</span>
                            {isExactly5Pct && (
                              <span className="text-[9px] text-emerald-400 font-mono">Suggested Active</span>
                            )}
                          </label>
                          <button
                            type="button"
                            onClick={() => handleApply5PercentProfitToItem(item.id)}
                            className={`w-full py-1.5 px-2 rounded-lg text-xs font-mono font-semibold transition-all border flex items-center justify-center gap-1.5 cursor-pointer ${
                              isExactly5Pct
                                ? 'bg-emerald-950 text-emerald-300 border-emerald-600/80 shadow-sm shadow-emerald-500/10'
                                : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700 hover:border-emerald-600'
                            }`}
                            title="Click suggestion tab to auto-fill Selling Price with 5% profit over landed buying cost"
                          >
                            <Sparkles className="w-3 h-3 text-emerald-400 shrink-0" />
                            <span>Suggest +5%: ৳{suggested5PctPrice.toLocaleString()}</span>
                          </button>
                          <span className="text-[9px] text-slate-500 mt-0.5 block text-center">
                            Tap to auto-fill selling price
                          </span>
                        </div>

                        {/* 4. Selling Price (Can be inserted manually!) */}
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="block text-[11px] font-medium text-slate-300">
                              Selling Price (৳ BDT)
                            </label>
                            <span className="text-[10px] text-slate-400 italic">
                              Manual or Suggested
                            </span>
                          </div>
                          <div className="relative">
                            <span className="absolute left-2.5 top-1.5 text-xs font-bold text-slate-500">৳</span>
                            <input
                              type="number"
                              min="0"
                              step="5"
                              value={item.selling_price}
                              onChange={(e) => handleUpdateItemField(item.id, 'selling_price', Math.max(0, parseFloat(e.target.value) || 0))}
                              required
                              className={`w-full pl-6 pr-2.5 py-1.5 bg-slate-900 border rounded-lg text-xs font-mono font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                                isExactly5Pct
                                  ? 'border-emerald-700/80 text-emerald-300'
                                  : 'border-slate-700 text-white'
                              }`}
                            />
                          </div>
                          <div className="flex items-center justify-between text-[10px] mt-0.5">
                            <span className={profitAmount >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                              {profitAmount >= 0 ? '+' : ''}৳{profitAmount.toLocaleString()} ({profitMarginPct}%)
                            </span>
                            <span className="text-slate-500">
                              {item.manuallyEditedPrice ? 'Custom Price' : '5% Tab'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Commit Shipment Button */}
            <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="text-xs text-slate-400">
                Ready to commit: <span className="text-white font-semibold">{shipmentItems.length} items</span> in Shipment{' '}
                <span className="text-emerald-400 font-mono font-bold">{shipmentCode}</span>
              </div>
              <button
                type="submit"
                className="py-2.5 px-6 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-lg shadow-emerald-500/20 cursor-pointer flex items-center justify-center gap-2"
              >
                <PackagePlus className="w-4 h-4" />
                <span>Receive Shipment & Commit Items to Inventory</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 2: QUICK ADD SINGLE PRODUCT */}
      {activeTab === 'single_add' && (
        <div className="max-w-2xl bg-slate-900/90 border border-slate-800 rounded-xl p-6 shadow-xl space-y-4">
          <div className="pb-3 border-b border-slate-800">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <PlusCircle className="w-4 h-4 text-emerald-400" />
              <span>Create Single Catalog Product</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Includes shipment code, transport cost equal dispersion, buying price, 5% profit suggestion tab, and manual selling price.
            </p>
          </div>

          {singleFeedback && (
            <div className="p-3 bg-emerald-950/40 border border-emerald-800/60 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{singleFeedback}</span>
            </div>
          )}

          <form onSubmit={handleSingleAddItemSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Product Title / Item Name
              </label>
              <input
                type="text"
                value={singleName}
                onChange={(e) => setSingleName(e.target.value)}
                placeholder="e.g. Ethiopian Yirgacheffe Beans (500g)"
                required
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Shipment Code
                </label>
                <input
                  type="text"
                  value={singleShipmentCode}
                  onChange={(e) => setSingleShipmentCode(e.target.value)}
                  placeholder="e.g. SHP-2026-04"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm font-mono text-emerald-400 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Initial Stock Quantity
                </label>
                <input
                  type="number"
                  min="0"
                  value={singleStock}
                  onChange={(e) => setSingleStock(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm font-mono text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Category
                </label>
                <select
                  value={singleCategory}
                  onChange={(e) => setSingleCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 cursor-pointer"
                >
                  <option value="Coffee Beans">Coffee Beans</option>
                  <option value="Brewing Gear">Brewing Gear</option>
                  <option value="Dairy & Milk">Dairy & Milk</option>
                  <option value="Syrups & Flavors">Syrups & Flavors</option>
                  <option value="Teas & Powders">Teas & Powders</option>
                  <option value="Drinkware">Drinkware</option>
                  <option value="General Merchandise">General Merchandise</option>
                </select>
              </div>
            </div>

            {/* Shipment Transport & Handling Cost Section */}
            <div className="p-4 bg-slate-950/90 border border-slate-800 rounded-xl space-y-3">
              <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Shipment Transport & Landed Cost Breakdown (৳ BDT)
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">
                    Shipment Transport Cost (৳)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="10"
                    value={singleShipmentTransport}
                    onChange={(e) => setSingleShipmentTransport(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">
                    Other Handling Cost (৳)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="10"
                    value={singleShipmentHandling}
                    onChange={(e) => setSingleShipmentHandling(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">
                    Items Sharing Shipment
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={singleItemsInShipment}
                    onChange={(e) => setSingleItemsInShipment(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="p-2.5 bg-slate-900/90 border border-slate-800 rounded-lg flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400">
                  Equally Dispersed Transport & Handling:
                </span>
                <span className="text-emerald-400 font-semibold">
                  +৳{singleDispersedTransport} Transport + ৳{singleDispersedHandling} Handling = +৳{(singleDispersedTransport + singleDispersedHandling).toFixed(2)} / item
                </span>
              </div>
            </div>

            {/* Buying Price & Selling Price with 5% Profit Suggestion Tab */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Buying Price (৳ BDT)
                </label>
                <input
                  type="number"
                  min="0"
                  step="10"
                  value={singleBuyingPrice}
                  onChange={(e) => setSingleBuyingPrice(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm font-mono text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 font-semibold"
                />
                <div className="text-[11px] text-amber-400 mt-1 font-mono">
                  Total Landed Buying Cost: ৳{singleTotalBuyingCost.toLocaleString()} BDT
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-medium text-slate-300">
                    Selling Price (৳ BDT)
                  </label>
                  <button
                    type="button"
                    onClick={handleApplySingle5Pct}
                    className="text-[11px] bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-700/60 px-2 py-0.5 rounded font-mono flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Sparkles className="w-3 h-3 text-emerald-400" />
                    <span>Suggestion Tab: +5% (৳{singleSuggested5Pct})</span>
                  </button>
                </div>
                <input
                  type="number"
                  min="0"
                  step="10"
                  value={singleSellingPrice}
                  onChange={(e) => setSingleSellingPrice(Math.max(0, parseFloat(e.target.value) || 0))}
                  placeholder="Insert manually or click suggestion tab"
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm font-mono text-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 font-bold"
                />
                <div className="text-[10px] text-slate-400 mt-1 flex items-center justify-between">
                  <span>Manual insertion enabled</span>
                  <span className="text-emerald-400 font-mono">
                    Profit: ৳{(singleSellingPrice - singleTotalBuyingCost).toFixed(2)} BDT
                  </span>
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-sm rounded-xl transition-all shadow-lg shadow-emerald-500/20 cursor-pointer"
            >
              Add Product to Catalog
            </button>
          </form>
        </div>
      )}

      {/* TAB 3: SHIPMENT & LANDED COST CATALOG TABLE */}
      {activeTab === 'catalog' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Boxes className="w-4 h-4 text-emerald-400" />
                <span>Inventory Catalog with Shipment & Landed Cost Breakdown</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Displays shipment codes, base buying price, dispersed transport cost, landed cost, and selling price in ৳ BDT.
              </p>
            </div>

            <div className="relative min-w-[240px]">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={catalogSearch}
                onChange={(e) => setCatalogSearch(e.target.value)}
                placeholder="Search name, SKU, or shipment code..."
                className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="border border-slate-800 rounded-xl overflow-hidden overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Product Name & SKU</th>
                  <th className="py-2.5 px-3">Shipment Code</th>
                  <th className="py-2.5 px-3 text-right">Buying Price</th>
                  <th className="py-2.5 px-3 text-right">Dispersed Transport</th>
                  <th className="py-2.5 px-3 text-right">Landed Cost</th>
                  <th className="py-2.5 px-3 text-right">Selling Price</th>
                  <th className="py-2.5 px-3 text-right">5% Profit Margin</th>
                  <th className="py-2.5 px-3 text-right">Stock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-mono text-xs text-slate-300">
                {filteredCatalog.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-500 font-sans">
                      No matching products found.
                    </td>
                  </tr>
                ) : (
                  filteredCatalog.map((item) => {
                    const buying = item.buying_price || item.base_cost || item.price * 0.7;
                    const dispersedT = item.dispersed_transport_cost || item.transport_cost_per_unit || 0;
                    const landed = item.total_buying_cost || item.landed_cost || (buying + dispersedT);
                    const profit = item.price - landed;
                    const margin = landed > 0 ? ((profit / landed) * 100).toFixed(1) : '0';

                    return (
                      <tr key={item.id} className="hover:bg-slate-800/40">
                        <td className="py-2.5 px-3 font-sans">
                          <div className="font-medium text-white">{item.item_name}</div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            {item.sku || `ID #${item.id}`} · {item.category || 'General'}
                          </div>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="bg-slate-800 text-emerald-400 px-2 py-0.5 rounded text-[11px] font-semibold">
                            {item.shipment_code || 'SHP-2026-01'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right text-slate-300">
                          ৳{buying.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 text-right text-emerald-400">
                          +৳{dispersedT.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 text-right text-amber-400 font-bold">
                          ৳{landed.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 text-right text-white font-bold">
                          ৳{item.price.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <span className={profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                            +৳{profit.toLocaleString()} ({margin}%)
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-semibold">
                          <span className={item.stock_level < 10 ? 'text-amber-400' : 'text-slate-200'}>
                            {item.stock_level}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: UPDATE STOCK & PRICE */}
      {activeTab === 'update' && (
        <div className="max-w-2xl bg-slate-900/90 border border-slate-800 rounded-xl p-6 shadow-xl space-y-4">
          <div className="pb-3 border-b border-slate-800">
            <h2 className="text-sm font-semibold text-white">Adjust Existing Product Stock & Price</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Modifies values in the Supabase <code className="font-mono text-emerald-400">inventory</code> table
            </p>
          </div>

          {updateFeedback && (
            <div className="p-3 bg-emerald-950/40 border border-emerald-800/60 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{updateFeedback}</span>
            </div>
          )}

          <form onSubmit={handleUpdateStockSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Select Item to Modify
              </label>
              <select
                value={selectedUpdateItemId}
                onChange={(e) => {
                  const id = Number(e.target.value);
                  setSelectedUpdateItemId(id);
                  const found = inventory.find((i) => i.id === id);
                  if (found) {
                    setNewStockLevel(found.stock_level);
                    setNewPrice(found.price);
                  }
                  setUpdateFeedback(null);
                }}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 cursor-pointer"
              >
                {inventory.map((item) => (
                  <option key={item.id} value={item.id} className="bg-slate-900">
                    {item.item_name} — Stock: {item.stock_level} | Price: ৳{item.price.toLocaleString()} BDT ({item.shipment_code || 'SHP'})
                  </option>
                ))}
              </select>
            </div>

            {selectedUpdateItem && (
              <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-500 block text-[11px]">Shipment Code</span>
                  <span className="text-emerald-400 font-mono font-medium">{selectedUpdateItem.shipment_code || 'SHP-2026-01'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Landed Cost</span>
                  <span className="text-amber-400 font-mono font-medium">৳{(selectedUpdateItem.total_buying_cost || selectedUpdateItem.landed_cost || selectedUpdateItem.price * 0.7).toLocaleString()} BDT</span>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  New Stock Quantity
                </label>
                <input
                  type="number"
                  min="0"
                  value={newStockLevel}
                  onChange={(e) => setNewStockLevel(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm font-mono text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Selling Price (৳ BDT)
                </label>
                <input
                  type="number"
                  min="0"
                  step="10"
                  value={newPrice}
                  onChange={(e) => setNewPrice(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm font-mono text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 font-bold"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-sm rounded-xl transition-all shadow-lg shadow-emerald-500/20 cursor-pointer"
            >
              Update Stock & Price
            </button>
          </form>
        </div>
      )}

      {/* TAB 5: LEGACY DATA MIGRATION */}
      {activeTab === 'migration' && (
        <div className="max-w-3xl bg-slate-900/90 border border-slate-800 rounded-xl p-6 shadow-xl space-y-6">
          <div className="pb-3 border-b border-slate-800 flex items-start justify-between">
            <div>
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                <span>Legacy Excel Data Migration Engine</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Reads from <code className="text-emerald-400 font-mono">Inventory_Tracker.xlsx</code> using Pandas to bulk insert into Supabase
              </p>
            </div>
            <button
              onClick={downloadSampleExcelFile}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg border border-slate-700 flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Download Sample .xlsx</span>
            </button>
          </div>

          {migrationFeedback && (
            <div className="p-3 bg-emerald-950/40 border border-emerald-800/60 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{migrationFeedback}</span>
            </div>
          )}

          {/* Upload Area */}
          <div className="border-2 border-dashed border-slate-800 hover:border-slate-700 rounded-xl p-6 text-center transition-colors">
            <Upload className="w-8 h-8 text-slate-500 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-300">
              Upload <code className="font-mono text-emerald-400">Inventory_Tracker.xlsx</code> (or any Excel / CSV)
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Requires columns: <code className="font-mono">item_name</code>, <code className="font-mono">stock_level</code>, <code className="font-mono">price</code>
            </p>
            <label className="mt-3 inline-block px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold cursor-pointer transition-colors">
              <span>{isProcessing ? 'Reading Spreadsheet...' : 'Select Excel Spreadsheet'}</span>
              <input
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileUpload}
                disabled={isProcessing}
                className="hidden"
              />
            </label>
          </div>

          {/* Staged Data Preview */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <span>Staged Records ({stagedExcelData ? stagedExcelData.length : LEGACY_EXCEL_TEMPLATE_DATA.length} items ready)</span>
              </h3>
              <span className="text-[11px] text-slate-500 font-mono">{uploadedFileName}</span>
            </div>

            <div className="border border-slate-800 rounded-xl overflow-hidden max-h-56 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800 sticky top-0">
                  <tr>
                    <th className="py-2 px-3">#</th>
                    <th className="py-2 px-3">item_name</th>
                    <th className="py-2 px-3 text-right">stock_level</th>
                    <th className="py-2 px-3 text-right">price (৳ BDT)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 font-mono text-xs text-slate-300">
                  {(stagedExcelData || LEGACY_EXCEL_TEMPLATE_DATA).map((row, i) => (
                    <tr key={i} className="hover:bg-slate-800/40">
                      <td className="py-2 px-3 text-slate-500">{i + 1}</td>
                      <td className="py-2 px-3 font-sans font-medium text-white">{row.item_name}</td>
                      <td className="py-2 px-3 text-right text-emerald-400">{row.stock_level}</td>
                      <td className="py-2 px-3 text-right">৳{row.price.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex items-center justify-end gap-3">
              <button
                onClick={handleRunMigration}
                className="py-2.5 px-6 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-lg shadow-emerald-500/20 cursor-pointer flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>Execute Bulk Supabase Insert</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
