import { prisma } from './prisma';

export interface SendEmailParams {
  toEmail: string;
  subject: string;
  body: string;
  type: 'VERIFICATION' | 'ADMIN_NOTICE';
}

export async function sendLocalEmail(params: SendEmailParams) {
  const { toEmail, subject, body, type } = params;

  console.log('\n================ [ LOCAL EMAIL SERVICE LOG ] ================');
  console.log(`TIPO: ${type}`);
  console.log(`PARA: ${toEmail}`);
  console.log(`ASUNTO: ${subject}`);
  console.log(`CONTENIDO:\n${body}`);
  console.log('=============================================================\n');

  try {
    return await prisma.emailLog.create({
      data: {
        toEmail,
        subject,
        body,
        type,
      },
    });
  } catch (error) {
    console.warn('Advertencia: No se pudo guardar el log de correo en la BD local:', error);
    return null;
  }
}

export async function sendVerificationEmail(toEmail: string, recipientName: string, code: string) {
  const subject = '🔐 Código de Verificación de Correo - Calendario Empresarial';
  const body = `Hola ${recipientName},

Gracias por iniciar tu registro en el sistema de Calendario Empresarial.

Tu código de verificación de 6 dígitos para validar la existencia de tu correo electrónico es:

👉 [ ${code} ]

Por favor, ingresa este código en el formulario de registro para continuar. Este código expirará en 15 minutos.

Si no solicitaste este registro, puedes ignorar este mensaje.`;

  return await sendLocalEmail({
    toEmail,
    subject,
    body,
    type: 'VERIFICATION',
  });
}

export async function sendAdminNoticeEmail(newUser: { name: string; email: string; phone: string; role: string }) {
  const adminEmail = process.env.ADMIN_EMAIL || 'jefe@empresa.com';
  const subject = '🔔 NUEVA SOLICITUD DE REGISTRO PENDIENTE DE APROBACIÓN';
  const body = `Estimado Administrador / Jefe,

Se ha recibido una nueva solicitud de registro de usuario con correo electrónico VERIFICADO.

📋 Datos del solicitante:
- Nombre: ${newUser.name}
- Correo Verificado: ${newUser.email}
- Teléfono: ${newUser.phone}
- Rol Propuesto: ${newUser.role === 'THIRD_PARTY' ? 'Contratista 3ero' : newUser.role === 'BOSS' ? 'Jefe / Admin' : 'Empleado Técnico'}

Por favor, ingresa a la plataforma en la sección 'Solicitudes de Registro Pendientes' para Aprobar o Rechazar el acceso a este usuario.`;

  return await sendLocalEmail({
    toEmail: adminEmail,
    subject,
    body,
    type: 'ADMIN_NOTICE',
  });
}
