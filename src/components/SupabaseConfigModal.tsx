import React, { useState } from 'react';
import { SupabaseConfig } from '../types';
import { X, Database, CheckCircle, RefreshCcw, Shield, ExternalLink } from 'lucide-react';

interface SupabaseConfigModalProps {
  config: SupabaseConfig;
  isOpen: boolean;
  onClose: () => void;
  onSaveConfig: (cfg: Partial<SupabaseConfig>) => void;
  onResetDatabase: () => void;
}

export const SupabaseConfigModal: React.FC<SupabaseConfigModalProps> = ({
  config,
  isOpen,
  onClose,
  onSaveConfig,
  onResetDatabase,
}) => {
  const [url, setUrl] = useState(config.url || '');
  const [anonKey, setAnonKey] = useState(config.anonKey || '');
  const [serviceKey, setServiceKey] = useState(config.serviceKey || '');
  const [useLive, setUseLive] = useState(config.useLiveConnection);
  const [feedback, setFeedback] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveConfig({
      url: url.trim(),
      anonKey: anonKey.trim(),
      serviceKey: serviceKey.trim(),
      useLiveConnection: useLive,
      isConnected: Boolean(url.trim() && anonKey.trim()),
    });
    setFeedback('Settings saved successfully!');
    setTimeout(() => {
      setFeedback(null);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950 border-b border-slate-800">
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <Database className="w-4 h-4 text-emerald-400" />
            <span>Supabase Cloud Integration & Persistence</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-4">
          {feedback && (
            <div className="p-3 bg-emerald-950/40 border border-emerald-800/60 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span>{feedback}</span>
            </div>
          )}

          <div className="text-xs text-slate-400">
            Configure your remote Supabase PostgreSQL connection parameters or keep the simulated local persistent engine with instant browser state.
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Supabase Project URL
            </label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://xyzcompany.supabase.co"
              className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Public Anon Key (SUPABASE_KEY)
            </label>
            <input
              type="password"
              value={anonKey}
              onChange={(e) => setAnonKey(e.target.value)}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Service Role Secret Key (SUPABASE_SERVICE_KEY)
            </label>
            <input
              type="password"
              value={serviceKey}
              onChange={(e) => setServiceKey(e.target.value)}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div className="pt-2 flex items-center gap-3">
            <input
              type="checkbox"
              id="useLive"
              checked={useLive}
              onChange={(e) => setUseLive(e.target.checked)}
              className="rounded bg-slate-950 border-slate-800 text-emerald-500 focus:ring-0 cursor-pointer"
            />
            <label htmlFor="useLive" className="text-xs text-slate-300 cursor-pointer">
              Enable live network calls to Supabase API (requires valid CORS & SQL setup)
            </label>
          </div>

          <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                if (confirm('Reset inventory, sales, and audit logs to clean factory defaults?')) {
                  onResetDatabase();
                  setFeedback('Database restored to initial state.');
                }
              }}
              className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCcw className="w-3.5 h-3.5" />
              <span>Reset Factory Sample Data</span>
            </button>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs rounded-xl shadow-lg shadow-emerald-500/10 cursor-pointer"
              >
                Save Configuration
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
