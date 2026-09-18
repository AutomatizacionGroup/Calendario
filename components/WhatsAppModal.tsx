'use client';

import { useState, useEffect } from 'react';
import { X, MessageSquare, RefreshCw, CheckCheck, Smartphone, Send } from 'lucide-react';

interface WhatsAppLogItem {
  id: string;
  recipientPhone: string;
  recipientName: string;
  message: string;
  status: 'SIMULATED' | 'SENT' | 'FAILED';
  sentAt: string;
}

export default function WhatsAppModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [logs, setLogs] = useState<WhatsAppLogItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/whatsapp-logs');
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchLogs();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header con estilo de WhatsApp Web */}
        <div className="bg-emerald-950/80 border-b border-emerald-800/50 p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-emerald-600/30 text-emerald-400 rounded-xl border border-emerald-500/30">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Historial & Simulador de WhatsApp</h3>
              <p className="text-xs text-emerald-400">Mensajes enviados a empleados y contratistas 3eros</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={fetchLogs}
              disabled={loading}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
              title="Actualizar logs"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 overflow-y-auto flex-1 space-y-4 bg-slate-950/50">
          {logs.length === 0 ? (
            <div className="text-center py-12">
              <Smartphone className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 text-sm font-medium">Aún no hay notificaciones de WhatsApp registradas.</p>
              <p className="text-slate-600 text-xs mt-1">
                Asigna un trabajo a un empleado o contratista para que el sistema dispare un mensaje automático.
              </p>
            </div>
          ) : (
            logs.map((log) => (
              <div
                key={log.id}
                className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2 shadow-md relative"
              >
                <div className="flex items-center justify-between text-xs border-b border-slate-800/80 pb-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-emerald-400">{log.recipientName}</span>
                    <span className="text-slate-500">({log.recipientPhone})</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-slate-500">
                      {new Date(log.sentAt).toLocaleString('es-ES', {
                        dateStyle: 'short',
                        timeStyle: 'short',
                      })}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        log.status === 'SIMULATED'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : log.status === 'SENT'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-red-500/20 text-red-300 border border-red-500/30'
                      }`}
                    >
                      {log.status === 'SIMULATED' ? 'SIMULADO / ENVIADO' : log.status}
                    </span>
                  </div>
                </div>

                {/* WhatsApp Chat Bubble */}
                <div className="bg-emerald-950/30 border border-emerald-900/40 rounded-xl p-3 text-xs text-slate-200 whitespace-pre-wrap font-sans leading-relaxed">
                  {log.message}
                  <div className="mt-2 flex justify-end items-center text-emerald-400 space-x-1 text-[10px]">
                    <span>Entregado por sistema</span>
                    <CheckCheck className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer info */}
        <div className="bg-slate-900 border-t border-slate-800 p-3 text-center text-xs text-slate-500">
          💡 En modo simulación, puedes inspeccionar todos los mensajes enviados sin necesidad de saldo API.
        </div>
      </div>
    </div>
  );
}
