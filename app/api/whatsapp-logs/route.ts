import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

export async function GET() {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const logs = await prisma.whatsAppLog.findMany({
      orderBy: { sentAt: 'desc' },
      take: 50,
      include: {
        task: true,
      },
    });

    return NextResponse.json({ logs });
  } catch (error: any) {
    console.error('Error al obtener logs de WhatsApp:', error);
    return NextResponse.json({ error: 'Error al consultar historial de mensajes.' }, { status: 500 });
  }
}
