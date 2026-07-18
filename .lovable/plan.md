## Problem

Beim Anlegen eines Mitarbeiter-Kontos landet der User als „kunde" statt „mitarbeiter". Ursache:

1. Der DB-Trigger `handle_new_user` läuft bei jedem `auth.users` Insert und legt automatisch eine Rolle in `user_roles` an — Default = `'kunde'`, weil in `raw_user_meta_data` nichts steht.
2. Die Edge Function `create-employee-account` fügt danach zusätzlich `'mitarbeiter'` ein → der User hat **zwei** Rollen.
3. Das Frontend (`AuthProvider`) lädt Rollen mit `order=created_at.asc&limit=1` — die vom Trigger zuerst geschriebene `'kunde'` gewinnt.

Beleg im Log:
```
GET /user_roles?...limit=1 → [{"role":"kunde"}]
```

## Fix

**Edge Function `create-employee-account`:**
- Beim `admin.auth.admin.createUser` `user_metadata: { role: "mitarbeiter" }` mitgeben, damit der Trigger direkt die richtige Rolle setzt.
- Den nachgelagerten manuellen `insert` in `user_roles` durch ein defensives `upsert` (bzw. `.insert(...).select()` mit ignore-on-conflict via `onConflict: 'user_id,role'`) ersetzen — oder ganz entfernen, da der Trigger es bereits erledigt. Ich entferne den expliziten Insert.

**Bestehende falsche Datensätze bereinigen:**
- Für alle Users, die in `employees` verknüpft sind und eine `'kunde'`-Rolle statt `'mitarbeiter'` haben: `UPDATE user_roles SET role='mitarbeiter' WHERE user_id IN (SELECT user_id FROM employees WHERE user_id IS NOT NULL) AND role='kunde'`. Das mache ich über die Insert/Update-Konsole nach deinem OK.

## Warum kein Trigger-Change

Den Trigger `handle_new_user` anzufassen wäre invasiver (betrifft auch Self-Signup /auth). Metadaten mitzugeben ist der saubere, vom Trigger bereits vorgesehene Weg (`role IN ('kunde','mitarbeiter')`).

Sag Bescheid, dann setze ich es um und bereinige den bereits angelegten Mitarbeiter-Account.