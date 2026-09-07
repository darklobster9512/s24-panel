# Superadmin-Konto anlegen

Ziel: ein sofort nutzbares Geschäftsführer-Konto mit der Adresse `superadmin@admin.de` und dem Passwort `admin777`.

## Was passiert

1. Das Konto wird direkt im Nutzerverzeichnis angelegt und sofort bestätigt, damit keine Bestätigungs-E-Mail nötig ist (die Adresse `admin.de` kann ohnehin keine Post empfangen).
2. Dem Konto wird die Rolle "Geschäftsführer" (superadmin) zugewiesen, damit alle Bereiche unter /superadmin freigeschaltet sind.
3. Ein passender Profileintrag mit dem Namen "Geschäftsführer" wird ergänzt.
4. Danach kann optional der Kunde "aigis one GmbH" inklusive Recruiting-Leitfaden wieder angelegt werden, da dieser Eintrag ein bestehendes Konto als Ersteller benötigt.

## Hinweise

- Das Passwort `admin777` ist sehr kurz und leicht zu erraten. Ich lege es wie gewünscht an, empfehle aber, es nach dem ersten Login zu ändern.
- Nach dem Anlegen kannst du dich direkt unter /auth anmelden und landest im Geschäftsführer-Bereich.

## Technisch

- Anlage über die Supabase Admin API (`auth.admin.createUser` mit `email_confirm: true`) bzw. per SQL-Insert in `auth.users` mit `crypt()`-Passwort-Hash, falls die Admin-API nicht verfügbar ist.
- Der bestehende Trigger `handle_new_user` erzeugt automatisch `profiles`- und `user_roles`-Einträge; die Rolle wird anschließend per Update auf `superadmin` gesetzt (Standard des Triggers ist `kunde`).
- Verifikation: Abfrage von `user_roles` und Test-Login gegen die Auth-API.
