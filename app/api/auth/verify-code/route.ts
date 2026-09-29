import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { inputCode, expectedCode } = await req.json();

    if (!inputCode || !expectedCode) {
      return NextResponse.json(
        { error: 'El código ingresado y el código esperado son requeridos.' },
        { status: 400 }
      );
    }

    if (inputCode.trim() !== expectedCode.trim()) {
      return NextResponse.json(
        { error: 'Código de verificación incorrecto. Por favor verifica tu correo.' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      verified: true,
      message: 'Correo electrónico verificado exitosamente.',
    });
  } catch (error: any) {
    console.error('Error al verificar código:', error);
    return NextResponse.json({ error: 'Error al verificar el código.' }, { status: 500 });
  }
}
