import React, { useState } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { DEMO_PERSONAS } from '../../auth/authClient';
import { getRoleBadgeMeta } from '../../auth/permissions';
import { Shield, Lock, User, AlertCircle, X, Check, Activity } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const { login, switchDemoPersona, isOfflineDemo, error, isLoading } = useAuth();
  const [username, setUsername] = useState('medic@demo.prana');
  const [password, setPassword] = useState('prana-demo-2026');
  const [localError, setLocalError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    try {
      await login(username, password);
      onClose();
    } catch (err: any) {
      setLocalError(err.message || 'Invalid credentials. Please verify your login details.');
    }
  };

  const handleQuickPersona = async (demoUsername: string) => {
    setLocalError(null);
    try {
      await switchDemoPersona(demoUsername);
      onClose();
    } catch (err: any) {
      setLocalError(err.message || 'Failed to switch demo persona.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200/90 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#091024] px-6 py-5 text-white flex items-center justify-between relative">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0E62FE] to-[#0050E6] flex items-center justify-center text-white font-black text-lg shadow-md">
              P+
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-lg tracking-tight">PRANA</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono">
                  AUTH SECURE
                </span>
              </div>
              <div className="text-xs text-slate-400 font-medium">
                Where the Journey Becomes Care
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          <div className="text-xs text-slate-600 font-medium">
            Secure access to the emergency coordination workspace. Sign in with role credentials or select a demonstration persona.
          </div>

          {/* System State Badge */}
          <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <span className="font-semibold text-slate-600">Environment Status:</span>
            <span className="flex items-center gap-1.5 font-bold font-mono text-[11px] text-cyan-700">
              <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
              {isOfflineDemo ? 'OFFLINE / LOCAL MODE' : 'LIVE SYNC ENABLED'}
            </span>
          </div>

          {(localError || error) && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Authentication Notice:</span> {localError || error}
              </div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-700 mb-1">
                Username or Email
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  placeholder="e.g. medic@demo.prana"
                  className="w-full pl-9 pr-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-[#0E62FE] focus:bg-white text-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-700 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-[#0E62FE] focus:bg-white text-slate-900"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 rounded-xl bg-[#0E62FE] hover:bg-[#0050E6] text-white text-xs font-extrabold shadow-md shadow-blue-500/25 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Activity className="w-4 h-4 animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4" />
                  <span>SIGN IN</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Persona Switcher */}
          <div className="pt-3 border-t border-slate-100">
            <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-2">
              Fast Demonstration Personas (1-Click Switch)
            </div>

            <div className="grid grid-cols-1 gap-1.5">
              {DEMO_PERSONAS.map((p) => {
                const meta = getRoleBadgeMeta(p.role);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleQuickPersona(p.username)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 hover:bg-blue-50/70 border border-slate-200/80 hover:border-blue-300 text-left transition-all cursor-pointer flex items-center justify-between group"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 group-hover:text-[#0E62FE]">
                          {p.displayName}
                        </span>
                        <span className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded border ${meta.bgClass} ${meta.textClass} ${meta.borderClass}`}>
                          {meta.shortCode}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500 truncate max-w-[280px]">
                        {p.description}
                      </div>
                    </div>
                    <Check className="w-4 h-4 text-[#0E62FE] opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
