import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function Toast({ toast, onClose }) {
  if (!toast) return null;

  const isSuccess = toast.type === 'success';
  const isError = toast.type === 'error';

  return (
    <div className="fixed bottom-5 right-5 z-50 animate-in slide-in-from-bottom-5 duration-300 flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl border backdrop-blur bg-[#0f172a]/95 text-slate-100 border-slate-700">
      {isSuccess && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
      {isError && <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />}
      {!isSuccess && !isError && <Info className="w-4 h-4 text-blue-400 shrink-0" />}

      <span className="text-xs font-medium">{toast.message}</span>

      <button
        onClick={onClose}
        className="text-slate-400 hover:text-white p-0.5 rounded transition-colors ml-2"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
