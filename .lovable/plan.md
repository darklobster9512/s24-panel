# Onboarding für Mitarbeiter

Neuer Onboarding-Bereich: Superadmin aktiviert Onboarding pro Mitarbeiter, wählt das Telefonsystem (Sipgate oder Placetel/Webex) und hinterlegt Zugangsdaten. Der Mitarbeiter sieht diese auf einer eigenen Onboarding-Seite mit Download-Links.

## Datenbank

Neue Spalten in `employees`:
- `onboarding_enabled` (ja/nein, Standard: nein)
- `phone_system` (`sipgate` oder `placetel`)
- `softphone_email` (Klartext)
- `softphone_password` (Klartext)

Zugriff: nur Superadmin darf schreiben; der Mitarbeiter darf ausschließlich seine eigene Zeile lesen (bestehende Regeln decken das ab, werden geprüft).

Hinweis: Die Zugangsdaten liegen bewusst im Klartext, damit sie dem Mitarbeiter angezeigt werden können – wie bereits beim vorhandenen `password_plain`-Feld.

## Superadmin – Wizard Schritt 2

Unter dem Outbound-Recruitment-Block:
- Checkbox „Onboarding aktivieren“
- Bei Aktivierung: Auswahl „Telefonsystem“ (Sipgate / Placetel) sowie zwei Felder „Login-E-Mail“ und „Passwort“ (Klartext, mit Anzeigen/Verbergen-Toggle und Generator-Button analog zum bestehenden Passwortfeld)
- Bei Deaktivierung werden die Felder beim Speichern geleert

Gilt identisch für Anlegen und Bearbeiten.

## Mitarbeiter – Sidebar & Seite

- Sidebar zeigt den Reiter „Onboarding“ (`/mitarbeiter/onboarding`) nur, wenn Onboarding aktiviert ist. Der bestehende Profil-Hook wird dafür um die Onboarding-Felder erweitert (inkl. localStorage-Cache, damit die Sidebar nicht springt).
- Neue Seite `/mitarbeiter/onboarding` mit drei Karten:
  1. **Sichere Verbindung – UltraViewer** (immer sichtbar, oben): Erklärung, dass wir uns per Fernwartung verbinden, um das Softphone zu erklären + Button „UltraViewer herunterladen“ → https://www.ultraviewer.net/en/download.html, mit UltraViewer-Logo.
  2. **Softphone-App**:
     - Sipgate: Hinweis zum Download der Sipgate-App + Button → https://www.sipgate.de/app-download, mit Sipgate-Logo.
     - Placetel: Hinweis zum Download der Webex-App + Button → https://www.webex.com/downloads.html, mit Webex-Logo.
  3. **Deine Zugangsdaten**: E-Mail und Passwort im Klartext, Kopier-Buttons und deutlicher Hinweis, die Daten sicher abzuspeichern.

## Technisches

- Logos werden als echte Dateien unter `public/` abgelegt (`public/logos/sipgate.svg`, `public/logos/webex.png`, `public/logos/ultraviewer.png`) und per absolutem Pfad referenziert, damit sie auch nach dem Deploy laden.
- Route in `src/App.tsx` innerhalb des Mitarbeiter-Layouts; Zugriff wird zusätzlich in der Seite geprüft (kein Onboarding aktiv → Hinweis statt Daten).
- Betroffene Dateien: `src/pages/superadmin/MitarbeiterWizard.tsx`, `src/hooks/use-outbound-profile.ts`, `src/components/mitarbeiter/AppSidebar.tsx`, neue `src/pages/mitarbeiter/Onboarding.tsx`, `src/App.tsx`.
