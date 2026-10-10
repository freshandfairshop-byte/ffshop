import React, { useState } from 'react';
import { InventoryItem } from '../types';
import {
  Boxes,
  AlertTriangle,
  DollarSign,
  TrendingUp,
  Search,
  Filter,
  ArrowUpDown,
  PlusCircle,
  FileSpreadsheet,
  FileText,
  FileDown,
  Sparkles,
  SlidersHorizontal,
} from 'lucide-react';
import { exportToXlsx, exportToPdf, exportToDoc } from '../utils/documentExporters';

interface DashboardViewProps {
  inventory: InventoryItem[];
  onNavigateToTab: (tab: string) => void;
  onQuickRestock: (item: InventoryItem) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  inventory,
  onNavigateToTab,
  onQuickRestock,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [stockCondition, setStockCondition] = useState<'all' | 'low' | 'in_stock' | 'out_of_stock'>('all');
  const [maxPriceFilter, setMaxPriceFilter] = useState<number>(100);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [sortField, setSortField] = useState<'item_name' | 'stock_level' | 'price' | 'last_updated'>('item_name');
  const [sortAsc, setSortAsc] = useState(true);

  // Derived metrics
  const totalItems = inventory.length;
  const totalStockUnits = inventory.reduce((sum, item) => sum + item.stock_level, 0);
  const totalValuation = inventory.reduce((sum, item) => sum + item.stock_level * item.price, 0);
  const lowStockItems = inventory.filter((item) => item.stock_level < 10);
  const maxInventoryPrice = Math.max(...inventory.map((i) => i.price), 50);

  // Categories
  const categories = Array.from(new Set(inventory.map((i) => i.category || 'General')));

  // Filtered & sorted items
  const filteredItems = inventory
    .filter((item) => {
      const q = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !q ||
        item.item_name.toLowerCase().includes(q) ||
        (item.sku && item.sku.toLowerCase().includes(q)) ||
        (item.category && item.category.toLowerCase().includes(q)) ||
        item.updated_by.toLowerCase().includes(q) ||
        String(item.id).includes(q);

      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;

      let matchesStock = true;
      if (stockCondition === 'low') matchesStock = item.stock_level < 10;
      else if (stockCondition === 'in_stock') matchesStock = item.stock_level > 0;
      else if (stockCondition === 'out_of_stock') matchesStock = item.stock_level === 0;

      const matchesPrice = item.price <= maxPriceFilter;

      return matchesSearch && matchesCategory && matchesStock && matchesPrice;
    })
    .sort((a, b) => {
      let comp = 0;
      if (sortField === 'item_name') comp = a.item_name.localeCompare(b.item_name);
      else if (sortField === 'stock_level') comp = a.stock_level - b.stock_level;
      else if (sortField === 'price') comp = a.price - b.price;
      else if (sortField === 'last_updated')
        comp = new Date(a.last_updated).getTime() - new Date(b.last_updated).getTime();
      return sortAsc ? comp : -comp;
    });

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  // Export handlers
  const handleExportXlsx = () => {
    const dataToExport = filteredItems.map((item) => ({
      ID: item.id,
      'Item Name': item.item_name,
      Category: item.category || 'General',
      SKU: item.sku || 'N/A',
      'Stock Level': item.stock_level,
      'Unit Price (৳ BDT)': item.price,
      'Total Value (৳ BDT)': Number((item.stock_level * item.price).toFixed(2)),
      'Updated By': item.updated_by,
      'Last Updated': new Date(item.last_updated).toLocaleString(),
    }));
    exportToXlsx(dataToExport, `Inventory_Report_${new Date().toISOString().slice(0, 10)}`);
  };

  const handleExportPdf = () => {
    const headers = ['ID', 'Item Name', 'Category', 'Stock', 'Price (৳ BDT)', 'Total (৳ BDT)', 'Updated By'];
    const rows = filteredItems.map((item) => [
      item.id,
      item.item_name,
      item.category || 'General',
      item.stock_level,
      `৳${item.price.toLocaleString()}`,
      `৳${(item.stock_level * item.price).toLocaleString()}`,
      item.updated_by,
    ]);
    exportToPdf(
      'Cloud Inventory Status Report (BDT)',
      headers,
      rows,
      `Inventory_Report_${new Date().toISOString().slice(0, 10)}`,
      `Total ${filteredItems.length} SKUs | Filter: ${searchTerm || 'All'} | Currency: ৳ BDT`
    );
  };

