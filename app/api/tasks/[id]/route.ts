import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { id } = params;

  try {
    const existingTask = await prisma.task.findUnique({
      where: { id },
    });

    if (!existingTask) {
      return NextResponse.json({ error: 'Tarea no encontrada.' }, { status: 404 });
    }

    // Verificar permisos: BOSS o usuario asignado o creador
    if (
      session.role !== 'BOSS' &&
      existingTask.assignedToId !== session.id &&
      existingTask.createdById !== session.id
    ) {
      return NextResponse.json({ error: 'No tienes permisos para modificar este trabajo.' }, { status: 403 });
    }

    const body = await req.json();
    const { status, title, description, location, startTimeStr, endTimeStr } = body;

    let updateData: any = {};

    if (status && ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'].includes(status)) {
      updateData.status = status;
    }

    if (title) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (location !== undefined) updateData.location = location;

    // Si se cambian las horas, revalidar choque de horarios
    if (startTimeStr && endTimeStr) {
      const start = new Date(startTimeStr);
      const end = new Date(endTimeStr);

      if (start >= end) {
        return NextResponse.json({ error: 'La hora de inicio debe ser anterior a la hora de fin.' }, { status: 400 });
      }

      const conflict = await prisma.task.findFirst({
        where: {
          id: { not: id },
          assignedToId: existingTask.assignedToId,
          status: { not: 'CANCELLED' },
          AND: [{ startTime: { lt: end } }, { endTime: { gt: start } }],
        },
      });

      if (conflict) {
        return NextResponse.json(
          { error: `⚠️ El nuevo horario choca con el trabajo '${conflict.title}'.` },
          { status: 409 }
        );
      }

      updateData.startTime = start;
      updateData.endTime = end;
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: updateData,
      include: {
        assignedTo: true,
        createdBy: true,
      },
    });

    return NextResponse.json({ task: updatedTask, message: 'Trabajo actualizado correctamente.' });
  } catch (error: any) {
    console.error('Error al actualizar tarea:', error);
    return NextResponse.json({ error: 'Error al actualizar el trabajo.' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { id } = params;

  try {
    const existingTask = await prisma.task.findUnique({
      where: { id },
    });

    if (!existingTask) {
      return NextResponse.json({ error: 'Tarea no encontrada.' }, { status: 404 });
    }

    if (
      session.role !== 'BOSS' &&
      existingTask.assignedToId !== session.id &&
      existingTask.createdById !== session.id
    ) {
      return NextResponse.json({ error: 'No tienes permiso para eliminar esta tarea.' }, { status: 403 });
    }

    await prisma.task.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Trabajo eliminado y horario liberado correctamente.' });
  } catch (error: any) {
    console.error('Error al eliminar tarea:', error);
    return NextResponse.json({ error: 'Error al eliminar la tarea.' }, { status: 500 });
  }
}
