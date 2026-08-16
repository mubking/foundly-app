import nodemailer from "nodemailer";
import { renderEmailHtml, escapeHtml } from "./emailTemplate";

const EMAIL_FROM = process.env.EMAIL_FROM || "Foundly <no-reply@foundly.app>";

let cachedTransporter = null;

/**
 * Lazily builds (and caches) the outgoing mail transport.
 *
 * When SMTP_HOST/SMTP_USER/SMTP_PASS are configured, real email is sent
 * through that server. Without them:
 *  - in production, sending throws a clear, caller-catchable error instead
 *    of silently pretending to succeed (misconfigured prod SMTP should be
 *    loud in logs, not invisible).
 *  - anywhere else (local dev, no SMTP provider provisioned), mail is
 *    logged instead of sent, so flows like password reset still run
 *    end-to-end without requiring real credentials.
 */
function getTransporter() {
  if (cachedTransporter) return cachedTransporter;

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;

  if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
    cachedTransporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT) || 587,
      secure: Number(SMTP_PORT) === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });
  } else if (process.env.NODE_ENV === "production") {
    cachedTransporter = {
      sendMail: async (mail) => {
        console.error(
          "[mailer] Misconfigured: SMTP_HOST/SMTP_USER/SMTP_PASS are not set in production — email not sent:",
          { to: mail.to, subject: mail.subject }
        );
        throw new Error(
          "Email is not configured: set SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASS"
        );
      },
    };
  } else {
    cachedTransporter = {
      sendMail: async (mail) => {
        console.warn(
          "[mailer] SMTP is not configured (set SMTP_HOST/SMTP_USER/SMTP_PASS) — email not sent:",
          { to: mail.to, subject: mail.subject }
        );
        return { messageId: "smtp-not-configured" };
      },
    };
  }

  return cachedTransporter;
}

// Strips header-injection characters (CR/LF) from anything interpolated
// into a subject line. Titles are currently always server-built strings
// (some incorporating user-supplied names — see sendNotificationEmail),
// so this is cheap, defensive normalization rather than a known exploit.
function toSafeSubject(value) {
  return String(value).replace(/[\r\n]+/g, " ").trim();
}

export async function sendPasswordResetEmail(to, code) {
  const transporter = getTransporter();
  const subject = "Reset your Foundly password";

  // Foundly doesn't have a public web domain yet (see .env.local's
  // NEXT_PUBLIC_APP_URL, still a localhost placeholder), so this can't be a
  // real https:// reset link today — an https link pointing at localhost or
  // a made-up production domain would just be a second broken button. A
  // `foundly://` deep link is the legitimate mobile-native equivalent: it
  // opens the app directly (only works from a device with Foundly
  // installed, e.g. tapping the email on the same phone — desktop/webmail
  // clicks will fail with "no app found", which is expected). The 6-digit
  // code above is what actually completes the reset, works everywhere, and
  // is enough on its own — this button is a convenience shortcut for the
  // common case, not the only supported path. See mobile/app.json's
  // `scheme` and navigation/AppNavigator.js's `linking` config.
  const deepLink = `foundly://reset-password?email=${encodeURIComponent(to)}&code=${code}`;

  const info = await transporter.sendMail({
    from: EMAIL_FROM,
    to,
    subject,
    text: `Your Foundly password reset code is ${code}. It expires in 15 minutes.\n\nOn your phone with Foundly installed, you can also open ${deepLink} to jump straight to the reset screen with this code filled in.\n\nIf you didn't request this, you can safely ignore this email.`,
    html: renderEmailHtml({
      preheader: `Your password reset code is ${code}`,
      heading: "Reset your password",
      bodyHtml: `
        <p style="margin:0 0 16px;">Use this code to reset your Foundly password. It expires in 15 minutes.</p>
        <p style="margin:0 0 16px;font-size:30px;font-weight:700;letter-spacing:8px;color:#111827;">${code}</p>
        <p style="margin:0;color:#6B7280;font-size:13px;">If you didn't request this, you can safely ignore this email — your password won't change.</p>
      `,
      ctaText: "Open Foundly App",
      ctaUrl: deepLink,
    }),
  });

  // Dev-only visibility into the actual SMTP result — never logs the code,
  // password, or SMTP_PASS. "accepted" means Gmail's MX queued the message
  // for delivery, not that it landed in the recipient's inbox.
  if (process.env.NODE_ENV !== "production") {
    console.log(
      "[mailer] EMAIL SENT " +
        JSON.stringify({
          to,
          from: EMAIL_FROM,
          subject,
          messageId: info?.messageId,
          accepted: info?.accepted,
          rejected: info?.rejected,
          response: info?.response,
        })
    );
  }

  return info;
}

/**
 * Emails a copy of an in-app notification (claim submitted/approved/
 * rejected, new message, ...). Called from lib/notifications.js's notify()
 * — gated there on the recipient's User.emailNotifications preference, so
 * this itself doesn't check it.
 *
 * `title`/`message` are frequently built from user-supplied data (sender
 * name, chat text, item title) — escaped before going into HTML; the
 * plain-text part needs no escaping.
 *
 * @param {string} to
 * @param {{title: string, message: string}} notification
 */
export async function sendNotificationEmail(to, { title, message }) {
  const transporter = getTransporter();

  await transporter.sendMail({
    from: EMAIL_FROM,
    to,
    subject: toSafeSubject(title),
    text: `${message}\n\nYou're receiving this because email notifications are enabled for your Foundly account. You can turn them off anytime in Settings.`,
    html: renderEmailHtml({
      preheader: message,
      heading: title,
      bodyHtml: `
        <p style="margin:0 0 16px;">${escapeHtml(message)}</p>
        <p style="margin:0;color:#6B7280;font-size:13px;">You're receiving this because email notifications are enabled for your Foundly account. You can turn them off anytime in Settings.</p>
      `,
    }),
  });
}
