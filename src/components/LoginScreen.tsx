import React, { useState } from 'react';
import { Lock, ArrowRight, ShieldCheck, UserCheck, KeyRound, Sparkles } from 'lucide-react';

interface LoginScreenProps {
  onLogin: (email: string, password: string) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Please provide both work email and password.');
      return;
    }
    setError(null);
    onLogin(email, password);
  };

  const handleQuickFill = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('SupabasePass2026!');
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Background ambient gradient */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Brand header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 text-emerald-400 mb-4 shadow-lg shadow-emerald-500/5">
            <Lock className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white mb-2">
            Cloud Inventory & POS
          </h1>
          <p className="text-sm text-slate-400">
            Secure multi-user cloud inventory synced with Supabase PostgreSQL
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
          <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-800 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Supabase Auth Session Gateway</span>
            <span className="text-slate-600">·</span>
            <span className="text-emerald-400 font-mono">RLS Protected</span>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-950/40 border border-red-800/50 rounded-xl text-xs text-red-300 flex items-center gap-2">
              <span className="font-semibold">Error:</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Work Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="operator@company.com"
                required
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-slate-300">
                  Password
                </label>
                <span className="text-xs text-slate-500">Min 8 chars</span>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all font-mono"
              />
            </div>

            <button
              type="submit"
              className="w-full mt-2 py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-sm rounded-xl transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
            >
              <span>Sign In to Session</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Login selector */}
          <div className="mt-6 pt-5 border-t border-slate-800/80">
            <div className="text-xs font-medium text-slate-400 mb-2.5 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Quick Demo Accounts:</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickFill('admin@company.com')}
                className="px-2.5 py-2 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 rounded-lg text-left text-xs transition-colors cursor-pointer group"
              >
                <div className="font-medium text-slate-200 group-hover:text-emerald-400">Admin</div>
                <div className="text-[10px] text-slate-400 truncate">admin@</div>
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('sarah.manager@company.com')}
                className="px-2.5 py-2 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 rounded-lg text-left text-xs transition-colors cursor-pointer group"
              >
                <div className="font-medium text-slate-200 group-hover:text-emerald-400">Manager</div>
                <div className="text-[10px] text-slate-400 truncate">sarah@</div>
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('alex.cashier@company.com')}
                className="px-2.5 py-2 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 rounded-lg text-left text-xs transition-colors cursor-pointer group"
              >
                <div className="font-medium text-slate-200 group-hover:text-emerald-400">Cashier</div>
                <div className="text-[10px] text-slate-400 truncate">alex@</div>
              </button>
            </div>
          </div>
        </div>

        {/* Security Notice */}
        <div className="mt-6 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
          <KeyRound className="w-3.5 h-3.5 text-slate-600" />
          <span>Strict gateway enabled: No inventory or POS data exposed prior to authentication</span>
        </div>
      </div>
    </div>
  );
};
