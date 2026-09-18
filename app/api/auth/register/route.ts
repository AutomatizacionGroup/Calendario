import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const { name, email, phone, role, password } = await req.json();

    if (!name || !email || !password || !phone) {
      return NextResponse.json(
        { error: 'Todos los campos son obligatorios (Nombre, Email, Teléfono, Contraseña).' },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Ya existe un usuario registrado con este correo electrónico.' },
        { status: 409 }
      );
    }

    const hashedPassword = await hashPassword(password);
    const validRole = ['BOSS', 'EMPLOYEE', 'THIRD_PARTY'].includes(role) ? role : 'EMPLOYEE';

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        phone,
        role: validRole,
        password: hashedPassword,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ user: newUser, message: 'Usuario registrado con éxito.' });
  } catch (error: any) {
    console.error('Error en registro:', error);
    return NextResponse.json({ error: 'Error al registrar el usuario.' }, { status: 500 });
  }
}
