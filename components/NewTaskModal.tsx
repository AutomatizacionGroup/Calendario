'use client';

import { useState, useEffect } from 'react';
import { X, Calendar, Clock, User, MapPin, FileText, Lock, MessageSquare, AlertTriangle } from 'lucide-react';
import { UserItem } from '@/app/dashboard/page';

export default function NewTaskModal({
  isOpen,
  onClose,
  users,
  currentUser,
  onTaskCreated,
  initialDateStr,
  initialStartTimeStr,
  initialEndTimeStr,
}: {
  isOpen: boolean;
  onClose: () => void;
  users: UserItem[];
  currentUser: UserItem | null;
  onTaskCreated: () => void;
  initialDateStr?: string;
  initialStartTimeStr?: string;
  initialEndTimeStr?: string;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [dateStr, setDateStr] = useState(new Date().toISOString().split('T')[0]);
  const [startTimeStr, setStartTimeStr] = useState('09:00');
  const [endTimeStr, setEndTimeStr] = useState('11:00');
  const [assignedToId, setAssignedToId] = useState('');
  const [isPersonal, setIsPersonal] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (initialDateStr) setDateStr(initialDateStr);
      if (initialStartTimeStr) setStartTimeStr(initialStartTimeStr);
      if (initialEndTimeStr) setEndTimeStr(initialEndTimeStr);
    }
  }, [isOpen, initialDateStr, initialStartTimeStr, initialEndTimeStr]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const startIso = `${dateStr}T${startTimeStr}:00`;
    const endIso = `${dateStr}T${endTimeStr}:00`;

    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          location,
          startTimeStr: startIso,
          endTimeStr: endIso,
          assignedToId: currentUser?.role === 'BOSS' ? assignedToId || currentUser.id : currentUser?.id,
          isPersonal,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al agendar trabajo');
      }

      onTaskCreated();
      onClose();
      // Limpiar formulario
      setTitle('');
      setDescription('');
      setLocation('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-slate-950 border-b border-slate-800 p-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-indigo-600/20 border border-indigo-500/30 rounded-xl text-indigo-400">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">
                {currentUser?.role === 'BOSS' ? 'Asignar Trabajo & Bloquear Horario' : 'Agendar Tarea Personal'}
              </h3>
              <p className="text-xs text-slate-400">El horario seleccionado quedará reservado.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-red-950/90 border border-red-800/80 rounded-xl text-xs text-red-200 flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Asignación de Usuario (Para rol Jefe) */}
          {currentUser?.role === 'BOSS' ? (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Asignar a Empleado o Contratista 3ero
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <select
                  required
                  value={assignedToId}
                  onChange={(e) => setAssignedToId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                >
                  <option value="">-- Selecciona Usuario Destino --</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.role === 'THIRD_PARTY' ? 'Contratista 3ero' : 'Empleado'}) - {u.phone}
                    </option>
                  ))}
                </select>
              </div>
              <p className="text-[11px] text-emerald-400 mt-1 flex items-center">
                <MessageSquare className="w-3 h-3 mr-1" />
                Se enviará una notificación automática por WhatsApp al asignar.
              </p>
            </div>
          ) : (
            <div className="p-3 bg-indigo-950/40 border border-indigo-900/50 rounded-xl text-xs text-indigo-300 flex items-center justify-between">
              <span>Agendando en tu calendario personal</span>
              <span className="font-bold text-white">{currentUser?.name}</span>
            </div>
          )}

          {/* Título de la tarea */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Título del Trabajo / Actividad</label>
            <input
              type="text"
              required
              placeholder="Ej. Revisión Eléctrica Edificio B"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Fecha y Horarios */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Fecha</label>
              <input
                type="date"
                required
                value={dateStr}
                onChange={(e) => setDateStr(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Hora Inicio</label>
              <input
                type="time"
                required
                value={startTimeStr}
                onChange={(e) => setStartTimeStr(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Hora Fin</label>
              <input
                type="time"
                required
                value={endTimeStr}
                onChange={(e) => setEndTimeStr(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Ubicación */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Ubicación / Lugar (Opcional)</label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Ej. Planta 1 - Sala A"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Detalles / Notas */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Detalles / Indicaciones</label>
            <textarea
              rows={3}
              placeholder="Instrucciones específicas sobre el trabajo..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="p-3 bg-amber-950/30 border border-amber-900/40 rounded-xl text-[11px] text-amber-300/90 flex items-center space-x-2">
            <Lock className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Al guardar, este rango de horario quedará bloqueado impidiendo solapamientos.</span>
          </div>

          {/* Footer buttons */}
          <div className="pt-2 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-indigo-600/30 transition-all"
            >
              {loading ? 'Verificando & Agendando...' : 'Guardar y Bloquear Horario'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