  const handleExportDoc = () => {
    const headers = ['ID', 'Item Name', 'Category', 'Stock Level', 'Unit Price (৳ BDT)', 'Inventory Value (৳ BDT)', 'Updated By'];
    const rows = filteredItems.map((item) => [
      item.id,
      item.item_name,
      item.category || 'General',
      `${item.stock_level} units`,
      `৳${item.price.toLocaleString()}`,
      `৳${(item.stock_level * item.price).toLocaleString()}`,
      item.updated_by,
    ]);
    exportToDoc(
      'Cloud Inventory & Sales Catalog Report (BDT)',
      headers,
      rows,
      `Inventory_Report_${new Date().toISOString().slice(0, 10)}`,
      `Currency: Bangladeshi Taka (৳ BDT) | Synchronized with Supabase`
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Streamlit-styled header */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
              <span>📊</span>
              <span>Inventory Dashboard & Search</span>
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Live synchronized inventory state backed by Supabase PostgreSQL tables
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Export Dropdown / Buttons */}
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1 gap-1">
              <button
                onClick={handleExportXlsx}
                title="Export filtered records to Microsoft Excel (.xlsx)"
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 hover:text-emerald-300 font-medium text-xs rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>.xlsx</span>
              </button>

              <button
                onClick={handleExportPdf}
                title="Export filtered records to PDF document (.pdf)"
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-rose-400 hover:text-rose-300 font-medium text-xs rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>.pdf</span>
              </button>

              <button
                onClick={handleExportDoc}
                title="Export filtered records to Microsoft Word (.doc / .docx)"
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-400 hover:text-cyan-300 font-medium text-xs rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <FileDown className="w-3.5 h-3.5" />
                <span>.doc</span>
              </button>
            </div>

            <button
              onClick={() => onNavigateToTab('Inventory Management')}
              className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-medium text-xs rounded-xl transition-colors flex items-center gap-1.5 shadow-lg shadow-emerald-500/10 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Add Stock</span>
            </button>
          </div>
        </div>
      </div>

      {/* Streamlit Metric Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Total Catalog SKUs</span>
            <Boxes className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">{totalItems}</div>
          <div className="text-[11px] text-slate-500 mt-1">Active inventory rows</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Total Units in Stock</span>
            <TrendingUp className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">{totalStockUnits.toLocaleString()}</div>
          <div className="text-[11px] text-slate-500 mt-1">Combined physical count</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Inventory Valuation</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">
            ৳{totalValuation.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Retail asset value in ৳ BDT</div>
        </div>

        <div
          className={`border rounded-xl p-4 transition-colors ${
            lowStockItems.length > 0
              ? 'bg-amber-950/20 border-amber-800/40'
              : 'bg-slate-900/90 border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Low Stock Alerts</span>
            <AlertTriangle
              className={`w-4 h-4 ${lowStockItems.length > 0 ? 'text-amber-400' : 'text-slate-500'}`}
            />
          </div>
          <div
            className={`text-2xl font-bold font-mono ${
              lowStockItems.length > 0 ? 'text-amber-400' : 'text-slate-400'
            }`}
          >
            {lowStockItems.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Items below 10 units</div>
        </div>
      </div>

      {/* Low Stock Warning Banner */}
      {lowStockItems.length > 0 && (
        <div className="bg-amber-950/30 border border-amber-800/50 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h3 className="text-sm font-semibold text-amber-200">
                  ⚠️ Low Stock Threshold Warning ({lowStockItems.length} items &lt; 10 units)
                </h3>
                <button
                  onClick={() => setStockCondition(stockCondition === 'low' ? 'all' : 'low')}
                  className="text-xs text-amber-400 hover:text-amber-300 underline font-medium cursor-pointer"
                >
                  {stockCondition === 'low' ? 'Clear filter' : 'Filter table to low stock only'}
                </button>
              </div>
              <p className="text-xs text-amber-300/80 mt-1">
                The following products require replenishment soon:
              </p>
              <div className="flex flex-wrap gap-2 mt-2.5">
                {lowStockItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => onQuickRestock(item)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-900/50 hover:bg-amber-900/80 border border-amber-700/60 text-xs text-amber-100 transition-colors cursor-pointer"
                  >
                    <span className="font-medium">{item.item_name}</span>
                    <span className="font-mono text-amber-400 font-bold">({item.stock_level})</span>
                    <span className="text-[10px] text-amber-400 underline ml-1">+ Restock</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search & Filter Toolbar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-3 shadow-md">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by product title, SKU code, or updated_by operator email..."
              className="w-full pl-9 pr-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-300">
              <Filter className="w-3.5 h-3.5 text-slate-500" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-transparent text-xs text-white focus:outline-none cursor-pointer"
              >
                <option value="all" className="bg-slate-900">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat} className="bg-slate-900">
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-300">
              <select
                value={stockCondition}
                onChange={(e) => setStockCondition(e.target.value as typeof stockCondition)}
                className="bg-transparent text-xs text-white focus:outline-none cursor-pointer"
              >
                <option value="all" className="bg-slate-900">All Stock Statuses</option>
                <option value="low" className="bg-slate-900">Low Stock (&lt; 10)</option>
                <option value="in_stock" className="bg-slate-900">In Stock (&gt; 0)</option>
                <option value="out_of_stock" className="bg-slate-900">Out of Stock (= 0)</option>
              </select>
            </div>

            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`p-2 rounded-xl text-xs border transition-colors cursor-pointer ${
                showAdvancedFilters
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
              }`}
              title="Toggle Price Filter"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Collapsible Price Slider */}
        {showAdvancedFilters && (
          <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs space-y-2">
            <div className="flex justify-between items-center text-slate-300">
              <span>Maximum Unit Price Filter:</span>
              <span className="font-mono text-emerald-400 font-bold">${maxPriceFilter.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="5"
              max={Math.ceil(maxInventoryPrice)}
              step="1"
              value={maxPriceFilter}
              onChange={(e) => setMaxPriceFilter(Number(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
          </div>
        )}

        {/* Active status indicator & Export counter */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
          <div>
            Showing <span className="font-mono text-slate-200 font-semibold">{filteredItems.length}</span> of{' '}
            <span className="font-mono text-slate-300">{inventory.length}</span> items
            {searchTerm && <span> · matching "{searchTerm}"</span>}
          </div>
          <div className="flex items-center gap-2 text-[11px]">
            <span>Exports apply to current search results</span>
          </div>
        </div>
      </div>

      {/* Interactive DataFrame Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
              <tr>
                <th
                  onClick={() => handleSort('item_name')}
                  className="px-4 py-3 font-semibold cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Product / Item Name</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-600" />
                  </div>
                </th>
                <th className="px-3 py-3 font-semibold">Category</th>
                <th
                  onClick={() => handleSort('stock_level')}
                  className="px-4 py-3 font-semibold cursor-pointer hover:text-white transition-colors text-right"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Stock Level</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-600" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('price')}
                  className="px-4 py-3 font-semibold cursor-pointer hover:text-white transition-colors text-right"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Unit Price (৳)</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-600" />
                  </div>
                </th>
                <th className="px-4 py-3 font-semibold text-right">Value (৳ BDT)</th>
                <th
                  onClick={() => handleSort('last_updated')}
                  className="px-4 py-3 font-semibold cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Audit (updated_by)</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-600" />
                  </div>
                </th>
                <th className="px-3 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-normal">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                    No matching inventory items found for "{searchTerm}".
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const isLow = item.stock_level < 10;
                  const itemValue = item.stock_level * item.price;
                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-800/40 transition-colors group"
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-200 group-hover:text-white">
                          {item.item_name}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          {item.sku && (
                            <span className="text-[10px] text-slate-500 font-mono">
                              SKU: {item.sku}
                            </span>
                          )}
                          <span className="text-[10px] bg-slate-800 text-emerald-400 font-mono px-1.5 py-0.2 rounded border border-slate-700">
                            {item.shipment_code || 'SHP-2026-01'}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-slate-400">
                        {item.category || 'General'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span
                          className={`font-mono font-semibold px-2 py-0.5 rounded ${
                            isLow
                              ? 'bg-amber-950/60 text-amber-400 border border-amber-800/60'
                              : 'text-slate-200'
                          }`}
                        >
                          {item.stock_level}
                        </span>
                        {isLow && (
                          <span className="block text-[10px] text-amber-400 font-medium">Low stock</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-slate-200 font-semibold">
                        ৳{item.price.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-slate-300">
                        ৳{itemValue.toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-slate-300 truncate max-w-[180px] font-mono text-[11px]">
                          {item.updated_by}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {new Date(item.last_updated).toLocaleString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-right">
                        <button
                          onClick={() => onQuickRestock(item)}
                          className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded text-[11px] font-medium transition-colors cursor-pointer border border-slate-700/60"
                        >
                          Restock
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
