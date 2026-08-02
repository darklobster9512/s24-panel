## Befund

Der Code ist bereits korrekt: `/mitarbeiter/erfassen` zeigt das im Portal gepflegte Skript an und greift nur dann auf die alte PDF zurück, wenn kein Text hinterlegt ist.

Die Datenbank zeigt: beim einzigen Recruitment-Kunden (**Audi AG**) ist `call_script_content` leer, aber `call_script_path` enthält noch die alte PDF. Deshalb greift der Fallback und die PDF wird geöffnet.

## Änderungen

1. **Bestehende Daten migrieren**: Beim Kunden Audi AG das Standard-Skript aus `src/lib/call-script-template.ts` als `call_script_content` eintragen und `call_script_path` auf leer setzen, damit kein PDF-Rest bleibt.
2. **PDF-Fallback entfernen** in `src/pages/mitarbeiter/RecruitmentErfassen.tsx`: Kein Signed-URL-Laden aus dem Bucket `call-scripts` mehr, kein iframe-Viewer. Ist kein Text hinterlegt, erscheint stattdessen ein klarer Hinweis („Kein Call-Skript hinterlegt – bitte im Kunden-Wizard, Schritt 5 pflegen“).
3. **Wizard-Komfort**: Beim Bearbeiten eines Recruitment-Kunden ohne Skript-Text wird die Vorlage automatisch vorgeschlagen (Button bleibt bestehen), damit dieser Zustand nicht erneut entsteht.

## Technisches

- Datenmigration per Update auf `public.clients` (nur betroffene Zeile).
- Entfernung von `scriptUrl`-State und Storage-Aufruf; Dialog rendert ausschließlich das gerenderte HTML.
- Der Storage-Bucket `call-scripts` bleibt bestehen, wird aber nicht mehr gelesen.
