## Ziel

Alle verbuggten / hängengebliebenen Live-Anrufe aus `sipgate_calls` entfernen, damit das `/mitarbeiter/live` Cockpit und `/superadmin/anrufe` wieder sauber sind.

## Schritte

1. **Offene Calls identifizieren**
   - Alle Zeilen in `public.sipgate_calls` abfragen, deren `status` nicht `hangup` oder `completed` ist.
   - Anzahl und IDs der betroffenen Calls anzeigen.

2. **Bereinigung durchführen**
   - Die identifizierten hängengebliebenen Calls entweder löschen oder auf einen Endstatus (`completed`) setzen.
   - Vorschlag: Löschen, da der Nutzer sagt „entfernen" und die Calls verbuggt sind.

3. **Ergebnis prüfen**
   - Nach der Bereinigung nochmal prüfen, dass keine offenen Calls mehr vorhanden sind.
   - `/mitarbeiter/live` und `/superadmin/anrufe` sollten keine verbuggten Einträge mehr anzeigen.

## Hinweis

Dies ist eine reine Datenbereinigung. Keine Code- oder Schema-Änderungen nötig.