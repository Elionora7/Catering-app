import nodemailer from 'nodemailer'
import type { SentMessageInfo } from 'nodemailer'

let warnedTruncatedMailFrom = false

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

/**
 * Builds the RFC 5322 `From` header. Handles a common production mistake: unquoted `EMAIL_FROM` in Vercel
 * (or shells) is often truncated at the first space (e.g. only `Eliora`), which is not a valid sender and
 * causes SMTP to reject the message. If `EMAIL_FROM`/`SMTP_FROM` has no `@`, we combine `EMAIL_FROM_NAME`
 * (or the truncated fragment) with `SMTP_USER`.
 *
 * Optional `fallbackDisplayName` matches previous per-mailer defaults (`Eliora Orders`, `Quotes`, etc.).
 */
export function resolveMailFromHeader(options?: { fallbackDisplayName?: string }): string | undefined {
  const smtpUser = process.env.SMTP_USER?.trim()
  if (!smtpUser?.includes('@')) return undefined

  const fallbackName = options?.fallbackDisplayName ?? 'Eliora Quotes'
  const explicitName = process.env.EMAIL_FROM_NAME?.trim() || process.env.SMTP_FROM_NAME?.trim()
  const raw = (process.env.EMAIL_FROM || process.env.SMTP_FROM || '').trim()

  if (raw.includes('@')) {
    return raw
  }

  if (raw && !raw.includes('@') && !warnedTruncatedMailFrom) {
    warnedTruncatedMailFrom = true
    console.warn(
      '[mailer] EMAIL_FROM/SMTP_FROM has no @ (often from unquoted env — value stops at the first space). Using SMTP_USER + display name. Fix: quote the full value in Vercel, or set EMAIL_FROM_NAME.'
    )
  }

  const displayName = explicitName || (raw ? raw : fallbackName)
  return `${displayName} <${smtpUser}>`
}

/**
 * Many SMTP hosts require the envelope MAIL FROM to match the authenticated mailbox.
 * Without this, same-domain "To" can work while external addresses (e.g. Gmail) are deferred or rejected.
 */
export function getSmtpEnvelopeFrom(): { from: string } | undefined {
  const u = process.env.SMTP_USER?.trim()
  if (!u || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(u)) return undefined
  return { from: u }
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
