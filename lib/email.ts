import nodemailer from 'nodemailer';
import { prisma } from './prisma';

export interface SendEmailParams {
  toEmail: string;
  subject: string;
  body: string;
  type: 'VERIFICATION' | 'ADMIN_NOTICE';
}

/**
 * Servicio unificado de correo electrónico:
 * 1. Envía correos reales mediante SMTP (Gmail / Outlook / cPanel) o Resend API si las variables están configuradas en .env
 * 2. Guarda el registro de todos los correos enviados en la base de datos (EmailLog)
 */
export async function sendEmail(params: SendEmailParams) {
  const { toEmail, subject, body, type } = params;

  const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
  const smtpPort = parseInt(process.env.SMTP_PORT || '587', 10);
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpFrom = process.env.SMTP_FROM || (smtpUser ? `"Calendario" <${smtpUser}>` : '"Calendario Empresarial" <no-reply@empresa.com>');
  const resendApiKey = process.env.RESEND_API_KEY;
  const resendFrom = process.env.RESEND_FROM || 'onboarding@resend.dev';

  // Opción 1: Resend API si está configurado en .env
  if (resendApiKey) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: resendFrom,
          to: toEmail,
          subject: subject,
          text: body,
        }),
      });

      if (res.ok) {
        console.log(`✅ [RESEND EMAIL ENVIADO REAL] Para: ${toEmail} | Asunto: ${subject}`);
      } else {
        const errText = await res.text();
        console.error('❌ Error enviando email por Resend API:', errText);
        
        // Si Resend en modo gratuito restringe envíos solo al correo del dueño de la cuenta
        const fallbackTarget = process.env.ADMIN_EMAIL || 'willy@automatizaciongroup.com';
        if (toEmail !== fallbackTarget) {
          console.log(`🔄 Enviando copia a la cuenta de Resend autorizada (${fallbackTarget})...`);
          try {
            await fetch('https://api.resend.com/emails', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${resendApiKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                from: resendFrom,
                to: fallbackTarget,
                subject: `[COPIA TEST PARA: ${toEmail}] ${subject}`,
                text: `NOTA: Este correo se envió a ${fallbackTarget} porque Resend en modo test solo permite enviar a tu dirección registrada.\n\nDestinatario original: ${toEmail}\n\n${body}`,
              }),
            });
            console.log(`✅ [COPIA RESEND ENTREGADA REALMENTE] En tu bandeja: ${fallbackTarget}`);
          } catch (fallbackErr) {
            console.error('Error en fallback Resend:', fallbackErr);
          }
        }
      }
    } catch (e) {
      console.error('❌ Excepción enviando email por Resend API:', e);
    }
  }
  // Opción 2: Nodemailer SMTP (Gmail, Outlook, Hostinger, cPanel, SES) si SMTP_USER y SMTP_PASS existen
  else if (smtpUser && smtpPass) {
    try {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
        tls: {
          rejectUnauthorized: false
        }
      });

      const info = await transporter.sendMail({
        from: smtpFrom,
        to: toEmail,
        subject: subject,
        text: body,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 24px; background-color: #090d16; color: #f9fafb; border-radius: 16px; border: 1px solid #1f2937;">
            <h2 style="color: #10b981; margin-top: 0;">📅 Calendario Empresarial</h2>
            <h3 style="color: #ffffff; margin-bottom: 16px;">${subject}</h3>
            <div style="background-color: #111827; padding: 20px; border-radius: 12px; font-size: 14px; line-height: 1.6; white-space: pre-wrap; color: #e5e7eb; border: 1px solid #374151;">
${body}
            </div>
            <p style="font-size: 11px; color: #9ca3af; margin-top: 24px;">
              Este es un correo automático de seguridad enviado por el sistema de Calendario Empresarial.
            </p>
          </div>
        `
      });

      console.log(`✅ [CORREO SMTP ENVIADO REAL] MessageId: ${info.messageId} | Para: ${toEmail}`);
    } catch (e) {
      console.error('❌ Error enviando correo vía SMTP:', e);
    }
  }
  // Opción 3: Registro en Consola para Entorno Local de Pruebas
  else {
    console.log('\n================ [ REGISTRO DE CORREO LOCAL (SIN SMTP CONFIGURADO) ] ================');
    console.log(`TIPO: ${type}`);
    console.log(`PARA: ${toEmail}`);
    console.log(`ASUNTO: ${subject}`);
    console.log(`CONTENIDO:\n${body}`);
    console.log('ℹ️ Para enviar correos reales a inboxes reales, configura SMTP_USER y SMTP_PASS en tu .env');
    console.log('=====================================================================================\n');
  }

  // Guardar log en la base de datos
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

Tu código de verificación de 6 dígitos para validar tu correo electrónico es:

👉 [ ${code} ]

Por favor, ingresa este código en el formulario de registro para continuar. Este código expirará en 15 minutos.

Si no solicitaste este registro, puedes ignorar este mensaje.`;

  return await sendEmail({
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

  return await sendEmail({
    toEmail: adminEmail,
    subject,
    body,
    type: 'ADMIN_NOTICE',
  });
}
