export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'

export async function POST(req: Request) {
  try {
    const { token, email, password } = await req.json()
    if (!token || !email || !password) {
      return NextResponse.json({ error: 'Todos los campos son obligatorios' }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'La contraseña debe tener al menos 6 caracteres' }, { status: 400 })
    }

    const emailTrimmed = email.trim()

    // Find the token (try exact match first, then case-insensitive)
    let verificationToken = await prisma.verificationToken.findFirst({
      where: { identifier: emailTrimmed, token },
    })
    if (!verificationToken) {
      // Try case-insensitive lookup for tokens stored with original casing
      const allTokens = await prisma.verificationToken.findMany({
        where: { token },
      })
      verificationToken = allTokens.find(
        (t) => t.identifier.toLowerCase() === emailTrimmed.toLowerCase()
      ) ?? null
    }

    if (!verificationToken) {
      return NextResponse.json({ error: 'El enlace no es válido o ya ha sido utilizado' }, { status: 400 })
    }

    // Check expiry
    if (new Date() > verificationToken.expires) {
      await prisma.verificationToken.deleteMany({
        where: { identifier: verificationToken.identifier, token },
      })
      return NextResponse.json({ error: 'El enlace ha expirado. Solicita uno nuevo.' }, { status: 400 })
    }

    // Find user (case-insensitive)
    const user = await prisma.user.findFirst({
      where: { email: { equals: emailTrimmed, mode: 'insensitive' } },
    })
    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    // Update password
    const hashed = await bcrypt.hash(password, 12)
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashed },
    })

    // Delete the used token
    await prisma.verificationToken.deleteMany({
      where: { identifier: verificationToken.identifier },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Reset password error:', error)
    return NextResponse.json({ error: 'Error al restablecer la contraseña' }, { status: 500 })
  }
}
