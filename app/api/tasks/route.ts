import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { sendWhatsAppNotification } from '@/lib/whatsapp';

export async function GET(req: Request) {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const userIdFilter = searchParams.get('userId');
  const dateStr = searchParams.get('date');

  try {
    let whereClause: any = {};

    // Si es EMPLEADO o TERCERO, ve sus tareas asignadas o las creadas por él mismo
    if (session.role !== 'BOSS') {
      whereClause.OR = [
        { assignedToId: session.id },
        { createdById: session.id },
      ];
    } else if (userIdFilter) {
      whereClause.assignedToId = userIdFilter;
    }

    if (dateStr) {
      const targetDate = new Date(dateStr);
      const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
      const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));
      whereClause.startTime = {
        gte: startOfDay,
        lte: endOfDay,
      };
    }

    const tasks = await prisma.task.findMany({
      where: whereClause,
      include: {
        assignedTo: {
          select: { id: true, name: true, phone: true, email: true, role: true },
        },
        createdBy: {
          select: { id: true, name: true, role: true },
        },
      },
      orderBy: { startTime: 'asc' },
    });

    return NextResponse.json({ tasks });
  } catch (error: any) {
    console.error('Error al obtener tareas:', error);
    return NextResponse.json({ error: 'Error al consultar las tareas.' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const {
      title,
      description,
      location,
      startTimeStr,
      endTimeStr,
      assignedToId,
      isPersonal,
    } = await req.json();

    if (!title || !startTimeStr || !endTimeStr) {
      return NextResponse.json(
        { error: 'El título, la hora de inicio y fin son obligatorios.' },
        { status: 400 }
      );
    }

    const start = new Date(startTimeStr);
    const end = new Date(endTimeStr);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return NextResponse.json(
        { error: 'Las fechas/horas no son válidas.' },
        { status: 400 }
      );
    }

    if (start >= end) {
      return NextResponse.json(
        { error: 'La hora de inicio debe ser anterior a la hora de fin.' },
        { status: 400 }
      );
    }

    // Determinar a quién se asigna la tarea
    let targetUserId = assignedToId;
    if (!targetUserId || session.role !== 'BOSS') {
      targetUserId = session.id; // Empleados/3eros asignan a sí mismos sus tareas personales
    }

    // Verificar que el usuario destino exista
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: 'El usuario asignado no existe.' },
        { status: 404 }
      );
    }

    // 🔒 VALIDACIÓN Y BLOQUEO DE SOLAPAMIENTO DE HORARIOS
    const overlappingTask = await prisma.task.findFirst({
      where: {
        assignedToId: targetUserId,
        status: { not: 'CANCELLED' },
        AND: [
          { startTime: { lt: end } },
          { endTime: { gt: start } },
        ],
      },
      include: {
        assignedTo: true,
      },
    });

    if (overlappingTask) {
      const conflictStart = new Date(overlappingTask.startTime).toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
      });
      const conflictEnd = new Date(overlappingTask.endTime).toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
      });

      return NextResponse.json(
        {
          error: `⚠️ HORARIO BLOQUEADO: ${targetUser.name} ya tiene agendado el trabajo '${overlappingTask.title}' en ese tramo (${conflictStart} - ${conflictEnd}). Elige otro horario o asigna a otro usuario.`,
        },
        { status: 409 }
      );
    }

    // Crear la tarea si el horario está totalmente libre
    const newTask = await prisma.task.create({
      data: {
        title,
        description: description || null,
        location: location || null,
        startTime: start,
        endTime: end,
        isPersonal: Boolean(isPersonal) || session.role !== 'BOSS',
        assignedToId: targetUserId,
        createdById: session.id,
      },
      include: {
        assignedTo: true,
        createdBy: true,
      },
    });

    // 📱 Notificar por WhatsApp si la asignación proviene de un Jefe a otro usuario
    let whatsappResult = null;
    if (session.role === 'BOSS' && targetUserId !== session.id) {
      whatsappResult = await sendWhatsAppNotification({
        taskId: newTask.id,
        recipientPhone: targetUser.phone,
        recipientName: targetUser.name,
        taskTitle: newTask.title,
        startTime: newTask.startTime,
        endTime: newTask.endTime,
        location: newTask.location,
        description: newTask.description,
        assignedByName: session.name,
      });
    }

    return NextResponse.json({
      task: newTask,
      whatsappLog: whatsappResult,
      message: 'Trabajo agendado y horario bloqueado correctamente.',
    });
  } catch (error: any) {
    console.error('Error al crear tarea:', error);
    return NextResponse.json({ error: 'Error interno al agendar la tarea.' }, { status: 500 });
  }
}
