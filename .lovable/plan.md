# Interne Bewerbungsgespräche für Mitarbeiter (aigis one)

Ziel: Ein Mitarbeiter kann per Checkbox freigeschaltet werden, die internen Bewerbungsgespräche aus `/superadmin/bewerbungsgespraeche` zu sehen und abzuarbeiten – vollständig im Sekretariat24-Panel, ohne externe Caller-API.

**Wichtig:** Der bestehende Outbound-Flow (Caller-API, `RecruitmentErfassen.tsx`, `/mitarbeiter/bewerbungsgespraeche` für Outbound-Caller) bleibt unangetastet. Der neue Modus läuft in eigenen Komponenten und wird nur über das neue Flag aktiviert.

## 1. Datenbank

- Neue Spalte `employees.internal_interviews boolean not null default false`.
- Security-Definer-Funktion `has_internal_interviews()` (prüft: eingeloggter User ist Mitarbeiter mit `internal_interviews = true`).
- Neue RLS-Policies für diese Mitarbeiter:
  - `interview_appointments`: SELECT + UPDATE
  - `applications`: SELECT + UPDATE (für Ranking)
  - Storage-Bucket `applications`: SELECT (Lebenslauf-Vorschau)
- Status-Wert: In der UI wird „Abgesagt“ durch „Mailbox“ ersetzt. Datenbankseitig wird der Wert `abgesagt` auf `mailbox` umgeschrieben (kein Constraint vorhanden, daher reines Daten-Update).

## 2. Superadmin – Mitarbeiter bearbeiten (Schritt 2)

- Neue Checkbox „Interne Bewerbungsgespräche" analog zu „Outbound Recruitment“/„Onboarding“.
- Beim Speichern mit aktivierter Checkbox: Mitarbeiter wird automatisch dem Kunden **aigis one GmbH** zugewiesen (Eintrag in `assignments`, falls noch nicht vorhanden) – dadurch greifen Call-Skript und Unternehmensinfos des aigis-one-Brandings.
- Beide Modi (Outbound und Intern) schließen sich gegenseitig aus; beim Aktivieren des einen wird der andere deaktiviert.

## 3. Mitarbeiter – Terminliste

- Neue Seite `src/pages/mitarbeiter/InterneBewerbungsgespraeche.tsx`: Optik wie die bestehende Outbound-Liste (Anstehend/Vergangen, Suche, Tagesgruppen), Datenquelle jedoch `interview_appointments` + `applications` aus Supabase, inkl. Realtime-Aktualisierung.
- Spalten: Termin, Bewerber, Telefon, Anstellung/Stelle, Ranking, Status, Aktion „Anruf“.
- Keine Panel-Link-Buttons.
- Routing: `/mitarbeiter/bewerbungsgespraeche` rendert je nach Modus die bestehende Outbound-Liste **oder** die neue interne Liste.
- Sidebar: Der Reiter „Bewerbungsgespräche“ erscheint auch bei aktiviertem internen Modus (`use-outbound-profile` wird um das Flag erweitert).

## 4. Mitarbeiter – Anruf erfassen (intern)

- Neue Komponente `src/pages/mitarbeiter/InterneErfassen.tsx`; `Erfassen.tsx` wählt anhand des URL-Parameters (`?termin=<uuid>`) diese Komponente. Der bisherige Parameter `?interview=` bleibt exakt wie bisher beim Outbound-Flow.
- Inhalte:
  - Bewerberdaten (Name, Telefon, E-Mail, Anstellung, Geburtsdatum) mit Klick-zum-Kopieren.
  - Kunden-Panel mit aigis-one-Logo und aufklappbarem Call-Skript (gleiche Render-Logik wie bisher).
  - Gesprächs-Timer wie gehabt.
  - Lebenslauf-Vorschau (PDF/Bild im Viewer, DOCX über die bereits im Projekt genutzte mammoth-Konvertierung, sonst „In neuem Tab öffnen“).
  - Ranking-Auswahl (Sehr gut / Gut / Mittel / Schlecht) – speichert in `applications.ranking`.
  - Startdatum-Feld inklusive Kalender und „Ab sofort“-Checkbox (identische Logik wie `/superadmin/bewerbungsgespraeche/:id`).
  - Notizfeld + Ergebnis-Buttons Erfolgreich / Fehlgeschlagen / Mailbox (Mailbox gelb wie im Outbound-Screen).
  - **Keine** Panel-Link-Buttons (weder SMS noch E-Mail).
- Speichern: schreibt Status, Notiz, Startdatum in `interview_appointments`, das Ranking in `applications` und legt zusätzlich eine `call_notes`-Zeile (Kunde = aigis one, Dauer = Timer) an, damit Notizen und Statistiken wie gewohnt gefüllt werden. Es wird **keine** Caller-API/Edge-Function für das Ergebnis aufgerufen (die bestehende Telegram-Notiz-Benachrichtigung bleibt wie bei anderen Notizen erhalten).

## 5. Superadmin – Bewerbungsgespräche

- Status-Option „Abgesagt“ → „Mailbox“ in Liste und Detailseite (Wert `mailbox`, Badge gelb).
- Lebenslauf: Die Detailseite zeigt den Lebenslauf bereits; ergänzt wird die DOCX-Vorschau, damit alle Dateitypen direkt sichtbar sind.
- Status-Änderungen ändern weiterhin ausschließlich den Status (keine Mails, keine Folgeaktionen).

## Technische Notizen

- Zwei getrennte Komponenten statt Verzweigungen in `RecruitmentErfassen.tsx`/`Bewerbungsgespraeche.tsx` – so ist ausgeschlossen, dass der Outbound-Flow beeinflusst wird.
- Die neuen RLS-Policies greifen ausschließlich über `has_internal_interviews()`; Mitarbeiter ohne das Flag sehen weiterhin keine Bewerbungsdaten.
