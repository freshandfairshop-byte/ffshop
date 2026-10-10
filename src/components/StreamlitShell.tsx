import React, { useState } from 'react';
import { UserAccount } from '../types';
import {
  Package,
  LayoutDashboard,
  ShoppingCart,
  Boxes,
  Users,
  Code2,
  LogOut,
  Database,
  Download,
  FolderArchive,
  Menu,
  X,
  FileSpreadsheet,
} from 'lucide-react';
import { downloadSampleExcelFile } from '../utils/excelGenerator';
import { exportProjectZip } from '../utils/zipExporter';

interface StreamlitShellProps {
  currentUser: UserAccount;
  activeNav: string;
  onNavigate: (nav: string) => void;
  onLogout: () => void;
  onOpenSupabaseConfig: () => void;
  children: React.ReactNode;
}

export const StreamlitShell: React.FC<StreamlitShellProps> = ({
  currentUser,
  activeNav,
  onNavigate,
  onLogout,
  onOpenSupabaseConfig,
  children,
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const navItems = [
    { id: 'Dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'Sales (POS)', label: 'Sales (POS)', icon: ShoppingCart },
    { id: 'Inventory Management', label: 'Inventory Management', icon: Boxes },
    { id: 'Admin Panel', label: 'Admin Panel', icon: Users },
    { id: 'Code Workbench', label: 'Code Workbench', icon: Code2 },
  ];

  const handleDownloadZip = async () => {
    setIsExporting(true);
    try {
      await exportProjectZip();
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col antialiased">
      {/* Top Streamlit-Style Header Bar */}
      <header className="h-14 border-b border-slate-800/80 bg-slate-900/80 backdrop-blur-md sticky top-0 z-40 px-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="md:hidden p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-sm tracking-tight text-white">
                Cloud Inventory & POS
              </span>
              <span className="inline-block text-[10px] bg-emerald-950 text-emerald-400 font-mono px-1.5 py-0.5 rounded border border-emerald-800 ml-2">
                ৳ BDT
              </span>
              <span className="hidden sm:inline-block text-[10px] text-slate-400 ml-2">
                Streamlit 1.38 · Supabase PostgreSQL
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              // Direct download app.py
              const a = document.createElement('a');
              a.href = '/app.py';
              a.download = 'app.py';
              // Fallback to code template if href download doesn't trigger
              fetch('/app.py')
                .then(r => r.text())
                .then(text => {
                  const blob = new Blob([text], { type: 'text/x-python' });
                  const url = URL.createObjectURL(blob);
                  const dl = document.createElement('a');
                  dl.href = url;
                  dl.download = 'app.py';
                  dl.click();
                  URL.revokeObjectURL(url);
                })
                .catch(() => {
                  window.location.href = '/app.py';
                });
            }}
            title="Download full app.py file for Streamlit Cloud"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-lg transition-all shadow-sm cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>app.py</span>
          </button>

          <button
            onClick={downloadSampleExcelFile}
            title="Download sample Inventory_Tracker.xlsx"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-slate-300 text-xs rounded-lg transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>Sample Excel</span>
          </button>

          <button
            disabled={isExporting}
            onClick={handleDownloadZip}
            title="Download complete ready-to-run Python project ZIP"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs rounded-lg shadow-sm shadow-emerald-500/20 transition-all cursor-pointer"
          >
            <FolderArchive className="w-3.5 h-3.5" />
            <span>{isExporting ? 'Packaging...' : 'Export .zip'}</span>
          </button>

          <button
            onClick={onOpenSupabaseConfig}
            title="Supabase Connection & Database Settings"
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <Database className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Layout Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar (matches st.sidebar.radio) */}
        <aside
          className={`fixed md:sticky top-14 bottom-0 left-0 z-30 w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between p-4 transition-transform duration-200 ease-in-out ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
          }`}
        >
          <div className="space-y-6">
            {/* Operator Session Card */}
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
              <div className="text-[11px] text-slate-400">Authenticated Operator:</div>
              <div className="text-xs font-semibold text-white font-mono truncate" title={currentUser.email}>
                {currentUser.email}
              </div>
              <div className="text-[10px] text-emerald-400 font-mono flex items-center gap-1.5 pt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="capitalize">{currentUser.role} Role</span>
                <span>·</span>
                <span>RLS Active</span>
              </div>
            </div>

            {/* Streamlit Navigation Radio Menu */}
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-2">
                Navigation
              </div>
              <nav className="space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeNav === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onNavigate(item.id);
                        setSidebarOpen(false);
                      }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium transition-colors cursor-pointer text-left ${
                        isActive
                          ? 'bg-emerald-500 text-slate-950 font-semibold shadow-sm shadow-emerald-500/20'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? 'text-slate-950' : 'text-slate-400'}`} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Bottom Sidebar: Log Out & Connection Badge */}
          <div className="pt-4 border-t border-slate-800 space-y-3">
            <button
              onClick={onLogout}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-slate-800/80 hover:bg-red-950/40 hover:text-red-300 text-slate-300 border border-slate-700/60 hover:border-red-800/50 rounded-xl text-xs font-medium transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out (supabase.auth.sign_out)</span>
            </button>

            <div className="text-[10px] text-slate-400 text-center font-mono">
              PostgreSQL · Real-time RLS
            </div>
          </div>
        </aside>

        {/* Backdrop for mobile */}
        {sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-slate-950/60 z-20 md:hidden"
          />
        )}

        {/* Primary Page Canvas */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
};
