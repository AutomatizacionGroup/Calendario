'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, ShieldCheck, UserCheck, Wrench, ArrowRight, Lock, Mail, Phone, User, CheckCircle2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [infoMsg, setInfoMsg] = useState('');

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'BOSS' | 'EMPLOYEE' | 'THIRD_PARTY'>('EMPLOYEE');

  // Verification Step State
  const [regStep, setRegStep] = useState<'FORM' | 'VERIFY_CODE'>('FORM');
  const [verificationCodeInput, setVerificationCodeInput] = useState('');
  const [expectedCode, setExpectedCode] = useState('');
  const [simulatedNotice, setSimulatedNotice] = useState<string | null>(null);

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

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setInfoMsg('');

    try {
      const res = await fetch('/api/auth/send-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al enviar código de verificación');
      }

      setExpectedCode(data.code);
      setInfoMsg(`📩 Hemos enviado un código de verificación de 6 dígitos a ${email}. Revisa tu bandeja de entrada o carpeta de spam e ingrésalo a continuación.`);
      setRegStep('VERIFY_CODE');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // 1. Verificar Código
      const verifyRes = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inputCode: verificationCodeInput, expectedCode }),
      });

      const verifyData = await verifyRes.json();
      if (!verifyRes.ok) {
        throw new Error(verifyData.error || 'Código incorrecto');
      }

      // 2. Registrar usuario verificado y enviar notificación al Admin
      const regRes = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, role, password, emailVerified: true }),
      });

      const regData = await regRes.json();
      if (!regRes.ok) {
        throw new Error(regData.error || 'Error al registrar usuario');
      }

      setRegStep('FORM');
      setIsRegister(false);
      setInfoMsg('¡Correo verificado con éxito! Tu solicitud ha sido registrada y notificada al Administrador por correo.');
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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3 bg-indigo-600/20 text-indigo-400 rounded-2xl border border-indigo-500/30">
            <Calendar className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Calendario Empresarial</h1>
          <p className="text-xs text-slate-400">
            Gestión de Trabajos, Subastas & Control de Itinerarios
          </p>
        </div>

        {/* Form Container */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-xl">
          {/* Tabs */}
          <div className="grid grid-cols-2 p-1 bg-slate-950 rounded-xl mb-6 text-xs font-semibold">
            <button
              onClick={() => { setIsRegister(false); setRegStep('FORM'); setError(''); setInfoMsg(''); }}
              className={`py-2 rounded-lg transition-colors ${
                !isRegister ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Iniciar Sesión
            </button>
            <button
              onClick={() => { setIsRegister(true); setRegStep('FORM'); setError(''); setInfoMsg(''); }}
              className={`py-2 rounded-lg transition-colors ${
                isRegister ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Crear Cuenta
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-950/80 border border-red-800 rounded-xl text-xs text-red-300">
              {error}
            </div>
          )}

          {infoMsg && (
            <div className="mb-4 p-3 bg-emerald-950/80 border border-emerald-800 rounded-xl text-xs text-emerald-300 flex items-start space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>{infoMsg}</span>
            </div>
          )}

          {isRegister && regStep === 'VERIFY_CODE' ? (
            <form onSubmit={handleVerifyAndRegister} className="space-y-4">


              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1 text-center">
                  Código de Verificación (6 dígitos)
                </label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  placeholder="123456"
                  value={verificationCodeInput}
                  onChange={(e) => setVerificationCodeInput(e.target.value.replace(/\D/g, ''))}
                  className="w-full bg-slate-950 border border-indigo-500 rounded-xl text-center font-mono text-lg py-2.5 text-slate-100 placeholder-slate-600 focus:outline-none tracking-widest"
                />
              </div>

              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => setRegStep('FORM')}
                  className="w-1/3 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs"
                >
                  Volver
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-2/3 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-xs shadow-lg shadow-emerald-600/30"
                >
                  {loading ? 'Verificando...' : '✓ Verificar y Registrar'}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={isRegister ? handleSendCode : handleLogin} className="space-y-4">
              {isRegister && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Nombre Completo Real</label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                      <input
                        type="text"
                        required
                        placeholder="Ej. Roberto Gómez"
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
                    <label className="block text-xs font-medium text-slate-300 mb-1">Rol Solicitado</label>
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
                <label className="block text-xs font-medium text-slate-300 mb-1">Correo Electrónico Real</label>
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
                    <span>{isRegister ? 'Solicitar Código de Verificación 📩' : 'Entrar a la Plataforma'}</span>
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Quick Logins for Demo */}
          {!isRegister && (
            <div className="mt-6 pt-4 border-t border-slate-800 space-y-2">
              <p className="text-[11px] text-slate-400 text-center font-medium">
                Acceso Rápido Modo Demo:
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => quickLogin('jefe@empresa.com')}
                  className="p-2 bg-slate-950 border border-slate-800 rounded-xl text-left hover:border-slate-700 transition-colors text-xs"
                >
                  <div className="font-semibold text-indigo-400">Jefe / Admin</div>
                  <div className="text-[10px] text-slate-500">Carlos Mendoza</div>
                </button>
                <button
                  onClick={() => quickLogin('tecnico@empresa.com')}
                  className="p-2 bg-slate-950 border border-slate-800 rounded-xl text-left hover:border-slate-700 transition-colors text-xs"
                >
                  <div className="font-semibold text-emerald-400">Empleado Técnico</div>
                  <div className="text-[10px] text-slate-500">Luis Fernández</div>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
