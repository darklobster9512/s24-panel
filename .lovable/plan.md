# Plan: Unnötige Keep-Warm Pings entfernen

## Bindings im Cloudflare Worker
Nein, du brauchst **kein Binding**. Wenn du den Code im Quick-Edit mit den hardcodierten Konstanten (`SUPABASE_EDGE_FUNCTION_URL` und `SUPABASE_EDGE_TOKEN`) verwendet hast, ist der Worker komplett eigenständig. Bindings wären nur nötig, wenn du Secrets über das Cloudflare Dashboard verwalten wolltest – aber das ist hier optional.

## Ziel
Die vier `pg_cron`-Keep-Warm-Jobs sind jetzt überflüssig, weil der Cloudflare Worker Sipgate sofort antwortet und die Supabase-Edge-Function nur noch asynchron im Hintergrund arbeitet.

## Schritte
1. **Cron-Jobs entfernen** mit folgendem SQL:

```sql
SELECT cron.unschedule('sipgate-webhook-keepalive-00');
SELECT cron.unschedule('sipgate-webhook-keepalive-15');
SELECT cron.unschedule('sipgate-webhook-keepalive-30');
SELECT cron.unschedule('sipgate-webhook-keepalive-45');
```

2. **Verifikation** mit:

```sql
SELECT jobname, schedule FROM cron.job WHERE jobname LIKE 'sipgate-webhook-keepalive%';
```

Sollte keine Zeilen mehr zurückgeben.

3. **Edge Function optional belassen**
Die `keepalive=1`-Logik in `supabase/functions/sipgate-webhook/index.ts` kann bleiben. Sie schadet nicht und macht den Code rückwärtskompatibel, falls du später mal wieder direkt auf Supabase zugreifen willst.

## Erwartetes Ergebnis
- Keine unnötigen Pings mehr an die Edge Function.
- Weniger Traffic/Logs in Supabase.
- Der Webhook-Flow läuft ausschließlich über den Cloudflare Worker.

Wenn du zustimmst, führe ich die SQL-Befehle aus.
