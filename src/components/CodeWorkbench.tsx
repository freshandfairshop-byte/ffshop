import React, { useState } from 'react';
import {
  FileCode,
  Database,
  Key,
  Terminal,
  Copy,
  Check,
  Download,
  FolderArchive,
  ExternalLink,
} from 'lucide-react';
import {
  COMPLETE_PYTHON_APP_CODE,
  SUPABASE_SQL_SCHEMA,
  SECRETS_TOML_TEMPLATE,
  GITIGNORE_CONTENT,
  REQUIREMENTS_TXT_CONTENT,
  TERMINAL_SETUP_COMMANDS,
} from '../utils/codeTemplates';
import { exportProjectZip } from '../utils/zipExporter';
import { downloadSampleExcelFile } from '../utils/excelGenerator';

export const CodeWorkbench: React.FC = () => {
  const [activeCodeTab, setActiveCodeTab] = useState<'app' | 'sql' | 'reqs' | 'secrets' | 'git'>('app');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleDownloadZip = async () => {
    setIsExporting(true);
    try {
      await exportProjectZip();
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadAppPy = () => {
    const blob = new Blob([COMPLETE_PYTHON_APP_CODE], { type: 'text/x-python;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'app.py';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadSql = () => {
    const blob = new Blob([SUPABASE_SQL_SCHEMA], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'supabase_schema.sql';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <span>💻</span>
            <span>Developer Hub & Code Workbench</span>
            <span className="text-xs font-mono bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded border border-emerald-800">
              BDT ৳
            </span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Production Streamlit <code className="text-emerald-400 font-mono">app.py</code>, PostgreSQL SQL schema, and setup manifests
          </p>
        </div>

        {/* Action Downloads */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleDownloadAppPy}
            className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-4 h-4 text-slate-950" />
            <span>Download app.py</span>
          </button>
          <button
            onClick={downloadSampleExcelFile}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-xl border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Inventory_Tracker.xlsx</span>
          </button>
          <button
            disabled={isExporting}
            onClick={handleDownloadZip}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <FolderArchive className="w-4 h-4 text-emerald-400" />
            <span>{isExporting ? 'Packaging...' : 'Export Full .zip'}</span>
          </button>
        </div>
      </div>

      {/* CLARIFICATION NOTICES */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-xl text-xs space-y-1.5">
          <div className="font-bold text-white flex items-center gap-2">
            <FileCode className="w-4 h-4 text-emerald-400" />
            <span>Where is the app.py file?</span>
          </div>
          <p className="text-slate-400 leading-relaxed">
            The full Python script is located directly in your project root at <code className="text-emerald-400 font-mono bg-slate-950 px-1 py-0.5 rounded">/app.py</code>. Run with <code className="text-cyan-400 font-mono">streamlit run app.py</code> or download via the green button above.
          </p>
        </div>

        <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-xl text-xs space-y-1.5">
          <div className="font-bold text-white flex items-center gap-2">
            <span className="text-cyan-400 font-bold">🚚</span>
            <span>Multiple Shipments of Same Item</span>
          </div>
          <p className="text-slate-400 leading-relaxed">
            <b>Calculated separately!</b> In POS sales, each delivery has its own distinct shipment transport fee in <code className="text-emerald-400 font-mono">৳ BDT</code>. When 2 batches of the same product ship separately, each order gets its own invoice.
          </p>
        </div>

        <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-xl text-xs space-y-1.5">
          <div className="font-bold text-white flex items-center gap-2">
            <span className="text-amber-400 font-bold">⚖️</span>
            <span>Shipment Cost Equal Dispersion & 5% Profit</span>
          </div>
          <p className="text-slate-400 leading-relaxed">
            <b>Equally dispersed!</b> In inventory intake, total shipment transport & handling are divided equally across all items into landed buying cost. Selling price has a <b>5% profit suggestion tab</b> (+5% markup) and can also be inserted manually.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-800">
        <div className="flex gap-2 -mb-px">
          <button
            onClick={() => setActiveCodeTab('app')}
            className={`pb-3 px-4 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeCodeTab === 'app'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileCode className="w-4 h-4" />
            <span>app.py (Streamlit + Supabase + Pandas)</span>
          </button>
          <button
            onClick={() => setActiveCodeTab('sql')}
            className={`pb-3 px-4 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeCodeTab === 'sql'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>supabase_schema.sql</span>
          </button>
          <button
            onClick={() => setActiveCodeTab('reqs')}
            className={`pb-3 px-4 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeCodeTab === 'reqs'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileCode className="w-4 h-4" />
            <span>requirements.txt</span>
          </button>
          <button
            onClick={() => setActiveCodeTab('secrets')}
            className={`pb-3 px-4 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeCodeTab === 'secrets'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Key className="w-4 h-4" />
            <span>.streamlit/secrets.toml & .gitignore</span>
          </button>
          <button
            onClick={() => setActiveCodeTab('git')}
            className={`pb-3 px-4 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeCodeTab === 'git'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal className="w-4 h-4" />
            <span>Terminal & Streamlit Cloud Setup</span>
          </button>
        </div>
      </div>

      {/* Code Display Area */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
        {/* TAB 1: app.py */}
        {activeCodeTab === 'app' && (
          <div>
            <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs">
                <span className="font-mono text-emerald-400 font-semibold">app.py</span>
                <span className="text-slate-500">·</span>
                <span className="text-slate-400">Complete, production-ready Streamlit application</span>
              </div>
              <button
                onClick={() => copyToClipboard(COMPLETE_PYTHON_APP_CODE, 'app')}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {copiedKey === 'app' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                    <span>Copy app.py</span>
                  </>
                )}
              </button>
            </div>
            <pre className="p-4 text-xs font-mono text-slate-200 overflow-x-auto max-h-[600px] leading-relaxed bg-slate-950/80">
              <code>{COMPLETE_PYTHON_APP_CODE}</code>
            </pre>
          </div>
        )}

        {/* TAB 2: SQL */}
        {activeCodeTab === 'sql' && (
          <div>
            <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs">
                <span className="font-mono text-emerald-400 font-semibold">supabase_schema.sql</span>
                <span className="text-slate-500">·</span>
                <span className="text-slate-400">Run in Supabase Dashboard SQL Editor</span>
              </div>
              <button
                onClick={() => copyToClipboard(SUPABASE_SQL_SCHEMA, 'sql')}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {copiedKey === 'sql' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                    <span>Copy SQL</span>
                  </>
                )}
              </button>
            </div>
            <pre className="p-4 text-xs font-mono text-emerald-300/90 overflow-x-auto max-h-[600px] leading-relaxed bg-slate-950/80">
              <code>{SUPABASE_SQL_SCHEMA}</code>
            </pre>
          </div>
        )}

        {/* TAB 3: requirements.txt */}
        {activeCodeTab === 'reqs' && (
          <div>
            <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs">
                <span className="font-mono text-emerald-400 font-semibold">requirements.txt</span>
                <span className="text-slate-500">·</span>
                <span className="text-slate-400">Streamlit Cloud dependency manifest (includes xlsx, pdf, doc libraries)</span>
              </div>
              <button
                onClick={() => copyToClipboard(REQUIREMENTS_TXT_CONTENT, 'reqs')}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {copiedKey === 'reqs' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                    <span>Copy requirements.txt</span>
                  </>
                )}
              </button>
            </div>
            <pre className="p-4 text-xs font-mono text-cyan-300/90 overflow-x-auto max-h-[600px] leading-relaxed bg-slate-950/80">
              <code>{REQUIREMENTS_TXT_CONTENT}</code>
            </pre>
          </div>
        )}

        {/* TAB 4: SECRETS & GITIGNORE */}
        {activeCodeTab === 'secrets' && (
          <div className="p-6 space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs font-semibold text-slate-200 font-mono">
                  .streamlit/secrets.toml
                </div>
                <button
                  onClick={() => copyToClipboard(SECRETS_TOML_TEMPLATE, 'secrets')}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-mono flex items-center gap-1 cursor-pointer"
                >
                  {copiedKey === 'secrets' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>Copy secrets.toml</span>
                </button>
              </div>
              <pre className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-amber-300/90 overflow-x-auto">
                <code>{SECRETS_TOML_TEMPLATE}</code>
              </pre>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs font-semibold text-slate-200 font-mono">
                  .gitignore (Prevent Secret Leakage)
                </div>
                <button
                  onClick={() => copyToClipboard(GITIGNORE_CONTENT, 'gitignore')}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-mono flex items-center gap-1 cursor-pointer"
                >
                  {copiedKey === 'gitignore' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>Copy .gitignore</span>
                </button>
              </div>
              <pre className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-300 overflow-x-auto">
                <code>{GITIGNORE_CONTENT}</code>
              </pre>
            </div>
          </div>
        )}

        {/* TAB 4: TERMINAL COMMANDS & STREAMLIT CLOUD */}
        {activeCodeTab === 'git' && (
          <div className="p-6 space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs font-semibold text-slate-200 font-mono">
                  Terminal Setup & Git Commands
                </div>
                <button
                  onClick={() => copyToClipboard(TERMINAL_SETUP_COMMANDS, 'terminal')}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-mono flex items-center gap-1 cursor-pointer"
                >
                  {copiedKey === 'terminal' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>Copy Shell Commands</span>
                </button>
              </div>
              <pre className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-cyan-300/90 overflow-x-auto">
                <code>{TERMINAL_SETUP_COMMANDS}</code>
              </pre>
            </div>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
              <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <ExternalLink className="w-4 h-4 text-emerald-400" />
                <span>Streamlit Community Cloud Deployment Guide</span>
              </h3>
              <ol className="text-xs text-slate-400 space-y-2 list-decimal list-inside leading-relaxed">
                <li>
                  Push your repository to GitHub:
                  <code className="block bg-slate-900 p-2 rounded mt-1 font-mono text-slate-300">
                    git add . && git commit -m "Deploy inventory app" && git push origin main
                  </code>
                </li>
                <li>
                  Navigate to <strong className="text-white">share.streamlit.io</strong> and click <strong className="text-white">"New app"</strong>.
                </li>
                <li>
                  Select your repository, branch (<code className="text-slate-300">main</code>), and main file path (<code className="text-slate-300">app.py</code>).
                </li>
                <li>
                  <strong>CRITICAL:</strong> Click <strong className="text-emerald-400">"Advanced settings..."</strong>, open the <strong className="text-emerald-400">"Secrets"</strong> tab, and paste the exact contents of your <code className="text-slate-300">.streamlit/secrets.toml</code>.
                </li>
                <li>
                  Click <strong className="text-white">"Deploy"</strong>. Your multi-user inventory and POS system is live with free internet access!
                </li>
              </ol>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
