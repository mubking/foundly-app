const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || "support@foundly.app";
const BRAND_COLOR = "#4F46E5";
const FONT_STACK =
  "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

/**
 * Escapes a value for safe interpolation into HTML. Every dynamic string
 * that ends up in an email's `bodyHtml` (chat text, sender/claimant names,
 * item titles — all user-supplied) must be passed through this first;
 * `renderEmailHtml` itself only escapes `heading`/`preheader`, since
 * `bodyHtml` is treated as already-safe markup.
 */
export function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderButton(ctaText, ctaUrl) {
  if (!ctaText || !ctaUrl) return "";

  // Table-based button, not a styled <a> — Outlook's Word rendering engine
  // ignores padding/border-radius on anchors, so a table cell is what
  // actually renders as a solid, tappable button there.
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:28px 0;">
      <tr>
        <td style="background-color:${BRAND_COLOR};border-radius:8px;" align="center">
          <a href="${ctaUrl}" target="_blank" style="display:inline-block;padding:14px 32px;font-size:16px;line-height:20px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px;font-family:${FONT_STACK};">${escapeHtml(
    ctaText
  )}</a>
        </td>
      </tr>
    </table>`;
}

/**
 * Foundly's single shared HTML email shell — wordmark header, heading,
 * body, optional CTA button, support + copyright footer, on a centered
 * responsive card. Every outgoing email renders through this; nothing
 * else in the codebase builds email HTML. Table-based layout (not
 * flex/grid) and inline styles throughout so it survives Outlook's Word
 * engine as well as Gmail/Apple Mail/Yahoo, plus a `<style>` media query
 * for clients that do support it (Gmail/Apple Mail mobile, Outlook.com).
 *
 * @param {object} params
 * @param {string} params.heading - Plain text; escaped here.
 * @param {string} params.bodyHtml - Pre-built HTML; caller is responsible for escaping any dynamic values inside it (see {@link escapeHtml}).
 * @param {string} [params.preheader] - Hidden inbox-preview snippet; plain text, escaped here.
 * @param {string} [params.ctaText]
 * @param {string} [params.ctaUrl]
 */
export function renderEmailHtml({ heading, bodyHtml, preheader = "", ctaText, ctaUrl }) {
  const year = new Date().getFullYear();

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="color-scheme" content="light" />
    <title>${escapeHtml(heading)}</title>
    <style>
      body, table, td { font-family: ${FONT_STACK}; }
      @media only screen and (max-width: 480px) {
        .container { width: 100% !important; }
        .content-padding { padding-left: 20px !important; padding-right: 20px !important; }
      }
    </style>
  </head>
  <body style="margin:0;padding:0;background-color:#F3F4F6;">
    <span style="display:none;font-size:1px;color:#F3F4F6;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${escapeHtml(
      preheader
    )}</span>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#F3F4F6;">
      <tr>
        <td align="center" style="padding:40px 16px;">
          <table role="presentation" class="container" width="480" cellpadding="0" cellspacing="0" border="0" style="width:480px;max-width:100%;background-color:#ffffff;border-radius:12px;">
            <tr>
              <td class="content-padding" style="padding:32px 32px 8px;">
                <span style="font-size:20px;font-weight:800;letter-spacing:-0.5px;color:${BRAND_COLOR};">Foundly</span>
              </td>
            </tr>
            <tr>
              <td class="content-padding" style="padding:16px 32px 8px;">
                <h1 style="margin:0 0 16px;font-size:20px;line-height:28px;color:#111827;">${escapeHtml(
                  heading
                )}</h1>
                <div style="font-size:15px;line-height:24px;color:#374151;">${bodyHtml}</div>
                ${renderButton(ctaText, ctaUrl)}
              </td>
            </tr>
            <tr>
              <td class="content-padding" style="padding:24px 32px 32px;">
                <hr style="border:none;border-top:1px solid #E5E7EB;margin:0 0 16px;" />
                <p style="margin:0 0 8px;color:#6B7280;font-size:13px;line-height:20px;">
                  Need help? Contact us at <a href="mailto:${SUPPORT_EMAIL}" style="color:${BRAND_COLOR};text-decoration:none;">${SUPPORT_EMAIL}</a>.
                </p>
                <p style="margin:0;color:#9CA3AF;font-size:12px;">&copy; ${year} Foundly. All rights reserved.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
