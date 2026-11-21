import nodemailer from 'nodemailer';

/**
 * Sends the "new message" notification. Configure SMTP in .env.local:
 *   SMTP_HOST, SMTP_PORT (465 or 587), SMTP_USER, SMTP_PASS
 *   CONTACT_TO   (optional: where to send; defaults to SMTP_USER)
 *   CONTACT_FROM (optional: defaults to SMTP_USER)
 * Without SMTP settings nothing is sent (messages still appear in Admin > Messages).
 * Returns true when the mail was accepted by the SMTP server.
 */
export async function sendContactMail(m: { name: string; email: string; message: string }, fallbackTo?: string): Promise<boolean> {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, CONTACT_TO, CONTACT_FROM } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    console.warn('[contact] SMTP is not configured: saved the message but sent no email.');
    return false;
  }
  const to = CONTACT_TO || fallbackTo || SMTP_USER;
  const port = Number(SMTP_PORT) || 587;
  try {
    const transport = nodemailer.createTransport({
      host: SMTP_HOST, port, secure: port === 465, auth: { user: SMTP_USER, pass: SMTP_PASS },
      connectionTimeout: 8000, greetingTimeout: 8000, socketTimeout: 10000,
    });
    // strip line breaks so visitors cannot inject mail headers
    const clean = (v: string) => v.replace(/[\r\n]+/g, ' ').trim();
    await transport.sendMail({
      from: `"Portfolio contact" <${CONTACT_FROM || SMTP_USER}>`,
      to,
      replyTo: `"${clean(m.name).replace(/"/g, '')}" <${clean(m.email)}>`,
      subject: `New portfolio message from ${clean(m.name)}`,
      text: `From: ${clean(m.name)} <${clean(m.email)}>\n\n${m.message}`,
    });
    return true;
  } catch (err) {
    console.error('[contact] email failed:', (err as Error).message);
    return false;
  }
}
