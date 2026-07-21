## /mitarbeiter/live – nur klingelnde Anrufe zeigen

Aktuell zeigt die Live-Ansicht sowohl `ringing`- als auch `answered`-Anrufe. Filter auf **nur `ringing`** umstellen.

### Änderungen in `src/hooks/use-live-calls.ts`

- Initial-Query (Zeile 35): `.in("status", ["ringing", "answered"])` → `.eq("status", "ringing")`.
- Realtime-Filter (Zeile 57 & 65): jeweils nur noch `row.status === "ringing"` behalten; sobald ein Anruf auf `answered`/`ended`/`missed` wechselt, fliegt er aus der Liste.

### Nicht angefasst

- `LiveAnrufe.tsx` UI bleibt wie sie ist (der `ringing`-Zweig ist eh schon da).
- `/superadmin/anrufe` (Anruf-Log) bleibt unverändert – dort sollen weiterhin alle Status sichtbar sein.
- Kein DB- oder Webhook-Change.