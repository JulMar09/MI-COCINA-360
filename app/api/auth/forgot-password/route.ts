export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { prisma } from '@/lib/db'

export async function POST(req: Request) {
  try {
    const { email } = await req.json()
    if (!email) {
      return NextResponse.json({ error: 'El email es obligatorio' }, { status: 400 })
    }

    const normalizedEmail = email.toLowerCase().trim()
    const user = await prisma.user.findFirst({
      where: { email: { equals: normalizedEmail, mode: 'insensitive' } },
    })

    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json({ success: true })
    }

    // Generate secure token
    const token = crypto.randomBytes(32).toString('hex')
    const expires = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    const userEmail = user.email // Use the exact email from the database

    // Delete any existing tokens for this email
    await prisma.verificationToken.deleteMany({
      where: { identifier: userEmail },
    })

    // Store the token
    await prisma.verificationToken.create({
      data: {
        identifier: userEmail,
        token,
        expires,
      },
    })

    // Build the reset URL
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const resetUrl = `${baseUrl}/reset-password?token=${token}&email=${encodeURIComponent(userEmail)}`

    // Send the email
    const appUrl = process.env.NEXTAUTH_URL || ''
    let appHostname = 'micocina360'
    try { appHostname = new URL(appUrl).hostname.split('.')[0] || 'micocina360' } catch {}

    const htmlBody = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
        <div style="background: linear-gradient(135deg, #065f46 0%, #047857 100%); padding: 32px 24px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700;">MI COCINA 360</h1>
          <p style="color: #a7f3d0; margin: 8px 0 0; font-size: 14px;">Gestión profesional de cocinas</p>
        </div>
        <div style="padding: 32px 24px;">
          <h2 style="color: #1f2937; margin: 0 0 16px; font-size: 20px;">Recuperar contraseña</h2>
          <p style="color: #4b5563; line-height: 1.6; margin: 0 0 24px;">
            Hemos recibido una solicitud para restablecer la contraseña de tu cuenta.
            Haz clic en el botón de abajo para crear una nueva contraseña.
          </p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${resetUrl}" style="display: inline-block; background: #047857; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
              Restablecer contraseña
            </a>
          </div>
          <p style="color: #6b7280; font-size: 13px; line-height: 1.5;">
            Este enlace expirará en <strong>1 hora</strong>.
          </p>
          <p style="color: #6b7280; font-size: 13px; line-height: 1.5;">
            Si no solicitaste el cambio de contraseña, puedes ignorar este correo. Tu contraseña actual seguirá siendo la misma.
          </p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
          <p style="color: #9ca3af; font-size: 12px; line-height: 1.5;">
            Si el botón no funciona, copia y pega este enlace en tu navegador:<br />
            <a href="${resetUrl}" style="color: #047857; word-break: break-all;">${resetUrl}</a>
          </p>
        </div>
      </div>
    `

    try {
      const response = await fetch('https://apps.abacus.ai/api/sendNotificationEmail', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.ABACUSAI_API_KEY}`,
        },
        body: JSON.stringify({
          app_id: process.env.WEB_APP_ID,
          notification_id: process.env.NOTIF_ID_PASSWORD_RESET,
          subject: 'Recuperar contraseña — MI COCINA 360',
          body: htmlBody,
          is_html: true,
          recipient_email: userEmail,
          sender_email: `noreply@${(() => { try { return new URL(appUrl).hostname } catch { return 'mail.abacusai.app' } })()}`,
          sender_alias: 'MI COCINA 360',
        }),
      })
      const result = await response.json()
      if (!result.success && !result.notification_disabled) {
        console.error('Email send failed:', result)
      }
    } catch (emailErr) {
      console.error('Error sending reset email:', emailErr)
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Forgot password error:', error)
    return NextResponse.json({ error: 'Error al procesar la solicitud' }, { status: 500 })
  }
}
