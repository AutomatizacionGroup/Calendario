import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding base de datos...');

  const passwordHash = await bcrypt.hash('123456', 10);

  // Crear usuario Jefe
  const boss = await prisma.user.upsert({
    where: { email: 'jefe@empresa.com' },
    update: {},
    create: {
      name: 'Ing. Carlos Mendoza (Jefe)',
      email: 'jefe@empresa.com',
      phone: '+525551234567',
      role: 'BOSS',
      password: passwordHash,
    },
  });

  // Crear usuario Empleado Interno
  const employee = await prisma.user.upsert({
    where: { email: 'empleado@empresa.com' },
    update: {},
    create: {
      name: 'Juan Pérez (Empleado Técnico)',
      email: 'empleado@empresa.com',
      phone: '+525559876543',
      role: 'EMPLOYEE',
      password: passwordHash,
    },
  });

  // Crear usuario Contratista Tercero
  const contractor = await prisma.user.upsert({
    where: { email: 'contratista@terceros.com' },
    update: {},
    create: {
      name: 'Roberto Gómez (Contratista 3ero - Electricista)',
      email: 'contratista@terceros.com',
      phone: '+525554443322',
      role: 'THIRD_PARTY',
      password: passwordHash,
    },
  });

  console.log('Usuarios base creados:');
  console.log('1. Jefe:', boss.email);
  console.log('2. Empleado:', employee.email);
  console.log('3. Contratista 3ero:', contractor.email);

  // Crear algunas tareas de ejemplo
  const today = new Date();
  const start1 = new Date(today);
  start1.setHours(9, 0, 0, 0);
  const end1 = new Date(today);
  end1.setHours(11, 30, 0, 0);

  await prisma.task.create({
    data: {
      title: 'Mantenimiento de Servidores Principales',
      description: 'Revisión preventiva de gabinete de comunicaciones y respaldos.',
      location: 'Oficina Central - Piso 2',
      startTime: start1,
      endTime: end1,
      status: 'PENDING',
      assignedToId: employee.id,
      createdById: boss.id,
    },
  });

  const start2 = new Date(today);
  start2.setHours(13, 0, 0, 0);
  const end2 = new Date(today);
  end2.setHours(16, 0, 0, 0);

  const task3rd = await prisma.task.create({
    data: {
      title: 'Instalación Cableado Estructurado 3er Nivel',
      description: 'Subcontrato de cableado UTP Cat6a y certificación de puntos de red.',
      location: 'Edificio B - Planta Baja',
      startTime: start2,
      endTime: end2,
      status: 'IN_PROGRESS',
      assignedToId: contractor.id,
      createdById: boss.id,
    },
  });

  // Log de WhatsApp inicial simulado
  await prisma.whatsAppLog.create({
    data: {
      taskId: task3rd.id,
      recipientName: contractor.name,
      recipientPhone: contractor.phone,
      message: `📢 *NUEVA ASIGNACIÓN DE TRABAJO*\nHola Roberto Gómez, el Ing. Carlos Mendoza te ha asignado el trabajo 'Instalación Cableado Estructurado 3er Nivel' de 13:00 a 16:00. Horario bloqueado.`,
      status: 'SIMULATED',
    },
  });

  console.log('Semillas creadas exitosamente.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
