Umsetzung Lösung 2: Mehrere Warm-Pings pro Minute.

Ich ersetze den bestehenden `sipgate-webhook-keepalive` Cron-Job durch eine Variante, die pro Minute vier `net.http_post` Aufrufe an `?keepalive=1` sendet — bei Sekunde 0, 15, 30 und 45 (via `pg_sleep(15)` zwischen den Requests).

Sonst wird nichts verändert:
- Edge Function Code bleibt wie er ist.
- sipgate-Antwortpfad, XML, Callbacks, Live-Anrufe-Frontend: unverändert.

SQL, der ausgeführt wird:

```sql
select cron.unschedule('sipgate-webhook-keepalive');
select cron.schedule(
  'sipgate-webhook-keepalive',
  '* * * * *',
  $$
  do $inner$
  begin
    perform net.http_post(url := '.../sipgate-webhook?keepalive=1', ...);
    perform pg_sleep(15);
    perform net.http_post(...);
    perform pg_sleep(15);
    perform net.http_post(...);
    perform pg_sleep(15);
    perform net.http_post(...);
  end
  $inner$;
  $$
);
```

Bitte auf Build-Modus umschalten, damit ich den Cron-Job aktualisieren kann.