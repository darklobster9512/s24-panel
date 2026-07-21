Zwei kleine Copy-Updates im Mitarbeiter-Bereich, damit die Hinweise zum neuen Auto-Redirect-/Auto-Stop-Workflow passen:

1. Erfassen-Seite — Timer-Hinweis anpassen
   - Datei: `src/pages/mitarbeiter/Erfassen.tsx` (Zeile ~312)
   - Aktuell: „Timer läuft manuell — starte, sobald du im Softphone angenommen hast."
   - Problem: Der Timer startet jetzt automatisch, wenn ein eingehender sipgate-Call gematched wird, und stoppt automatisch bei Hangup.
   - Neu: Hinweis, dass der Timer automatisch startet/stoppt, wenn der Anruf in der sipgate App angenommen und beendet wird.

2. Live-Anrufe-Seite — Untertitel anpassen
   - Datei: `src/pages/mitarbeiter/LiveAnrufe.tsx` (Zeile ~28)
   - Aktuell: „Eingehende Anrufe für deine zugewiesenen Kunden — in Echtzeit."
   - Problem: Es fehlt die Anweisung, die Anrufe in der sipgate App anzunehmen; stattdessen wird nur „Echtzeit" betont.
   - Neu: Kurze Anweisung, dass die Sekretärin eingehende Calls direkt in der sipgate App annehmen muss, damit das Portal automatisch weiterleitet.

Keine Änderungen an Logik/State/DB — nur reine Text-Anpassungen.