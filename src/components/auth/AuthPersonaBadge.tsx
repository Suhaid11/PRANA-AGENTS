import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { DEMO_PERSONAS } from '../../auth/authClient';
import { getRoleBadgeMeta } from '../../auth/permissions';
import { LoginModal } from './LoginModal';
import { ChevronDown, Check, LogOut, KeyRound } from 'lucide-react';

export const AuthPersonaBadge: React.FC = () => {
  const { user, role, logout, switchDemoPersona, isOfflineDemo } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  if (!user || !role) {
    return (
      <>
        <button
          onClick={() => setIsLoginModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#0E62FE] hover:bg-[#0050E6] text-white text-[11px] font-bold shadow-xs transition-all cursor-pointer"
        >
          <KeyRound className="w-3.5 h-3.5" />
          <span>SIGN IN</span>
        </button>
        <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
      </>
    );
  }

  const meta = getRoleBadgeMeta(role);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-slate-200 hover:border-slate-300 shadow-2xs transition-all cursor-pointer group text-left"
        title="Authenticated session profile & role switch"
      >
        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black border ${meta.bgClass} ${meta.textClass} ${meta.borderClass}`}>
          {meta.shortCode[0]}
        </div>

        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-extrabold text-slate-900 group-hover:text-[#0E62FE] transition-colors leading-tight">
              {user.displayName.split(' ')[0]}
            </span>
            <span className={`text-[8px] font-black uppercase px-1 py-0.2 rounded border ${meta.bgClass} ${meta.textClass} ${meta.borderClass} leading-none`}>
              {meta.shortCode}
            </span>
          </div>
        </div>

        <ChevronDown className="w-3 h-3 text-slate-400 group-hover:text-slate-700 transition-transform" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-white rounded-3xl shadow-2xl border border-slate-200/90 py-2.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="px-4 py-2 border-b border-slate-100">
            <div className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
              Authenticated Identity
            </div>
            <div className="text-xs font-black text-slate-900 mt-0.5">
              {user.displayName}
            </div>
            <div className="text-[10px] text-slate-500 font-mono">
              {user.email} · {role}
            </div>
            {isOfflineDemo && (
              <div className="mt-1 px-2 py-0.5 rounded bg-amber-50 text-amber-700 text-[9px] font-bold">
                Offline Local Mode (Simulated Identity)
              </div>
            )}
          </div>

          <div className="px-4 pt-2.5 pb-1">
            <div className="text-[9px] font-black uppercase tracking-wider text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2 leading-tight">
              <span className="block font-extrabold">DEMO PERSONA SWITCHING</span>
              <span className="font-normal text-[8.5px] text-amber-800 block mt-0.5">
                Demonstration walkthrough convenience only — not production behavior. In production, logged-in identity strictly determines role authority.
              </span>
            </div>
            <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mt-2">
              Switch Operational Persona
            </div>
          </div>


          <div className="py-1">
            {DEMO_PERSONAS.map((p) => {
              const isSelected = p.role === role;
              const pMeta = getRoleBadgeMeta(p.role);
              return (
                <button
                  key={p.id}
                  onClick={() => {
                    switchDemoPersona(p.username);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2 flex items-center justify-between transition-colors cursor-pointer ${
                    isSelected ? 'bg-blue-50/80 text-slate-900' : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded border ${pMeta.bgClass} ${pMeta.textClass} ${pMeta.borderClass}`}>
                      {pMeta.shortCode}
                    </span>
                    <div>
                      <div className="text-xs font-bold text-slate-900 leading-tight">
                        {p.displayName}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {pMeta.label}
                      </div>
                    </div>
                  </div>

                  {isSelected && (
                    <Check className="w-4 h-4 text-[#0E62FE] stroke-[2.5]" />
                  )}
                </button>
              );
            })}
          </div>

          <div className="px-3 pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
            <button
              onClick={() => {
                setIsOpen(false);
                setIsLoginModalOpen(true);
              }}
              className="text-[10px] font-bold text-[#0E62FE] hover:underline cursor-pointer"
            >
              Sign in with password
            </button>
            <button
              onClick={() => {
                setIsOpen(false);
                logout();
              }}
              className="flex items-center gap-1 text-[10px] font-bold text-rose-600 hover:text-rose-800 transition-colors cursor-pointer"
            >
              <LogOut className="w-3 h-3" />
              <span>Log out</span>
            </button>
          </div>
        </div>
      )}

      <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
    </div>
  );
};
