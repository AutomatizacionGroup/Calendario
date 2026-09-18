const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Limpiando y re-sembrando datos base en la base de datos...');

  // Limpiar logs y tareas previas para evitar duplicados en la base de datos
  await prisma.whatsAppLog.deleteMany({});
  await prisma.task.deleteMany({});

  const passwordHash = await bcrypt.hash('123456', 10);

  // 1. Usuario Jefe
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

  // 2. Usuario Empleado
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

  // 3. Usuario Contratista 3ero
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

  console.log('✅ Usuarios creados:');
  console.log(' - Jefe (jefe@empresa.com)');
  console.log(' - Empleado (empleado@empresa.com)');
  console.log(' - Contratista 3ero (contratista@terceros.com)');

  // Crear Tareas Únicas de Prueba para el día de hoy
  const today = new Date();
  
  const start1 = new Date(today);
  start1.setHours(9, 0, 0, 0);
  const end1 = new Date(today);
  end1.setHours(11, 30, 0, 0);

  await prisma.task.create({
    data: {
      title: 'Mantenimiento Preventivo de Servidores',
      description: 'Revisión de gabinete de comunicaciones y respaldos de seguridad.',
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
      title: 'Instalación Cableado Cat6a',
      description: 'Subcontrato de certificación y tirado de 24 puntos de red.',
      location: 'Edificio B - Planta Baja',
      startTime: start2,
      endTime: end2,
      status: 'IN_PROGRESS',
      assignedToId: contractor.id,
      createdById: boss.id,
    },
  });

  // Log de WhatsApp inicial
  await prisma.whatsAppLog.create({
    data: {
      taskId: task3rd.id,
      recipientName: contractor.name,
      recipientPhone: contractor.phone,
      message: `📢 *NUEVA ASIGNACIÓN DE TRABAJO*\nHola Roberto Gómez, el Ing. Carlos Mendoza te ha asignado el trabajo 'Instalación Cableado Cat6a' de 13:00 a 16:00. Horario bloqueado.`,
      status: 'SIMULATED',
    },
  });

  console.log('🎉 Base de datos limpiada y tareas sin duplicados sembradas con éxito.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
