'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, ShieldCheck, UserCheck, Wrench, ArrowRight, Lock, Mail, Phone, User } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'BOSS' | 'EMPLOYEE' | 'THIRD_PARTY'>('EMPLOYEE');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al iniciar sesión');
      }

      router.push('/dashboard');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, role, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al registrar usuario');
      }

      // Auto login después de registrar
      const loginRes = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (loginRes.ok) {
        router.push('/dashboard');
        router.refresh();
      } else {
        setIsRegister(false);
        setError('Usuario creado. Por favor inicia sesión.');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = async (userEmail: string) => {
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail, password: '123456' }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error en inicio rápido');
      }

      router.push('/dashboard');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-emerald-600/10 blur-[100px] rounded-full pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center z-10">
        <div className="inline-flex items-center justify-center p-3 bg-indigo-600/20 border border-indigo-500/30 rounded-2xl mb-4 text-indigo-400">
          <Calendar className="w-10 h-10 text-indigo-400" />
        </div>
        <h2 className="text-3xl font-extrabold text-white tracking-tight">
          Agendador Empresarial & 3eros
        </h2>
        <p className="mt-2 text-sm text-slate-400 max-w-sm mx-auto">
          Calendario de itinerarios, bloqueo automático de horarios y notificaciones por WhatsApp.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10 px-4">
        {/* Quick Demo Login Preset Buttons */}
        <div className="mb-6 bg-slate-900/80 border border-slate-800 rounded-2xl p-4 backdrop-blur-md">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 text-center">
            ⚡ Acceso Rápido de Prueba (1-Clic)
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => quickLogin('jefe@empresa.com')}
              disabled={loading}
              className="flex flex-col items-center justify-center p-2.5 bg-indigo-950/60 hover:bg-indigo-900/80 border border-indigo-800/50 rounded-xl text-xs font-medium text-indigo-200 transition-all group"
            >
              <ShieldCheck className="w-5 h-5 text-indigo-400 mb-1 group-hover:scale-110 transition-transform" />
              <span>Entrar como</span>
              <strong className="text-white font-bold">Jefe</strong>
            </button>
            <button
              onClick={() => quickLogin('empleado@empresa.com')}
              disabled={loading}
              className="flex flex-col items-center justify-center p-2.5 bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-800/50 rounded-xl text-xs font-medium text-emerald-200 transition-all group"
            >
              <UserCheck className="w-5 h-5 text-emerald-400 mb-1 group-hover:scale-110 transition-transform" />
              <span>Entrar como</span>
              <strong className="text-white font-bold">Empleado</strong>
            </button>
            <button
              onClick={() => quickLogin('contratista@terceros.com')}
              disabled={loading}
              className="flex flex-col items-center justify-center p-2.5 bg-amber-950/60 hover:bg-amber-900/80 border border-amber-800/50 rounded-xl text-xs font-medium text-amber-200 transition-all group"
            >
              <Wrench className="w-5 h-5 text-amber-400 mb-1 group-hover:scale-110 transition-transform" />
              <span>Entrar como</span>
              <strong className="text-white font-bold">3ero</strong>
            </button>
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl py-8 px-6 shadow-2xl backdrop-blur-md">
          {error && (
            <div className="mb-4 p-3 bg-red-950/80 border border-red-800/60 rounded-xl text-xs text-red-300">
              {error}
            </div>
          )}

          <div className="flex border-b border-slate-800 mb-6">
            <button
              onClick={() => setIsRegister(false)}
              className={`flex-1 py-2 text-sm font-semibold border-b-2 text-center transition-all ${
                !isRegister
                  ? 'border-indigo-500 text-indigo-400'
                  : 'border-transparent text-slate-500 hover:text-slate-300'
              }`}
            >
              Iniciar Sesión
            </button>
            <button
              onClick={() => setIsRegister(true)}
              className={`flex-1 py-2 text-sm font-semibold border-b-2 text-center transition-all ${
                isRegister
                  ? 'border-indigo-500 text-indigo-400'
                  : 'border-transparent text-slate-500 hover:text-slate-300'
              }`}
            >
              Registrarse
            </button>
          </div>

          <form onSubmit={isRegister ? handleRegister : handleLogin} className="space-y-4">
            {isRegister && (
              <>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Nombre Completo</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      placeholder="Ej. Ing. Mario Rossi"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Teléfono (con WhatsApp)</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      placeholder="+52 555 123 4567"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Rol de Usuario</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="EMPLOYEE">Empleado Interno</option>
                    <option value="THIRD_PARTY">Contratista / Tercero</option>
                    <option value="BOSS">Jefe / Administrador</option>
                  </select>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Correo Electrónico</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  placeholder="usuario@empresa.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Contraseña</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 flex items-center justify-center py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl shadow-lg shadow-indigo-600/30 transition-all text-sm group"
            >
              {loading ? (
                <span>Procesando...</span>
              ) : (
                <>
                  <span>{isRegister ? 'Crear Cuenta' : 'Entrar a la Plataforma'}</span>
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
