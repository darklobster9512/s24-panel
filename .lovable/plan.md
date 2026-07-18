## Ziel
Kunden-Logos auf `/superadmin/zuweisungen` (und im Zuweisungs-Dialog) korrekt aus dem privaten Bucket `client-logos` laden.

## Ursache
- `clients.logo_url` speichert nur den Objekt-Pfad im Bucket (z. B. `4d018b43-….png`), nicht eine vollständige URL.
- Bucket `client-logos` ist privat → direkte URL funktioniert nicht, `<img src="4d018b43-….png">` wird als relativer Pfad interpretiert.
- In `src/pages/superadmin/Zuweisungen.tsx` wird `c.logo_url` unverändert an `<img src>` übergeben.

## Lösung
Signierte URLs vom Supabase Storage holen und cachen. Nur Frontend-Änderungen, keine DB- oder Bucket-Änderungen.

### Änderungen in `src/pages/superadmin/Zuweisungen.tsx`
1. Nach dem Laden der `clients` einen `Map<clientId, signedUrl>` State aufbauen:
   - Für alle Clients mit `logo_url != null` einen Batch-Aufruf `supabase.storage.from('client-logos').createSignedUrls(paths, 3600)` machen.
   - Ergebnis in `logoUrls` State ablegen.
2. Beide `<img>`-Stellen (Zuweisungs-Card + Dialog-Liste) auf `logoUrls.get(c.id)` umstellen. Fallback bleibt das `Building2`-Icon, wenn keine URL vorhanden ist.
3. Defensive: falls `logo_url` bereits mit `http` beginnt (Altdaten), unverändert verwenden.

### Optional (kleine Hilfsfunktion)
Kein neuer globaler Helper nötig — die Logik bleibt lokal in `Zuweisungen.tsx`, da dies aktuell der einzige Ort ist, der Logos in einer Liste rendert. Falls später weitere Seiten Logos brauchen (z. B. `Kunden.tsx`), kann ein `useClientLogoUrls(paths)`-Hook extrahiert werden — nicht Teil dieses Plans.

## Technische Details
- `createSignedUrls` gibt ein Array `{ path, signedUrl, error }` zurück; nur erfolgreiche Einträge werden in die Map geschrieben.
- Ablauf 1 h ist ausreichend, da die Seite bei Reload neu signiert.
- Keine RLS-Änderungen: bestehende Storage-Policies für `client-logos` erlauben Superadmins bereits Lesezugriff (Logo-Upload funktioniert im Wizard).
