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
                <div style="padding:28px 32px;background:#fafbfa;border-bottom:1px solid #eaeee9;text-align:center;">
                  <div style="font-size:22px;font-weight:700;letter-spacing:-0.01em;color:#1a2e1f;">
                    ${escapeHtml(head)}<span style="color:${accent};">${escapeHtml(tail)}</span>
                  </div>
                </div>
                <div style="padding:40px 44px 8px 44px;">
                  ${paragraphs}
                </div>
                <div style="padding:0 44px 40px 44px;">
                  <div style="margin-top:12px;padding:22px 24px;border-radius:10px;background:#fafbfa;border:1px solid #eaeee9;">
                    <div style="font-size:13px;font-weight:600;color:#1a2e1f;margin:0 0 14px 0;letter-spacing:0.02em;text-transform:uppercase;">Der weitere Ablauf</div>
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="padding:0 0 12px 0;font-size:14px;line-height:1.6;color:#3b4a3f;">
                          <strong style="color:#1a2e1f;">1. Prüfung der Unterlagen.</strong> Unser Team sichtet deine Bewerbung sorgfältig.
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:0 0 12px 0;font-size:14px;line-height:1.6;color:#3b4a3f;">
                          <strong style="color:#1a2e1f;">2. Persönliche Rückmeldung.</strong> Innerhalb weniger Werktage erhältst du eine Nachricht von uns.
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:0;font-size:14px;line-height:1.6;color:#3b4a3f;">
                          <strong style="color:#1a2e1f;">3. Kennenlerngespräch.</strong> Bei passender Qualifikation laden wir dich zu einem Gespräch ein.
                        </td>
                      </tr>
                    </table>
                  </div>
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 8px 0 8px;">
                <div style="font-size:12px;line-height:1.6;color:#6b7a70;text-align:center;">
                  <div style="font-weight:600;color:#3b4a3f;">${companyName}</div>
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
