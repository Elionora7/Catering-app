import nodemailer from 'nodemailer'
import type { SentMessageInfo } from 'nodemailer'

/**
 * Production SMTP: STARTTLS on port 587 (`secure: false`).
 * Requires SMTP_HOST, SMTP_USER, and SMTP_PASS. TLS is verified by Node (standard CA trust).
 */
export function createSmtpTransport(): nodemailer.Transporter | null {
  const host = process.env.SMTP_HOST
  if (!host || !process.env.SMTP_USER || !process.env.SMTP_PASS) return null

  const allowSelfSigned = process.env.SMTP_ALLOW_SELF_SIGNED === 'true'
  const requireTls = process.env.SMTP_REQUIRE_TLS !== 'false'

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    requireTLS: requireTls,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: {
      // Some hosting providers expose an SMTP cert chain with self-signed intermediates.
      // Keep strict verification by default and allow opt-in relaxation via env for dev/provisioning.
      rejectUnauthorized: !allowSelfSigned,
    },
  })
}

/** Sends mail with consistent [mailer] logs; rethrows on failure. */
export async function sendMailWithLogging(
  transporter: nodemailer.Transporter,
  options: nodemailer.SendMailOptions
): Promise<SentMessageInfo> {
  console.log('[mailer] Sending email via:', process.env.SMTP_HOST, process.env.SMTP_PORT)
  try {
    const result = await transporter.sendMail(options)
    console.log('[mailer] Email sent successfully')
    return result
  } catch (error) {
    console.error('[mailer] Email failed:', error)
    throw error
  }
}
