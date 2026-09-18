import { prisma } from './prisma';

export interface SendWhatsAppParams {
  taskId?: string;
  recipientPhone: string;
  recipientName: string;
  taskTitle: string;
  startTime: Date;
  endTime: Date;
  location?: string | null;
  description?: string | null;
  assignedByName?: string;
}

export async function sendWhatsAppNotification(params: SendWhatsAppParams) {
  const {
    taskId,
    recipientPhone,
    recipientName,
    taskTitle,
    startTime,
    endTime,
    location,
    description,
    assignedByName,
  } = params;

  const startDateFormatted = new Date(startTime).toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  
  const startTimeFormatted = new Date(startTime).toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const endTimeFormatted = new Date(endTime).toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const messageText = `📢 *NUEVA ASIGNACIÓN DE TRABAJO*

Hola *${recipientName}*, ${assignedByName ? `*${assignedByName}*` : 'se'} te ha asignado el siguiente trabajo:

📌 *Trabajo:* ${taskTitle}
📅 *Fecha:* ${startDateFormatted}
⏰ *Horario:* ${startTimeFormatted} - ${endTimeFormatted}
${location ? `📍 *Ubicación:* ${location}\n` : ''}${description ? `📝 *Detalles:* ${description}\n` : ''}
⚠️ *Nota:* Este horario ha sido bloqueado en tu itinerario de trabajo.`;

  const mode = process.env.WHATSAPP_MODE || 'SIMULATION';

  try {
    if (mode === 'META_CLOUD' && process.env.WHATSAPP_API_KEY && process.env.WHATSAPP_PHONE_ID) {
      // Envío mediante Meta Cloud API
      const res = await fetch(
        `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_ID}/messages`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${process.env.WHATSAPP_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: recipientPhone.replace(/\D/g, ''),
            type: 'text',
            text: { body: messageText },
          }),
        }
      );

      const status = res.ok ? 'SENT' : 'FAILED';

      return await prisma.whatsAppLog.create({
        data: {
          taskId,
          recipientPhone,
          recipientName,
          message: messageText,
          status,
        },
      });
    }

    // Modo por defecto SIMULACIÓN
    console.log('\n================ [ WHATSAPP NOTIFICATION LOG ] ================');
    console.log(`PARA: ${recipientName} (${recipientPhone})`);
    console.log(`MENSAJE:\n${messageText}`);
    console.log('===============================================================\n');

    return await prisma.whatsAppLog.create({
      data: {
        taskId,
        recipientPhone,
        recipientName,
        message: messageText,
        status: 'SIMULATED',
      },
    });
  } catch (error) {
    console.error('Error al registrar/enviar mensaje de WhatsApp:', error);
    return await prisma.whatsAppLog.create({
      data: {
        taskId,
        recipientPhone,
        recipientName,
        message: messageText,
        status: 'FAILED',
      },
    });
  }
}
