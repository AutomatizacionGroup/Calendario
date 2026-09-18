import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import DashboardNavbar from '@/components/DashboardNavbar';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <DashboardNavbar user={user} />
      <main className="flex-1 p-4 md:p-6 max-w-7xl mx-auto w-full">
        {children}
      </main>
    </div>
  );
}
