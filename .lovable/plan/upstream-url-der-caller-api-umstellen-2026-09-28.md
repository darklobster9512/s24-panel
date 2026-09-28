# Upstream-URL der Caller-API umstellen

Die Outbound-Funktionen (Gespräche-Anzeige über `list_interviews`, Panel-Link-Versand über `send_panel_link` / `send_panel_link_email`) laufen über die Edge-Function `caller-api-proxy`, die Aufrufe an die eigentliche `caller-api`-Funktion auf einem separaten Supabase-Projekt weiterleitet.

Aktuell zeigt diese Ziel-URL auf das Projekt `gzgfyuftjvezqjkosntu`. Sie soll auf das neue Projekt `dgkailowvrbugapykyan` umgestellt werden. Der Pfad bleibt gleich.

## Änderung

`supabase/functions/caller-api-proxy/index.ts` (Zeile 4):

```ts
// alt
const UPSTREAM = 'https://gzgfyuftjvezqjkosntu.supabase.co/functions/v1/caller-api';
// neu
const UPSTREAM = 'https://dgkailowvrbugapykyan.supabase.co/functions/v1/caller-api';
```

Keine weiteren Stellen: Alle anderen Edge-Functions und das Frontend verwenden `Deno.env.get('SUPABASE_URL')` bzw. `supabase.functions.invoke("caller-api-proxy")` — keine weiteren hartcodierten URLs.

## Nach der Änderung

- `caller-api-proxy` per `deploy_edge_functions` neu deployen.
- Die `caller-api`-Funktion muss auf dem neuen Projekt `dgkailowvrbugapykyan` verfügbar sein (dort liegt die eigentliche Caller-API-Logik).
- Testaufruf der `list_interviews`-Aktion über den Proxy, um zu bestätigen, dass die Outbound-Gespräche wieder laden.

Keine Datenbankänderungen.
