import React, { useState } from 'react';
import { UserAccount, AuditLog } from '../types';
import {
  ShieldAlert,
  UserPlus,
  Key,
  ShieldCheck,
  CheckCircle,
  AlertCircle,
  Users,
  History,
  Lock,
} from 'lucide-react';

interface AdminViewProps {
  users: UserAccount[];
  auditLogs: AuditLog[];
  currentUserEmail: string;
  onCreateUser: (
    email: string,
    role: 'admin' | 'cashier' | 'manager'
  ) => { success: boolean; error?: string; user?: UserAccount };
}

export const AdminView: React.FC<AdminViewProps> = ({
  users,
  auditLogs,
  currentUserEmail,
  onCreateUser,
}) => {
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<'cashier' | 'manager' | 'admin'>('cashier');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );
  const [activeSubTab, setActiveSubTab] = useState<'create' | 'users' | 'audit'>('create');

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim() || !newPassword.trim()) {
      setFeedback({ type: 'error', message: 'Please provide both email and temporary password.' });
      return;
    }
    if (newPassword.length < 6) {
      setFeedback({ type: 'error', message: 'Password must be at least 6 characters long.' });
      return;
    }

    const result = onCreateUser(newEmail, newRole);
    if (result.success && result.user) {
      setFeedback({
        type: 'success',
        message: `User "${newEmail}" (${newRole}) provisioned successfully via Supabase service_role key! Email confirmation was automatically bypassed.`,
      });
      setNewEmail('');
      setNewPassword('');
    } else {
      setFeedback({
        type: 'error',
        message: result.error || 'Failed to create user.',
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
          <span>👥</span>
          <span>Admin Control Center</span>
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Supabase Service Role administrative user provisioning & system audit trail
        </p>
      </div>

      {/* Admin Subtabs */}
      <div className="border-b border-slate-800">
        <div className="flex gap-2 -mb-px">
          <button
            onClick={() => setActiveSubTab('create')}
            className={`pb-3 px-4 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'create'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>Provision User (Service Role)</span>
          </button>
          <button
            onClick={() => setActiveSubTab('users')}
            className={`pb-3 px-4 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'users'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Authorized Accounts ({users.length})</span>
          </button>
          <button
            onClick={() => setActiveSubTab('audit')}
            className={`pb-3 px-4 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'audit'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <History className="w-4 h-4" />
            <span>System Audit Trail ({auditLogs.length})</span>
          </button>
        </div>
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
          <div className="text-xs">
            <span className="font-semibold block mb-0.5">
              {feedback.type === 'success' ? 'Provisioning Confirmed' : 'Request Failed'}
            </span>
            <span>{feedback.message}</span>
          </div>
        </div>
      )}

      {/* SUBTAB 1: CREATE USER */}
      {activeSubTab === 'create' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-xl p-6 shadow-xl">
            <div className="pb-4 mb-4 border-b border-slate-800">
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-emerald-400" />
                <span>Create New User via Service Role</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Invokes <code className="text-emerald-400 font-mono">supabase_admin.auth.admin.create_user()</code> to immediately activate accounts without email confirmation.
              </p>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  New User Email Address
                </label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="e.g. employee.name@company.com"
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-medium text-slate-300">
                    Assign Initial Password
                  </label>
                  <span className="text-[11px] text-slate-500">Min 6 characters</span>
                </div>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm font-mono text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Workspace Role
                </label>
                <select
                  value={newRole}
                  onChange={(e) =>
                    setNewRole(e.target.value as 'cashier' | 'manager' | 'admin')
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 cursor-pointer"
                >
                  <option value="cashier" className="bg-slate-900">Cashier (POS & Sales)</option>
                  <option value="manager" className="bg-slate-900">Inventory Manager (Stock & Migration)</option>
                  <option value="admin" className="bg-slate-900">Administrator (Full Control)</option>
                </select>
              </div>

              <div className="pt-2 text-xs text-slate-400 bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                <span>Authorized Admin Issuer:</span>
                <span className="font-mono text-emerald-400 text-[11px]">{currentUserEmail}</span>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-sm rounded-xl transition-all shadow-lg shadow-emerald-500/20 cursor-pointer flex items-center justify-center gap-2"
              >
                <Key className="w-4 h-4" />
                <span>Create User & Bypass Confirmation</span>
              </button>
            </form>
          </div>

          <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-xl p-6 shadow-xl space-y-4">
            <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>How Supabase Service Role Works</span>
            </h3>

            <div className="text-xs text-slate-400 space-y-3 leading-relaxed">
              <p>
                In standard Supabase Auth, calling <code className="text-slate-300 font-mono">sign_up()</code> sends an email confirmation link.
              </p>
              <p className="bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono text-[11px] text-emerald-300">
                supabase_admin.auth.admin.create_user({`{`}
                <br />
                &nbsp;&nbsp;"email": new_email,
                <br />
                &nbsp;&nbsp;"password": new_password,
                <br />
                &nbsp;&nbsp;"email_confirm": True
                <br />
                {`}`})
              </p>
              <p>
                By passing <code className="text-emerald-400 font-mono">email_confirm: True</code> through the administrative client (instantiated with <code className="text-amber-400 font-mono">SUPABASE_SERVICE_KEY</code>), users are instantly verified and can sign in without waiting for an email.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 2: USERS LIST */}
      {activeSubTab === 'users' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 text-[10px] uppercase">
              <tr>
                <th className="px-4 py-3 font-semibold">User Email</th>
                <th className="px-4 py-3 font-semibold">Role</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Created At</th>
                <th className="px-4 py-3 font-semibold text-right">Last Session</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-normal">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-800/40">
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-200">{u.email}</div>
                    <div className="text-[10px] text-slate-500 font-mono">{u.id}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-slate-300 capitalize">{u.role}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-emerald-400 text-xs font-medium">Verified Active</span>
                  </td>
                  <td className="px-4 py-3 text-slate-400">
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right text-slate-400 font-mono text-[11px]">
                    {u.last_login ? new Date(u.last_login).toLocaleTimeString() : 'Never'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* SUBTAB 3: AUDIT TRAIL LOG */}
      {activeSubTab === 'audit' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <div className="text-xs font-semibold text-slate-300">
              Audit Logs (<code className="text-emerald-400">updated_by</code> & <code className="text-emerald-400">processed_by</code> tracking)
            </div>
            <span className="text-[11px] text-slate-500">Live operational ledger</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 text-[10px] uppercase">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Timestamp</th>
                  <th className="px-4 py-2.5 font-medium">Operator Email</th>
                  <th className="px-4 py-2.5 font-medium">Action</th>
                  <th className="px-4 py-2.5 font-medium">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300 text-[11px]">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/40">
                    <td className="px-4 py-2.5 text-slate-500 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </td>
                    <td className="px-4 py-2.5 text-slate-300 whitespace-nowrap">
                      {log.user_email}
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      <span className="text-slate-400 font-semibold">{log.action_type}</span>
                    </td>
                    <td className="px-4 py-2.5 font-sans text-slate-300">
                      {log.details}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
