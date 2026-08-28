# Domain-Korrekturen & Startseiten-Card auf /auth

## 1. Buchungslink in der Einladungs-E-Mail korrigieren

In `supabase/functions/send-interview-invite/index.ts` (Zeile 214) steht der Buchungslink für Bewerbungsgespräche auf der falschen Domain:

```text
Aktuell:  https://app.sekretariat-24.de/bewerbungsgespraech/{token}
Neu:      https://app.sekretariat24.app/bewerbungsgespraech/{token}
```

Die Edge Function wird anschließend neu deployed, damit zukünftige E-Mails den korrekten Link enthalten.

Hinweis: Die alte Domain kommt auch in anderen Edge Functions (Telegram, Erinnerungen) und im Mitarbeiter-Portal-Link vor (z. B. `create-employee-account`). Die bleiben in diesem Schritt unverändert, da hier nur die Bewerbungsgespräch-E-Mail beanstandet wurde – auf Wunsch kann ich die im selben Zug mit umstellen.

## 2. E-Mail-Adresse auf /auth korrigieren

In `src/pages/Auth.tsx` (Login-Formular, unten) steht aktuell `info@sekretariat-24.de` (Text + mailto-Link). Beide werden auf `info@sekretariat24.app` geändert.

## 3. Neue Card in der linken Hälfte von /auth

Im `BrandingPanel` von `src/pages/Auth.tsx` kommt eine neue Karte hinzu, die auf die Startseite verweist:

- Position: im unteren Bereich der linken Hälfte, über/unter der Wave-Animation bzw. Feature-Reihe (optisch passend zum bestehenden `bg-white/5`-Glass-Stil).
- Inhalt: kurzer Titel/Teaser (z. B. „Unsere Startseite") plus Link/Button „Zur Startseite" mit `ExternalLink`-Icon.
- Verlinkung: `https://web.sekretariat24.app`, öffnet in neuem Tab (`target="_blank" rel="noopener"`).
- Styling: konsistent mit den vorhandenen Glass-Cards (runde Ecken, dezente Border, Hover-Effekt in Akzentgrün).

## Technik

- 1 Zeile in `supabase/functions/send-interview-invite/index.ts` + Deploy via `deploy_edge_functions`.
- Kleine Edits in `src/pages/Auth.tsx` (E-Mail, neue Card-Komponente im BrandingPanel).
- Keine Datenbankänderungen nötig.
