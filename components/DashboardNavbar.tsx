'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserSessionPayload } from '@/lib/auth';
import { Calendar, MessageSquare, LogOut, ShieldCheck, UserCheck, Wrench, Bell } from 'lucide-react';
import WhatsAppModal from './WhatsAppModal';

export default function DashboardNavbar({ user }: { user: UserSessionPayload }) {
  const router = useRouter();
  const [isWhatsAppOpen, setIsWhatsAppOpen] = useState(false);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  const getRoleBadge = () => {
    switch (user.role) {
      case 'BOSS':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            <ShieldCheck className="w-3.5 h-3.5 mr-1 text-indigo-400" /> Jefe / Admin
          </span>
        );
      case 'EMPLOYEE':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            <UserCheck className="w-3.5 h-3.5 mr-1 text-emerald-400" /> Empleado
          </span>
        );
      case 'THIRD_PARTY':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
            <Wrench className="w-3.5 h-3.5 mr-1 text-amber-400" /> Contratista 3ero
          </span>
        );
    }
  };

  return (
    <>
      <header className="bg-slate-900/80 border-b border-slate-800 sticky top-0 z-30 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Left Brand */}
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-600/30">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-white text-base leading-tight">Calendario Empresarial</h1>
              <p className="text-xs text-slate-400">Itinerarios & Notificaciones WhatsApp</p>
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center space-x-3">
            {/* WhatsApp Simulator Drawer Toggle */}
            <button
              onClick={() => setIsWhatsAppOpen(true)}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-800/50 text-emerald-300 text-xs font-medium rounded-xl transition-all"
              title="Ver notificaciones de WhatsApp simuladas o enviadas"
            >
              <MessageSquare className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">WhatsApp Logs</span>
            </button>

            {/* User Role Badge & Name */}
            <div className="hidden md:flex items-center space-x-2 pl-3 border-l border-slate-800">
              <div className="text-right">
                <p className="text-xs font-bold text-white">{user.name}</p>
                <p className="text-[11px] text-slate-400">{user.email}</p>
              </div>
              {getRoleBadge()}
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-xl transition-all"
              title="Cerrar Sesión"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Modal de Logs de WhatsApp */}
      <WhatsAppModal isOpen={isWhatsAppOpen} onClose={() => setIsWhatsAppOpen(false)} />
    </>
  );
}
