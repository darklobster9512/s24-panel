# Landingpage entfernen

## Ziel
Die Route `/` soll keine Landingpage mehr zeigen. Stattdessen wird jeder Aufruf von `/` direkt auf `/auth` weitergeleitet.

## Änderungen

1. **`src/App.tsx`**
   - Route `/` nicht mehr auf `Index` mappen, sondern `<Navigate to="/auth" replace />` zurückgeben.
   - Import von `Index` entfernen.

2. **`src/pages/Index.tsx`**
   - Datei löschen, da nicht mehr verwendet.

## Nicht betroffen
- `/auth` und alle geschützten Routen (`/superadmin`, `/mitarbeiter`, `/kunde`) bleiben unverändert.
- Auth-Logik (bereits eingeloggte User werden von `/auth` in ihr Rollen-Dashboard weitergeleitet) bleibt bestehen.
