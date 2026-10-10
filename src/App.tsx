/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { store } from './services/storeService';
import { UserAccount, InventoryItem, SaleRecord } from './types';
import { LoginScreen } from './components/LoginScreen';
import { StreamlitShell } from './components/StreamlitShell';
import { DashboardView } from './components/DashboardView';
import { PosView } from './components/PosView';
import { InventoryView } from './components/InventoryView';
import { AdminView } from './components/AdminView';
import { CodeWorkbench } from './components/CodeWorkbench';
import { ReceiptModal } from './components/ReceiptModal';
import { SupabaseConfigModal } from './components/SupabaseConfigModal';

export default function App() {
  const [, setTick] = useState(0);
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(store.getCurrentUser());
  const [activeNav, setActiveNav] = useState<string>('Dashboard');
  const [viewReceiptSale, setViewReceiptSale] = useState<SaleRecord | null>(null);
  const [isSupabaseConfigOpen, setIsSupabaseConfigOpen] = useState(false);

  // Quick restock modal state
  const [restockItem, setRestockItem] = useState<InventoryItem | null>(null);
  const [restockAmount, setRestockAmount] = useState<number>(20);

  useEffect(() => {
    // Subscribe to store changes
    const unsubscribe = store.subscribe(() => {
      setCurrentUser(store.getCurrentUser());
      setTick((t) => t + 1);
    });
    return unsubscribe;
  }, []);

  // Strict Login Gateway: If not authenticated, only render the Login Screen
  if (!currentUser) {
    return (
      <LoginScreen
        onLogin={(email, password) => {
          store.login(email, password);
        }}
      />
    );
  }

  const inventory = store.getInventory();
  const sales = store.getSales();
  const users = store.getUsers();
  const auditLogs = store.getAuditLogs();
  const config = store.getConfig();

  const handleQuickRestockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockItem) return;
    store.updateStock(restockItem.id, restockItem.stock_level + restockAmount);
    setRestockItem(null);
  };

  return (
    <StreamlitShell
      currentUser={currentUser}
      activeNav={activeNav}
      onNavigate={(nav) => setActiveNav(nav)}
      onLogout={() => store.logout()}
      onOpenSupabaseConfig={() => setIsSupabaseConfigOpen(true)}
    >
      {/* View routing */}
      {activeNav === 'Dashboard' && (
        <DashboardView
          inventory={inventory}
          onNavigateToTab={(nav) => setActiveNav(nav)}
          onQuickRestock={(item) => {
            setRestockItem(item);
            setRestockAmount(25);
          }}
        />
      )}

      {activeNav === 'Sales (POS)' && (
        <PosView
          inventory={inventory}
          sales={sales}
          currentUserEmail={currentUser.email}
          onProcessSale={(itemId, qty, cName, cAddr, cPhone) =>
            store.processSale(itemId, qty, cName, cAddr, cPhone)
          }
          onViewReceipt={(sale) => setViewReceiptSale(sale)}
        />
      )}

      {activeNav === 'Inventory Management' && (
        <InventoryView
          inventory={inventory}
          currentUserEmail={currentUser.email}
          onAddItem={(
            name,
            stock,
            price,
            category,
            sku,
            shipment_code,
            buying_price,
            transport_cost_shipment,
            other_handling_cost,
            items_in_shipment
          ) => {
            store.addItem(
              name,
              stock,
              price,
              category,
              sku,
              shipment_code,
              buying_price,
              transport_cost_shipment,
              other_handling_cost,
              items_in_shipment
            );
          }}
          onAddShipmentBatch={(intake) => store.addShipmentBatch(intake)}
          onUpdateStock={(id, newLevel, newPrice) =>
            store.updateStock(id, newLevel, newPrice)
          }
          onBulkMigrate={(items, sourceName) =>
            store.bulkMigrateLegacyItems(items, sourceName)
          }
        />
      )}

      {activeNav === 'Admin Panel' && (
        <AdminView
          users={users}
          auditLogs={auditLogs}
          currentUserEmail={currentUser.email}
          onCreateUser={(email, role) => store.createAdminUser(email, role)}
        />
      )}

      {activeNav === 'Code Workbench' && <CodeWorkbench />}

      {/* POS Receipt Modal */}
      {viewReceiptSale && (
        <ReceiptModal
          sale={viewReceiptSale}
          onClose={() => setViewReceiptSale(null)}
        />
      )}

      {/* Supabase Config / Database Reset Modal */}
      <SupabaseConfigModal
        config={config}
        isOpen={isSupabaseConfigOpen}
        onClose={() => setIsSupabaseConfigOpen(false)}
        onSaveConfig={(cfg) => store.updateConfig(cfg)}
        onResetDatabase={() => store.resetToDefaults()}
      />

      {/* Quick Restock Dialog */}
      {restockItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl">
            <h3 className="text-sm font-semibold text-white mb-1">
              Restock: {restockItem.item_name}
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Current stock: <span className="font-mono text-amber-400">{restockItem.stock_level} units</span>
            </p>

            <form onSubmit={handleQuickRestockSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Additional Units to Add
                </label>
                <input
                  type="number"
                  min="1"
                  value={restockAmount}
                  onChange={(e) => setRestockAmount(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm font-mono text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRestockItem(null)}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs rounded-xl cursor-pointer"
                >
                  Confirm Restock ({restockItem.stock_level + restockAmount} total)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </StreamlitShell>
  );
}
