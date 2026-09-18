'use client';

import { useState } from 'react';
import {
  X,
  Calendar,
  Clock,
  User,
  MapPin,
  FileText,
  Lock,
  MessageSquare,
  Trash2,
  CheckCircle,
  Play,
  RotateCcw,
  ExternalLink,
  ShieldCheck,
  Phone,
  AlertTriangle,
} from 'lucide-react';
import { TaskItem, UserItem } from '@/app/dashboard/page';

export default function TaskDetailModal({
  task,
  onClose,
  currentUser,
  onTaskUpdated,
}: {
  task: TaskItem | null;
  onClose: () => void;
  currentUser: UserItem | null;
  onTaskUpdated: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!task) return null;

  const handleUpdateStatus = async (newStatus: TaskItem['status']) => {
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al actualizar el estado');
      }

      onTaskUpdated();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const confirmDeleteTask = async () => {
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al eliminar el trabajo');
      }

      setShowDeleteConfirm(false);
      onTaskUpdated();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const cleanPhone = task.assignedTo?.phone?.replace(/\D/g, '');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      {/* Modal de Confirmación de Eliminación personalizado con el estilo de la app */}
      {showDeleteConfirm ? (
        <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl shadow-2xl p-6 text-center space-y-4 animate-scaleUp">
          <div className="w-12 h-12 bg-red-950/80 border border-red-800/60 text-red-400 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-red-950/50">
            <AlertTriangle className="w-6 h-6" />
          </div>

          <div className="space-y-1">
            <h3 className="font-extrabold text-white text-lg">¿Eliminar este trabajo?</h3>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              ¿Estás seguro de eliminar <strong className="text-slate-200">{task.title}</strong>? El horario agendado se liberará automáticamente en el itinerario.
            </p>
          </div>

          {error && (
            <div className="p-2.5 bg-red-950/90 border border-red-800/80 rounded-xl text-xs text-red-200">
              {error}
            </div>
          )}

          <div className="pt-3 flex items-center justify-center space-x-3">
            <button
              onClick={() => setShowDeleteConfirm(false)}
              disabled={loading}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-all"
            >
              Cancelar
            </button>

            <button
              onClick={confirmDeleteTask}
              disabled={loading}
              className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-red-600/30 transition-all flex items-center space-x-1.5"
            >
              <Trash2 className="w-4 h-4" />
              <span>{loading ? 'Eliminando...' : 'Sí, Eliminar Trabajo'}</span>
            </button>
          </div>
        </div>
      ) : (
        /* Modal Normal de Detalle */
        <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-slate-950 border-b border-slate-800 p-4 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-indigo-600/20 border border-indigo-500/30 rounded-xl text-indigo-400">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">Detalles del Trabajo Agendado</h3>
                <p className="text-xs text-slate-400">ID: {task.id.slice(0, 8)}...</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
            {error && (
              <div className="p-3 bg-red-950/90 border border-red-800/80 rounded-xl text-xs text-red-200">
                {error}
              </div>
            )}

            {/* Title & Status */}
            <div className="flex items-start justify-between">
              <h2 className="text-lg font-extrabold text-white">{task.title}</h2>
              <span
                className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                  task.status === 'COMPLETED'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : task.status === 'IN_PROGRESS'
                    ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                    : task.status === 'CANCELLED'
                    ? 'bg-slate-500/20 text-slate-400 border border-slate-500/30'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}
              >
                {task.status === 'PENDING' && 'PENDIENTE'}
                {task.status === 'IN_PROGRESS' && 'EN PROCESO'}
                {task.status === 'COMPLETED' && 'COMPLETADO'}
                {task.status === 'CANCELLED' && 'CANCELADO / LIBERADO'}
              </span>
            </div>

            {/* User assigned info & Direct WhatsApp Link */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4 text-emerald-400" />
                  <div>
                    <p className="text-xs font-bold text-white">{task.assignedTo?.name}</p>
                    <p className="text-[11px] text-slate-400">
                      {task.assignedTo?.role === 'THIRD_PARTY' ? 'Contratista 3ero' : 'Empleado Interno'}
                    </p>
                  </div>
                </div>

                {cleanPhone && (
                  <a
                    href={`https://wa.me/${cleanPhone}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-1 px-2.5 py-1 bg-emerald-950 border border-emerald-800 text-emerald-300 rounded-lg text-xs font-medium hover:bg-emerald-900 transition-all"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Abrir WhatsApp</span>
                    <ExternalLink className="w-3 h-3 ml-0.5" />
                  </a>
                )}
              </div>
            </div>

            {/* Time & Schedule Lock */}
            <div className="space-y-2 text-xs">
              <div className="flex items-center text-slate-300 bg-slate-950 p-3 border border-slate-800 rounded-xl">
                <Clock className="w-4 h-4 mr-2 text-indigo-400 shrink-0" />
                <div>
                  <span className="font-semibold block text-white">Horario Agendado:</span>
                  <span>
                    {new Date(task.startTime).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                  <span className="block font-mono text-indigo-300 text-[11px] mt-0.5">
                    {new Date(task.startTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })} - {new Date(task.endTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>

              {task.location && (
                <div className="flex items-center text-slate-300 bg-slate-950 p-3 border border-slate-800 rounded-xl">
                  <MapPin className="w-4 h-4 mr-2 text-amber-400 shrink-0" />
                  <div>
                    <span className="font-semibold block text-white">Ubicación:</span>
                    <span>{task.location}</span>
                  </div>
                </div>
              )}

              {task.description && (
                <div className="bg-slate-950 p-3 border border-slate-800 rounded-xl space-y-1">
                  <span className="font-semibold text-slate-300 block">Detalles & Instrucciones:</span>
                  <p className="text-slate-400 whitespace-pre-wrap">{task.description}</p>
                </div>
              )}
            </div>

            {/* Quick Actions to update status */}
            <div className="pt-2 border-t border-slate-800 space-y-2">
              <p className="text-xs font-semibold text-slate-400">Actualizar Estado del Trabajo:</p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleUpdateStatus('IN_PROGRESS')}
                  disabled={loading || task.status === 'IN_PROGRESS'}
                  className="flex items-center space-x-1 px-3 py-1.5 bg-blue-950 hover:bg-blue-900 border border-blue-800 text-blue-200 text-xs font-semibold rounded-xl transition-all disabled:opacity-50"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Marcar En Proceso</span>
                </button>

                <button
                  onClick={() => handleUpdateStatus('COMPLETED')}
                  disabled={loading || task.status === 'COMPLETED'}
                  className="flex items-center space-x-1 px-3 py-1.5 bg-emerald-950 hover:bg-emerald-900 border border-emerald-800 text-emerald-200 text-xs font-semibold rounded-xl transition-all disabled:opacity-50"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Marcar Completado</span>
                </button>

                <button
                  onClick={() => handleUpdateStatus('CANCELLED')}
                  disabled={loading || task.status === 'CANCELLED'}
                  className="flex items-center space-x-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-all disabled:opacity-50"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Cancelar / Liberar Horario</span>
                </button>
              </div>
            </div>

            {/* Footer Delete Button */}
            <div className="pt-4 flex items-center justify-between border-t border-slate-800">
              <button
                onClick={() => setShowDeleteConfirm(true)}
                disabled={loading}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-red-950/60 hover:bg-red-900/80 border border-red-800/60 text-red-300 text-xs font-semibold rounded-xl transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Eliminar Trabajo</span>
              </button>

              <button
                onClick={onClose}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-all"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
