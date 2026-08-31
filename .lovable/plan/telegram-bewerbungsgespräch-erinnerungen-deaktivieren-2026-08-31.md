# Telegram: Bewerbungsgespräch-Erinnerungen deaktivieren

Erinnerungen werden über die Schalter pro Telegram-Empfänger gesteuert (`interview-reminder` nutzt `notify_interviews`, `onboarding-reminder` nutzt `notify_onboarding`). Es gibt drei aktive Empfänger; nur einer hat Interview-Benachrichtigungen aktiviert.

## Änderung

- Bei dem einen Empfänger mit aktiven Interview-Benachrichtigungen `notify_interviews` auf aus setzen.
- `notify_onboarding` bleibt unverändert aktiviert — Erinnerungen für Onboarding-Termine laufen weiter.

Kein Code- oder Schema-Change nötig, nur ein Daten-Update.
