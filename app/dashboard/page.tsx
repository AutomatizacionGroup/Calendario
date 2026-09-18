'use client';

import { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  Plus,
  Filter,
  User,
  Clock,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Lock,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Edit,
  Trash2,
  Sparkles,
  Info,
  CalendarDays,
  Layers,
} from 'lucide-react';
import NewTaskModal from '@/components/NewTaskModal';
import TaskDetailModal from '@/components/TaskDetailModal';

export interface UserItem {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'BOSS' | 'EMPLOYEE' | 'THIRD_PARTY';
}

export interface TaskItem {
  id: string;
  title: string;
  description?: string | null;
  location?: string | null;
  startTime: string;
  endTime: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  isPersonal: boolean;
  assignedToId: string;
  assignedTo: UserItem;
  createdById: string;
  createdBy: UserItem;
}

export default function DashboardPage() {
  const [currentUser, setCurrentUser] = useState<UserItem | null>(null);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & State
  const [selectedUserFilter, setSelectedUserFilter] = useState<string>('');
  const [viewMode, setViewMode] = useState<'DAY' | 'WEEK' | 'MONTH' | 'AGENDA'>('WEEK');
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [now, setNow] = useState<Date>(new Date());

  // Drag selection state for Google Calendar style drag-to-create
  const [dragState, setDragState] = useState<{
    isDragging: boolean;
    day?: Date;
    startHour?: number;
    currentHour?: number;
  } | null>(null);

  // Modals & Prefills
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);
  const [newTaskDefaults, setNewTaskDefaults] = useState<{
    dateStr?: string;
    startTimeStr?: string;
    endTimeStr?: string;
  }>({});

  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);

  // Update current time indicator every minute
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Fetch Current User
  const fetchMe = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data.user);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Fetch Users List
  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Fetch Tasks
  const fetchTasks = async () => {
    setLoading(true);
    try {
      let url = `/api/tasks`;
      if (selectedUserFilter) {
        url += `?userId=${selectedUserFilter}`;
      }
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setTasks(data.tasks || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMe();
    fetchUsers();
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [selectedUserFilter]);

  // Date Navigation
  const handlePrevDate = () => {
    const newD = new Date(currentDate);
    if (viewMode === 'DAY') newD.setDate(newD.getDate() - 1);
    else if (viewMode === 'WEEK') newD.setDate(newD.getDate() - 7);
    else if (viewMode === 'MONTH') newD.setMonth(newD.getMonth() - 1);
    else newD.setDate(newD.getDate() - 1);
    setCurrentDate(newD);
  };

  const handleNextDate = () => {
    const newD = new Date(currentDate);
    if (viewMode === 'DAY') newD.setDate(newD.getDate() + 1);
    else if (viewMode === 'WEEK') newD.setDate(newD.getDate() + 7);
    else if (viewMode === 'MONTH') newD.setMonth(newD.getMonth() + 1);
    else newD.setDate(newD.getDate() + 1);
    setCurrentDate(newD);
  };

  const handleToday = () => setCurrentDate(new Date());

  // Date helpers for Week view
  const getStartOfWeek = (d: Date) => {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // lunes inicio
    return new Date(date.setDate(diff));
  };

  const startOfWeek = getStartOfWeek(currentDate);
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startOfWeek);
    d.setDate(d.getDate() + i);
    return d;
  });

  const hours = Array.from({ length: 13 }, (_, i) => i + 8); // 8:00 AM a 8:00 PM (13 marcas)
  const ROW_HEIGHT = 80;

  // Handle cell click to open NewTaskModal pre-filled
  const handleCellClick = (day: Date, hour: number = 9) => {
    const yyyy = day.getFullYear();
    const mm = String(day.getMonth() + 1).padStart(2, '0');
    const dd = String(day.getDate()).padStart(2, '0');
    const dateFormatted = `${yyyy}-${mm}-${dd}`;

    const startH = hour < 10 ? `0${hour}:00` : `${hour}:00`;
    const nextHour = hour + 2 > 20 ? 20 : hour + 2;
    const endH = nextHour < 10 ? `0${nextHour}:00` : `${nextHour}:00`;

    setNewTaskDefaults({
      dateStr: dateFormatted,
      startTimeStr: startH,
      endTimeStr: endH,
    });
    setIsNewTaskOpen(true);
  };

  // Drag to select time range handlers
  const handleMouseDownCell = (day: Date, hour: number) => {
    setDragState({
      isDragging: true,
      day,
      startHour: hour,
      currentHour: hour,
    });
  };

  const handleMouseEnterCell = (hour: number) => {
    if (dragState && dragState.isDragging) {
      setDragState((prev) => (prev ? { ...prev, currentHour: hour } : null));
    }
  };

  const handleMouseUpCell = () => {
    if (dragState && dragState.isDragging && dragState.day && dragState.startHour !== undefined) {
      const day = dragState.day;
      const startH = Math.min(dragState.startHour, dragState.currentHour ?? dragState.startHour);
      const endH = Math.max(dragState.startHour, dragState.currentHour ?? dragState.startHour) + 1;

      const yyyy = day.getFullYear();
      const mm = String(day.getMonth() + 1).padStart(2, '0');
      const dd = String(day.getDate()).padStart(2, '0');

      const formattedStart = startH < 10 ? `0${startH}:00` : `${startH}:00`;
      const formattedEnd = endH < 10 ? `0${endH}:00` : `${endH}:00`;

      setNewTaskDefaults({
        dateStr: `${yyyy}-${mm}-${dd}`,
        startTimeStr: formattedStart,
        endTimeStr: formattedEnd,
      });
      setIsNewTaskOpen(true);
    }
    setDragState(null);
  };

  const handleOpenNewTaskGeneric = () => {
    const yyyy = currentDate.getFullYear();
    const mm = String(currentDate.getMonth() + 1).padStart(2, '0');
    const dd = String(currentDate.getDate()).padStart(2, '0');
    setNewTaskDefaults({
      dateStr: `${yyyy}-${mm}-${dd}`,
      startTimeStr: '09:00',
      endTimeStr: '11:00',
    });
    setIsNewTaskOpen(true);
  };

  // Month View Days calculation
  const getMonthDays = (d: Date) => {
    const year = d.getFullYear();
    const month = d.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const dayOfWeek = firstDayOfMonth.getDay();
    const startOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // lunes inicio
    const startDate = new Date(firstDayOfMonth);
    startDate.setDate(startDate.getDate() - startOffset);

    return Array.from({ length: 35 }, (_, i) => {
      const day = new Date(startDate);
      day.setDate(day.getDate() + i);
      return day;
    });
  };

  const monthDays = getMonthDays(currentDate);

  const getStatusBadge = (status: TaskItem['status']) => {
    switch (status) {
      case 'PENDING':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">Pendiente</span>;
      case 'IN_PROGRESS':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30 animate-pulse">En Proceso</span>;
      case 'COMPLETED':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">Completado</span>;
      case 'CANCELLED':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-500/20 text-slate-400 border border-slate-500/30">Cancelado</span>;
    }
  };

  // Current Red Line Indicator Position
  const nowHour = now.getHours() + now.getMinutes() / 60;
  const showRedLine = nowHour >= 8 && nowHour <= 20;
  const redLineTopPx = (nowHour - 8) * ROW_HEIGHT;

  // Helper for multi-worker side-by-side positioning when tasks overlap on the same day
  const getTaskColumnLayout = (task: TaskItem, dayTasks: TaskItem[]) => {
    const taskStart = new Date(task.startTime).getTime();
    const taskEnd = new Date(task.endTime).getTime();

    // Find all tasks that overlap with this task
    const overlaps = dayTasks.filter((t) => {
      const s = new Date(t.startTime).getTime();
      const e = new Date(t.endTime).getTime();
      return s < taskEnd && e > taskStart;
    });

    // Sort overlaps deterministically
    overlaps.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime() || a.id.localeCompare(b.id));

    const totalCols = overlaps.length;
    const colIndex = overlaps.findIndex((t) => t.id === task.id);

    const widthPercent = 100 / totalCols;
    const leftPercent = colIndex * widthPercent;

    return {
      left: `${leftPercent}%`,
      width: `calc(${widthPercent}% - 2px)`,
    };
  };

  return (
    <div className="space-y-5" onMouseUp={handleMouseUpCell}>
      {/* Top Controls Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-600/30">
            <CalendarIcon className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <span>{currentUser?.role === 'BOSS' ? 'Itinerarios & Agendamiento' : 'Mi Agenda Personal'}</span>
              <span className="text-xs font-normal text-slate-400 bg-slate-800 px-2.5 py-0.5 rounded-full border border-slate-700">
                Estilo Google Calendar
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Si un trabajador tiene su horario ocupado, puedes asignar otro trabajo en esa misma hora a un trabajador distinto.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Boss User Filter */}
          {currentUser?.role === 'BOSS' && (
            <div className="flex items-center space-x-2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300">
              <Filter className="w-4 h-4 text-indigo-400" />
              <select
                value={selectedUserFilter}
                onChange={(e) => setSelectedUserFilter(e.target.value)}
                className="bg-transparent border-none text-slate-200 focus:outline-none cursor-pointer"
              >
                <option value="">Todos los Usuarios / 3eros</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.role === 'THIRD_PARTY' ? 'Contratista 3ero' : 'Empleado'})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Action Button: Agendar Tarea */}
          <button
            onClick={handleOpenNewTaskGeneric}
            className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl shadow-lg shadow-indigo-600/30 text-xs transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>{currentUser?.role === 'BOSS' ? 'Asignar Trabajo / Bloquear' : 'Agendar Tarea'}</span>
          </button>
        </div>
      </div>

      {/* Main Container Layout: Sidebar Mini Calendar + Main View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Sidebar: Mini Calendar & Quick Stats */}
        <div className="lg:col-span-3 space-y-4">
          {/* Mini Month Calendar */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-slate-200 pb-2 border-b border-slate-800">
              <span className="capitalize">
                {currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
              </span>
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => {
                    const d = new Date(currentDate);
                    d.setMonth(d.getMonth() - 1);
                    setCurrentDate(d);
                  }}
                  className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => {
                    const d = new Date(currentDate);
                    d.setMonth(d.getMonth() + 1);
                    setCurrentDate(d);
                  }}
                  className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Grid days header */}
            <div className="grid grid-cols-7 text-[10px] font-bold text-slate-500 text-center">
              <span>L</span><span>M</span><span>M</span><span>J</span><span>V</span><span>S</span><span>D</span>
            </div>

            {/* Grid mini dates */}
            <div className="grid grid-cols-7 gap-1 text-xs text-center">
              {monthDays.map((day, idx) => {
                const isSelected = day.toDateString() === currentDate.toDateString();
                const isToday = day.toDateString() === new Date().toDateString();
                const isCurrentMonth = day.getMonth() === currentDate.getMonth();

                return (
                  <button
                    key={idx}
                    onClick={() => {
                      setCurrentDate(day);
                      if (viewMode === 'MONTH') setViewMode('WEEK');
                    }}
                    className={`py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                      isSelected
                        ? 'bg-indigo-600 text-white font-bold shadow'
                        : isToday
                        ? 'bg-indigo-950 text-indigo-400 border border-indigo-700/60 font-bold'
                        : isCurrentMonth
                        ? 'text-slate-300 hover:bg-slate-800'
                        : 'text-slate-600 hover:bg-slate-800/50'
                    }`}
                  >
                    {day.getDate()}
                  </button>
                );
              })}
            </div>
          </div>

          {/* User Legend */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-2.5">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Leyenda de Colores</h4>
            <div className="space-y-2 text-xs">
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full bg-indigo-500 shadow-sm" />
                <span className="text-slate-300">Asignaciones a Empleados</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full bg-amber-500 shadow-sm" />
                <span className="text-slate-300">Contratistas 3eros (Subcontratos)</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full bg-purple-500 shadow-sm" />
                <span className="text-slate-300">Eventos Personales</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-sm" />
                <span className="text-slate-300">Trabajos Completados</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Main View: Day / Week / Month / Agenda */}
        <div className="lg:col-span-9 space-y-4">
          {/* View Switcher & Navigation Header */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/80 border border-slate-800 rounded-2xl p-3 shadow-xl">
            <div className="flex items-center space-x-2">
              <button
                onClick={handlePrevDate}
                className="p-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleToday}
                className="px-3 py-1.5 bg-indigo-950 hover:bg-indigo-900 text-indigo-300 border border-indigo-800/60 text-xs font-bold rounded-xl transition-all"
              >
                Hoy
              </button>
              <button
                onClick={handleNextDate}
                className="p-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <span className="text-sm font-extrabold text-white pl-2 capitalize">
                {viewMode === 'DAY'
                  ? currentDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
                  : currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
              </span>
            </div>

            {/* View Tabs */}
            <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
              <button
                onClick={() => setViewMode('DAY')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  viewMode === 'DAY' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Día
              </button>
              <button
                onClick={() => setViewMode('WEEK')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  viewMode === 'WEEK' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Semana
              </button>
              <button
                onClick={() => setViewMode('MONTH')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  viewMode === 'MONTH' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Mes
              </button>
              <button
                onClick={() => setViewMode('AGENDA')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  viewMode === 'AGENDA' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Itinerario
              </button>
            </div>
          </div>

          {/* Loading Indicator */}
          {loading ? (
            <div className="text-center py-24 bg-slate-900 border border-slate-800 rounded-2xl">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mb-3" />
              <p className="text-sm text-slate-400">Cargando itinerarios y verificando bloqueos de horario...</p>
            </div>
          ) : viewMode === 'WEEK' ? (
            /* VISTA SEMANAL CON SOPORTE PARA MÚLTIPLES TRABAJADORES EN EL MISMO HORARIO */
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              {/* Header Días */}
              <div className="grid grid-cols-8 border-b border-slate-800 bg-slate-950/90 text-xs font-bold text-slate-400 text-center py-3">
                <div className="text-slate-500 flex items-center justify-center">
                  <Clock className="w-3.5 h-3.5 mr-1" /> Hora
                </div>
                {weekDays.map((day, idx) => {
                  const isToday = day.toDateString() === new Date().toDateString();
                  return (
                    <div
                      key={idx}
                      onClick={() => {
                        setCurrentDate(day);
                        setViewMode('DAY');
                      }}
                      className={`space-y-0.5 cursor-pointer hover:bg-indigo-950/40 py-1 rounded-xl transition-all group ${
                        isToday ? 'text-indigo-400 font-extrabold' : ''
                      }`}
                      title="Ver este día en detalle"
                    >
                      <p className="group-hover:text-indigo-300 transition-colors">
                        {day.toLocaleDateString('es-ES', { weekday: 'short' }).toUpperCase()}
                      </p>
                      <p
                        className={`text-base ${
                          isToday
                            ? 'bg-indigo-600 text-white rounded-full w-7 h-7 mx-auto flex items-center justify-center shadow-lg shadow-indigo-600/40'
                            : 'text-slate-200 group-hover:text-white'
                        }`}
                      >
                        {day.getDate()}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Grid interactivo */}
              <div className="max-h-[680px] overflow-y-auto relative select-none">
                <div className="grid grid-cols-8 relative" style={{ height: `${(hours.length - 1) * ROW_HEIGHT}px` }}>
                  {/* Columna de Horas */}
                  <div className="border-r border-slate-800 bg-slate-950/40 divide-y divide-slate-800/60">
                    {hours.slice(0, -1).map((hour) => (
                      <div
                        key={hour}
                        style={{ height: `${ROW_HEIGHT}px` }}
                        className="text-[11px] text-slate-500 font-semibold flex items-start justify-center pt-2 border-b border-slate-800/60"
                      >
                        {hour < 10 ? `0${hour}:00` : `${hour}:00`}
                      </div>
                    ))}
                  </div>

                  {/* 7 Columnas para Días */}
                  {weekDays.map((day, dayIdx) => {
                    const dayStr = day.toDateString();
                    const isToday = dayStr === new Date().toDateString();

                    const dayTasks = tasks.filter((t) => {
                      if (t.status === 'CANCELLED') return false;
                      const tDate = new Date(t.startTime).toDateString();
                      return tDate === dayStr;
                    });

                    return (
                      <div
                        key={dayIdx}
                        className="border-r border-slate-800/40 relative hover:bg-indigo-950/10 transition-colors"
                      >
                        {/* Indicador de Hora Actual (Línea Roja Estilo Google Calendar) */}
                        {isToday && showRedLine && (
                          <div
                            style={{ top: `${redLineTopPx}px` }}
                            className="absolute left-0 right-0 z-30 flex items-center border-t-2 border-red-500 pointer-events-none"
                          >
                            <div className="w-2.5 h-2.5 bg-red-500 rounded-full -ml-1.5 -mt-[1px] animate-ping" />
                            <div className="w-2.5 h-2.5 bg-red-500 rounded-full -ml-2.5 -mt-[1px] shadow-lg shadow-red-500/80" />
                          </div>
                        )}

                        {/* Celdas Clickeables / Arrastrables */}
                        {hours.slice(0, -1).map((hour) => {
                          const isBeingDragged =
                            dragState?.isDragging &&
                            dragState.day?.toDateString() === dayStr &&
                            hour >= Math.min(dragState.startHour!, dragState.currentHour ?? dragState.startHour!) &&
                            hour <= Math.max(dragState.startHour!, dragState.currentHour ?? dragState.startHour!);

                          return (
                            <div
                              key={hour}
                              onMouseDown={() => handleMouseDownCell(day, hour)}
                              onMouseEnter={() => handleMouseEnterCell(hour)}
                              style={{ height: `${ROW_HEIGHT}px` }}
                              className={`border-b border-slate-800/40 cursor-pointer transition-all group flex items-start justify-end p-1 ${
                                isBeingDragged
                                  ? 'bg-indigo-600/30 border-indigo-500'
                                  : 'hover:bg-indigo-900/20'
                              }`}
                            >
                              <span className="opacity-0 group-hover:opacity-100 text-[10px] font-semibold text-indigo-400 bg-indigo-950/90 px-1.5 py-0.5 rounded border border-indigo-800/50">
                                + Agendar {hour}:00
                              </span>
                            </div>
                          );
                        })}

                        {/* BLOQUES UNIFICADOS DE TAREAS (DISPOSICIÓN EN PARALELO SI HAY MÚLTIPLES TRABAJADORES EN EL MISMO HORARIO) */}
                        {dayTasks.map((t) => {
                          const start = new Date(t.startTime);
                          const end = new Date(t.endTime);

                          const startHourFloat = start.getHours() + start.getMinutes() / 60;
                          const endHourFloat = end.getHours() + end.getMinutes() / 60;

                          const clampedStart = Math.max(8, Math.min(20, startHourFloat));
                          const clampedEnd = Math.max(8, Math.min(20, endHourFloat));

                          const topPx = (clampedStart - 8) * ROW_HEIGHT;
                          const heightPx = Math.max(45, (clampedEnd - clampedStart) * ROW_HEIGHT);

                          // Calcular posicionamiento horizontal en paralelo para múltiples trabajadores a la misma hora
                          const layout = getTaskColumnLayout(t, dayTasks);

                          return (
                            <div
                              key={t.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedTask(t);
                              }}
                              style={{
                                top: `${topPx}px`,
                                height: `${heightPx}px`,
                                left: layout.left,
                                width: layout.width,
                              }}
                              className={`absolute p-2 rounded-xl border text-xs cursor-pointer shadow-lg transition-all hover:scale-[1.02] hover:z-20 flex flex-col justify-between overflow-hidden ${
                                t.status === 'COMPLETED'
                                  ? 'bg-emerald-950/90 border-emerald-600/80 text-emerald-100 hover:bg-emerald-900'
                                  : t.assignedTo?.role === 'THIRD_PARTY'
                                  ? 'bg-amber-950/90 border-amber-600/80 text-amber-100 hover:bg-amber-900'
                                  : t.isPersonal
                                  ? 'bg-purple-950/90 border-purple-600/80 text-purple-100 hover:bg-purple-900'
                                  : 'bg-indigo-950/90 border-indigo-600/80 text-indigo-100 hover:bg-indigo-900'
                              }`}
                            >
                              <div>
                                <div className="flex items-start justify-between font-bold text-[11px] mb-1 leading-tight">
                                  <span className="truncate pr-1">{t.title}</span>
                                  <Lock className="w-3 h-3 text-red-400 shrink-0 mt-0.5" title="Horario Bloqueado para este trabajador" />
                                </div>

                                <div className="text-[10px] text-slate-200 flex items-center space-x-1 mb-1 font-semibold">
                                  <User className="w-3 h-3 text-slate-300 shrink-0" />
                                  <span className="truncate">{t.assignedTo?.name}</span>
                                </div>
                              </div>

                              <div className="pt-1 border-t border-slate-700/60 flex items-center justify-between text-[9px] text-slate-300 font-mono">
                                <span>
                                  {start.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })} - {end.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                                {getStatusBadge(t.status)}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : viewMode === 'DAY' ? (
            /* VISTA DÍA DETALLADA */
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-white text-base capitalize">
                    {currentDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                  </h3>
                  <p className="text-xs text-slate-400">Itinerario detallado del día seleccionado</p>
                </div>
                <button
                  onClick={handleOpenNewTaskGeneric}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl"
                >
                  + Agendar en este día
                </button>
              </div>

              <div className="max-h-[650px] overflow-y-auto relative divide-y divide-slate-800/60">
                {hours.slice(0, -1).map((hour) => {
                  const dayStr = currentDate.toDateString();
                  const hourTasks = tasks.filter((t) => {
                    if (t.status === 'CANCELLED') return false;
                    const start = new Date(t.startTime);
                    return start.toDateString() === dayStr && start.getHours() === hour;
                  });

                  return (
                    <div
                      key={hour}
                      onClick={() => handleCellClick(currentDate, hour)}
                      className="flex min-h-[80px] hover:bg-indigo-950/20 cursor-pointer transition-colors group"
                    >
                      <div className="w-24 border-r border-slate-800 bg-slate-950/40 p-2 text-xs text-slate-500 font-semibold flex items-start justify-center">
                        {hour < 10 ? `0${hour}:00` : `${hour}:00`}
                      </div>
                      <div className="flex-1 p-2 space-y-2 relative">
                        {hourTasks.map((t) => (
                          <div
                            key={t.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedTask(t);
                            }}
                            className="p-3 rounded-xl border bg-indigo-950/80 border-indigo-700/60 text-indigo-100 flex items-center justify-between cursor-pointer hover:bg-indigo-900 shadow-md"
                          >
                            <div className="space-y-1">
                              <h4 className="font-bold text-sm text-white">{t.title}</h4>
                              <p className="text-xs text-slate-300">
                                Asignado a: <strong>{t.assignedTo?.name}</strong> ({t.assignedTo?.phone})
                              </p>
                            </div>
                            <div className="text-right space-y-1">
                              <span className="text-xs font-mono text-indigo-300 block">
                                {new Date(t.startTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })} - {new Date(t.endTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              {getStatusBadge(t.status)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : viewMode === 'MONTH' ? (
            /* VISTA MES COMPLETO CON PILLS DE TAREAS */
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="grid grid-cols-7 border-b border-slate-800 bg-slate-950/90 text-xs font-bold text-slate-400 text-center py-3">
                <span>LUN</span><span>MAR</span><span>MIÉ</span><span>JUE</span><span>VIE</span><span>SÁB</span><span>DOM</span>
              </div>

              <div className="grid grid-cols-7 divide-x divide-y divide-slate-800/60 min-h-[600px]">
                {monthDays.map((day, idx) => {
                  const dayStr = day.toDateString();
                  const isCurrentMonth = day.getMonth() === currentDate.getMonth();
                  const isToday = dayStr === new Date().toDateString();

                  const dayTasks = tasks.filter((t) => {
                    if (t.status === 'CANCELLED') return false;
                    return new Date(t.startTime).toDateString() === dayStr;
                  });

                  return (
                    <div
                      key={idx}
                      onClick={() => handleCellClick(day, 9)}
                      className={`min-h-[110px] p-1.5 cursor-pointer transition-all hover:bg-indigo-950/20 flex flex-col justify-between ${
                        !isCurrentMonth ? 'bg-slate-950/50 text-slate-600' : 'text-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${
                            isToday ? 'bg-indigo-600 text-white' : 'text-slate-400'
                          }`}
                        >
                          {day.getDate()}
                        </span>
                        {dayTasks.length > 0 && (
                          <span className="text-[10px] font-semibold text-slate-500">
                            {dayTasks.length} trabajo(s)
                          </span>
                        )}
                      </div>

                      <div className="space-y-1 my-1 overflow-hidden max-h-[80px]">
                        {dayTasks.slice(0, 2).map((t) => (
                          <div
                            key={t.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedTask(t);
                            }}
                            className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-950 border border-indigo-800 text-indigo-200 truncate hover:bg-indigo-900"
                          >
                            {new Date(t.startTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })} {t.title}
                          </div>
                        ))}
                        {dayTasks.length > 2 && (
                          <p className="text-[9px] text-slate-500 font-semibold pl-1">+ {dayTasks.length - 2} más</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* VISTA MI ITINERARIO / LISTA AGENDA */
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-white flex items-center">
                  <CalendarIcon className="w-4 h-4 mr-2 text-indigo-400" />
                  Listado de Trabajos & Itinerario Agendado ({tasks.length})
                </h3>
              </div>

              {tasks.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <Info className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                  <p className="text-sm">No hay trabajos agendados en este filtro.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {tasks.map((t) => (
                    <div
                      key={t.id}
                      onClick={() => setSelectedTask(t)}
                      className="bg-slate-950 border border-slate-800 hover:border-indigo-500/50 rounded-2xl p-4 cursor-pointer transition-all hover:scale-[1.01] shadow-lg flex flex-col justify-between"
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between">
                          <h4 className="font-bold text-white text-sm leading-snug">{t.title}</h4>
                          {getStatusBadge(t.status)}
                        </div>

                        {t.description && (
                          <p className="text-xs text-slate-400 line-clamp-2">{t.description}</p>
                        )}

                        <div className="space-y-1 text-xs text-slate-300 pt-2 border-t border-slate-900">
                          <div className="flex items-center text-slate-400">
                            <Clock className="w-3.5 h-3.5 mr-1.5 text-indigo-400" />
                            <span>
                              {new Date(t.startTime).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })}: {' '}
                              {new Date(t.startTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })} - {' '}
                              {new Date(t.endTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>

                          <div className="flex items-center text-slate-400">
                            <User className="w-3.5 h-3.5 mr-1.5 text-emerald-400" />
                            <span>Asignado a: <strong className="text-white">{t.assignedTo?.name}</strong> ({t.assignedTo?.role === 'THIRD_PARTY' ? 'Contratista 3ero' : 'Empleado'})</span>
                          </div>

                          {t.location && (
                            <div className="flex items-center text-slate-400">
                              <MapPin className="w-3.5 h-3.5 mr-1.5 text-amber-400" />
                              <span>{t.location}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="mt-4 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
                        <span className="flex items-center text-red-400 font-semibold">
                          <Lock className="w-3 h-3 mr-1" /> Horario Bloqueado para {t.assignedTo?.name}
                        </span>
                        <span>Clic para ver detalles</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal para Crear Tarea */}
      <NewTaskModal
        isOpen={isNewTaskOpen}
        onClose={() => setIsNewTaskOpen(false)}
        users={users}
        currentUser={currentUser}
        onTaskCreated={fetchTasks}
        initialDateStr={newTaskDefaults.dateStr}
        initialStartTimeStr={newTaskDefaults.startTimeStr}
        initialEndTimeStr={newTaskDefaults.endTimeStr}
      />

      {/* Modal de Detalle de Tarea */}
      <TaskDetailModal
        task={selectedTask}
        onClose={() => setSelectedTask(null)}
        currentUser={currentUser}
        onTaskUpdated={fetchTasks}
      />
    </div>
  );
}
