## Ziel

Bei Kunden (Schritt 5 „Konfiguration") wird das Call-Skript nicht mehr als PDF hochgeladen, sondern direkt im Portal als formatierter Text gepflegt. Im Mitarbeiter-Panel öffnet sich das Skript weiterhin per Popup — nur eben als schön formatierte Seite statt PDF-Viewer. Der Leitfaden aus der hochgeladenen PDF wird als Standard-Vorlage hinterlegt.

## Was gebaut wird

**1. Datenbank**
- Neue Spalte `clients.call_script_content` (Text/HTML). `call_script_path` bleibt bestehen, damit bereits hochgeladene PDFs nicht verloren gehen (Fallback), wird aber nicht mehr neu befüllt.

**2. Kunden-Wizard, Schritt 5**
- PDF-Upload-Feld entfällt bei Recruitment-Kunden.
- Stattdessen der bereits im Projekt vorhandene Rich-Text-Editor (wie bei den Vertragsvorlagen): Überschriften, Fett/Kursiv, Aufzählungen.
- Button „Vorlage einfügen" füllt den Editor mit dem Gesprächsleitfaden aus der PDF (Begrüßung, Kennenlernen, Vorstellung der Tätigkeit, Registrierung, Mitarbeiterportal, Wichtige Hinweise, Nächste Schritte, Verbindlicher Abschluss, Abschluss) — inkl. Platzhaltern `[Name]` / `[Firmenname]`.
- Hinweistext im Recruitment-Checkbox-Block wird von „PDF" auf „Call-Skript im Editor" angepasst.

**3. Mitarbeiter — Recruiting-Anruf**
- „Call-Skript öffnen" zeigt den gepflegten Text im bestehenden Popup, sauber typografiert und scrollbar (statt iframe/PDF).
- Falls ein Kunde noch kein Text-Skript, aber eine alte PDF hat, wird weiterhin die PDF angezeigt.

## Technische Details

- Migration: `ALTER TABLE public.clients ADD COLUMN call_script_content text;` (keine neuen Grants nötig, bestehende Tabelle).
- `src/pages/superadmin/KundenWizard.tsx`: `scriptFile`/`uploadScriptIfNeeded` entfernen, `call_script_content` ins Zod-Schema + `normalize()` aufnehmen, `StepKonfig` auf `TipTapEditor` umstellen.
- Neue Datei `src/lib/call-script-template.ts` mit dem HTML-Standardleitfaden.
- `src/pages/mitarbeiter/RecruitmentErfassen.tsx`: `openScript()` liest `call_script_content`; Dialog rendert das HTML in einem `prose`-Container; PDF-Signed-URL nur noch als Fallback.
- Storage-Bucket `call-scripts` bleibt für Altbestände erhalten.
