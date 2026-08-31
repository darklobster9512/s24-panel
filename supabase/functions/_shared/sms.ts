// Shared seven.io SMS helper for interview notifications.

export function normalizePhone(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let s = String(raw).trim();
  const hadPlus = s.startsWith('+');
  s = s.replace(/[^\d]/g, '');
  if (!s) return null;
  let e164: string;
  if (hadPlus) {
    e164 = `+${s}`;
  } else if (s.startsWith('00')) {
    e164 = `+${s.slice(2)}`;
  } else if (s.startsWith('0')) {
    e164 = `+49${s.replace(/^0+/, '')}`;
  } else if (s.startsWith('49')) {
    e164 = `+${s}`;
  } else {
    e164 = `+49${s}`;
  }
  return /^\+[1-9]\d{7,14}$/.test(e164) ? e164 : null;
}

export type SmsResult = { ok: boolean; skipped?: string; error?: string };

type SendSmsInput = {
  admin: any;
  apiKey?: string | null;
  senderName?: string | null;
  enabled?: boolean | null;
  rawPhone: string | null | undefined;
  message: string;
  applicationId?: string | null;
};

/** Sends one SMS via seven.io and always writes an sms_logs entry. Never throws. */
export async function sendSms(input: SendSmsInput): Promise<SmsResult> {
  const { admin, apiKey, senderName, enabled, rawPhone, message, applicationId } = input;
  try {
    if (!enabled) return { ok: false, skipped: 'disabled' };
    if (!apiKey) return { ok: false, skipped: 'not_configured' };

    const to = normalizePhone(rawPhone);
    if (!to) {
      await admin.from('sms_logs').insert({
        application_id: applicationId ?? null,
        recipient: rawPhone ?? '',
        normalized_recipient: null,
        message,
        status: 'invalid_number',
        error: 'Rufnummer konnte nicht in das internationale Format gebracht werden',
      });
      return { ok: false, error: 'invalid_number' };
    }

    const sender = (senderName ?? '').replace(/[^A-Za-z0-9]/g, '').slice(0, 11);

    const res = await fetch('https://gateway.seven.io/api/sms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'X-Api-Key': apiKey,
      },
      body: JSON.stringify({
        to: to.replace(/^\+/, ''),
        text: message,
        ...(sender ? { from: sender } : {}),
      }),
    });
    const raw = await res.text();
    let success = res.ok;
    let errorMsg: string | null = null;
    try {
      const j = JSON.parse(raw);
      if (j && typeof j.success !== 'undefined') {
        success = String(j.success) === '100';
        if (!success) errorMsg = `seven code ${j.success}`;
      }
    } catch {
      const codeNum = raw.trim().split('\n')[0];
      if (/^\d+$/.test(codeNum)) {
        success = codeNum === '100';
        if (!success) errorMsg = `seven code ${codeNum}`;
      }
    }
    if (!success && !errorMsg) errorMsg = raw.slice(0, 300);

    await admin.from('sms_logs').insert({
      application_id: applicationId ?? null,
      recipient: rawPhone ?? '',
      normalized_recipient: to,
      message,
      status: success ? 'sent' : 'failed',
      error: success ? null : errorMsg,
    });

    return success ? { ok: true } : { ok: false, error: errorMsg ?? 'send_failed' };
  } catch (e) {
    console.error('sms failed', e);
    return { ok: false, error: String(e) };
  }
}

export function renderSmsTemplate(tpl: string, vars: Record<string, string>) {
  return tpl.replace(/\{(\w+)\}/g, (_m, k) => vars[k] ?? '');
}

const WEEKDAYS_DE = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];

/** 'YYYY-MM-DD' -> 'Montag, 31.08.2026' */
export function formatDateDeShort(iso: string) {
  const [y, m, d] = iso.split('-');
  const wd = WEEKDAYS_DE[new Date(`${iso}T12:00:00Z`).getUTCDay()] ?? '';
  return `${wd}, ${d}.${m}.${y}`;
}
