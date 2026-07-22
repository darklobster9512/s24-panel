// Shared HTML email builder for the application confirmation mail.
// Kept in sync with supabase/functions/submit-application/index.ts

export type ApplicationEmailInput = {
  subject: string;
  bodyText: string; // plain text body, may contain {{placeholders}} and line breaks
  vars: Record<string, string>;
  company: {
    name: string;
    address?: string | null;
    logoText?: string | null; // e.g. "Sekreteriat24"
    accent?: string | null; // hex like #7bed9f
  };
};

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function renderTemplate(tpl: string, vars: Record<string, string>) {
  return tpl.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k) => vars[k] ?? "");
}

function textToParagraphs(text: string) {
  const rendered = escapeHtml(text.trim());
  const blocks = rendered
    .split(/\n{2,}/)
    .map((b) => b.replace(/\n/g, " ").replace(/\s+/g, " ").trim())
    .filter(Boolean);
  return blocks
    .map(
      (b) =>
        `<p style="margin:0 0 24px 0;font-size:15px;line-height:1.75;color:#1a2e1f;">${b}</p>`,
    )
    .join("");
}

function splitLogo(logoText: string) {
  const m = logoText.match(/^(.*?)(\d+)$/);
  if (m) return { head: m[1], tail: m[2] };
  return { head: logoText, tail: "" };
}

export function renderApplicationEmailHtml(input: ApplicationEmailInput) {
  const accent = input.company.accent || "#7bed9f";
  const accentDark = "#2fa363";
  const accentTintSoft = "#f0fbf4";
  const accentTint = "#f4fbf6";
  const accentBorder = "#d9f2e2";
  const subject = renderTemplate(input.subject, input.vars);
  const bodyRendered = renderTemplate(input.bodyText, input.vars);
  const paragraphs = textToParagraphs(bodyRendered);
  const logoText = input.company.logoText || input.company.name || "Sekreteriat24";
  const { head, tail } = splitLogo(logoText);
  const companyName = escapeHtml(input.company.name || logoText);
  const address = input.company.address
    ? escapeHtml(input.company.address).replace(/\n/g, " · ")
    : "";
  const preheader = escapeHtml(subject).slice(0, 140);

  const step = (n: number, title: string, body: string) => `
    <tr>
      <td style="padding:0 0 14px 0;vertical-align:top;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
          <td width="28" style="vertical-align:top;">
            <div style="width:26px;height:26px;border-radius:999px;background:${accent};color:#0f1a2e;font-size:13px;font-weight:700;text-align:center;line-height:26px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">${n}</div>
          </td>
          <td style="padding-left:12px;font-size:14px;line-height:1.6;color:#3b4a3f;">
            <div style="color:#1a2e1f;font-weight:600;margin-bottom:2px;">${title}</div>
            <div>${body}</div>
          </td>
        </tr></table>
      </td>
    </tr>`;

  return `<!doctype html>
<html lang="de">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <meta name="color-scheme" content="light" />
    <meta name="supported-color-schemes" content="light" />
    <title>${escapeHtml(subject)}</title>
  </head>
  <body style="margin:0;padding:0;background:#f5f7f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${preheader}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f5f7f5;">
      <tr>
        <td align="center" style="padding:40px 16px;">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;">
            <tr>
              <td style="background:#ffffff;border-radius:14px;box-shadow:0 1px 2px rgba(16,24,20,0.04),0 8px 24px rgba(16,24,20,0.06);overflow:hidden;border:1px solid #eaeee9;">
                <div style="padding:32px 32px;background:#0f1a2e;text-align:center;">
                  <div style="font-size:22px;font-weight:700;letter-spacing:-0.01em;color:#ffffff;">
                    ${escapeHtml(head)}<span style="color:${accent};">${escapeHtml(tail)}</span>
                  </div>
                </div>
                <div style="height:3px;background:${accent};line-height:3px;font-size:0;">&nbsp;</div>
                <div style="padding:40px 44px 8px 44px;">
                  <div style="margin:0 0 24px 0;">
                    ${paragraphs}
                  </div>
                </div>

                <div style="padding:0 44px 40px 44px;">
                  <div style="margin-top:12px;padding:22px 24px;border-radius:10px;background:${accentTint};border:1px solid ${accentBorder};">
                    <div style="font-size:13px;font-weight:700;color:${accentDark};margin:0 0 16px 0;letter-spacing:0.06em;text-transform:uppercase;">Der weitere Ablauf</div>
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                      ${step(1, "Prüfung der Unterlagen", "Unser Team sichtet deine Bewerbung sorgfältig.")}
                      ${step(2, "Persönliche Rückmeldung", "Innerhalb weniger Werktage erhältst du eine Nachricht von uns.")}
                      ${step(3, "Kennenlerngespräch", "Bei passender Qualifikation laden wir dich zu einem Gespräch ein.")}
                    </table>
                  </div>
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 8px 0 8px;">
                <div style="height:1px;background:${accentBorder};margin:0 auto 16px auto;max-width:120px;line-height:1px;font-size:0;">&nbsp;</div>
                <div style="font-size:12px;line-height:1.6;color:#6b7a70;text-align:center;">
                  <div style="font-weight:700;color:${accentDark};letter-spacing:0.02em;">${companyName}</div>
                  ${address ? `<div>${address}</div>` : ""}
                  <div style="margin-top:10px;">Diese E-Mail wurde automatisch versendet. Bitte antworte nicht direkt auf diese Nachricht.</div>
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}


export function renderApplicationEmailText(input: ApplicationEmailInput) {
  return renderTemplate(input.bodyText, input.vars);
}
