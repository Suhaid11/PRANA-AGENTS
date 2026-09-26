import React from 'react';
import { useAuth } from '../../auth/AuthContext';
import { ShieldAlert, X, ArrowRight } from 'lucide-react';

export const UnauthorizedAlert: React.FC = () => {
  const { unauthorizedNotice, clearUnauthorizedNotice, switchDemoPersona } = useAuth();

  if (!unauthorizedNotice) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-md bg-white border border-rose-200 rounded-2xl shadow-2xl p-4 animate-in slide-in-from-bottom-3 duration-200">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center shrink-0 text-rose-600">
          <ShieldAlert className="w-5 h-5" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black tracking-tight text-rose-950 uppercase font-mono">
              ACTION NOT AUTHORIZED
            </span>
            <button
              onClick={clearUnauthorizedNotice}
              className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              aria-label="Dismiss"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="text-xs font-semibold text-slate-700 mt-1">
            {unauthorizedNotice.message}
          </div>

          <div className="text-[11px] text-slate-500 mt-0.5">
            Attempted action: <span className="font-mono font-bold text-slate-700">{unauthorizedNotice.action}</span>
          </div>

          {unauthorizedNotice.requiredRole && (
            <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[10px] text-slate-500">
                Requires: <strong className="text-slate-700">{unauthorizedNotice.requiredRole}</strong>
              </span>
              <button
                onClick={() => {
                  switchDemoPersona(unauthorizedNotice.requiredRole!);
                  clearUnauthorizedNotice();
                }}
                className="text-[10px] font-extrabold text-[#0E62FE] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Switch to authorized persona</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
