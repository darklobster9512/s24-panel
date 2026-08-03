## Ziel

Sobald ein Mitarbeiter seinen Arbeitsvertrag unterzeichnet und einreicht (Status wechselt auf `pending_admin`), geht eine Telegram-Nachricht an die konfigurierten Empfänger.

## Umsetzung

**1. Datenbank (Migration)**
- Neue Spalte `notify_contracts boolean not null default true` in `public.telegram_recipients`.

**2. Neue Edge Function `contract-signed-notify`**
- Wird vom Mitarbeiter-Frontend direkt nach erfolgreicher Signatur mit der Vertrags-ID aufgerufen (JWT des eingeloggten Mitarbeiters).
- Validiert per Service-Role: Vertrag existiert, gehört zum aufrufenden User (`employees.user_id = auth uid`) und hat Status `pending_admin`.
- Lädt Name, Vertragsvorlage, Vertragsart/Gehalt und ruft intern `telegram-notify` mit `x-notify-secret` und `type: "contract"` auf.
- Fehler beim Telegram-Versand blockieren die Signatur nicht (nur Logging).

**3. `telegram-notify` erweitern**
- Neuer Typ `contract` in der Typprüfung und in `buildMessage`:
  ```
  📝 Arbeitsvertrag eingereicht
  👤 Name
  📄 Vorlage · Vertragsart
  🕓 Zeitstempel
  Button → /superadmin/arbeitsvertraege/<id>
  ```
- Empfängerfilter nutzt für diesen Typ die Spalte `notify_contracts`.

**4. Frontend `src/pages/mitarbeiter/Arbeitsvertrag.tsx`**
- Im `onSuccess` der `signMutation` zusätzlich `supabase.functions.invoke("contract-signed-notify", { body: { contract_id } })` — fehlertolerant (kein Toast-Fehler bei Telegram-Problemen).

**5. Einstellungen `src/pages/superadmin/Telegram.tsx`**
- Dritter Toggle „Arbeitsverträge" pro Empfänger, analog zu Bewerbungen/Gespräche.

## Technische Details
- `contract-signed-notify` läuft mit Standard-JWT-Verifizierung in Code (Auth-Header wird geprüft); kein `verify_jwt = false` Eintrag nötig, Authentifizierung erfolgt via `supabase.auth.getClaims`.
- Genutzte Secrets sind bereits vorhanden: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_NOTIFY_SECRET`.
