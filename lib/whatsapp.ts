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

export function formatWhatsAppPhone(phone: string): string {
  if (!phone) return '';
  let cleaned = phone.replace(/[^0-9]/g, '');
  if (!cleaned) return '';

  // Formato local de Venezuela: 0412..., 0414..., 0424..., 0416..., 0426... -> 584...
  if (/^04[12][246]/.test(cleaned) || /^04\d{8,9}$/.test(cleaned)) {
    cleaned = '58' + cleaned.substring(1);
  }
  // Formato de 10 dígitos sin el '0' inicial (ej. 4125594984), anteponer '58'
  else if (cleaned.length === 10 && /^4[12][246]/.test(cleaned)) {
    cleaned = '58' + cleaned;
  }
  // Formato que empieza con 0, remover ceros iniciales
  else if (cleaned.startsWith('0')) {
    cleaned = cleaned.replace(/^0+/, '');
  }

  return cleaned;
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

  const cleanPhone = formatWhatsAppPhone(recipientPhone);
  const directUrl = cleanPhone
    ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(messageText)}`
    : `https://api.whatsapp.com/send?text=${encodeURIComponent(messageText)}`;

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
            to: cleanPhone,
            type: 'text',
            text: { body: messageText },
          }),
        }
      );

      const status = res.ok ? 'SENT' : 'FAILED';

      const log = await prisma.whatsAppLog.create({
        data: {
          taskId,
          recipientPhone,
          recipientName,
          message: messageText,
          status,
        },
      });
      return { ...log, directUrl };
    }

    // Modo por defecto SIMULACIÓN
    console.log('\n================ [ WHATSAPP NOTIFICATION LOG ] ================');
    console.log(`PARA: ${recipientName} (${recipientPhone}) -> ${cleanPhone}`);
    console.log(`URL DIRECTA: ${directUrl}`);
    console.log(`MENSAJE:\n${messageText}`);
    console.log('===============================================================\n');

    const log = await prisma.whatsAppLog.create({
      data: {
        taskId,
        recipientPhone,
        recipientName,
        message: messageText,
        status: 'SIMULATED',
      },
    });
    return { ...log, directUrl };
  } catch (error) {
    console.error('Error al registrar/enviar mensaje de WhatsApp:', error);
    const log = await prisma.whatsAppLog.create({
      data: {
        taskId,
        recipientPhone,
        recipientName,
        message: messageText,
        status: 'FAILED',
      },
    });
    return { ...log, directUrl };
  }
}
