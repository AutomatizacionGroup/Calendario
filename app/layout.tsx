import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Calendario & Asignación de Trabajos - Notificaciones WhatsApp',
  description: 'Sistema corporativo de agenda, asignación a empleados y terceros, bloqueo de horarios y notificaciones por WhatsApp.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="bg-slate-950 text-slate-100 min-h-screen antialiased selection:bg-indigo-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
