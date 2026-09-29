import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendVerificationEmail } from '@/lib/email';

export async function POST(req: Request) {
  try {
    const { email, name } = await req.json();

    if (!email || !name) {
      return NextResponse.json(
        { error: 'El nombre y correo electrónico son requeridos para enviar la verificación.' },
        { status: 400 }
      );
    }

    // Validar formato de correo básico
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Por favor ingresa un correo electrónico con formato válido (ejemplo@dominio.com).' },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser && existingUser.emailVerified) {
      return NextResponse.json(
        { error: 'Ya existe un usuario con este correo electrónico verificado.' },
        { status: 409 }
      );
    }

    // Generar código de 6 dígitos
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 min

    // Enviar correo local
    await sendVerificationEmail(email, name, code);

    return NextResponse.json({
      success: true,
      message: 'Código de verificación enviado al correo.',
      code, // Para pruebas locales / desarrollo si se desea usar directamente
      expires,
    });
  } catch (error: any) {
    console.error('Error enviando código de verificación:', error);
    return NextResponse.json({ error: 'Error al enviar código de verificación.' }, { status: 500 });
  }
}
