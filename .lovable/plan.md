# Telegram-Benachrichtigung bei neuen Call-Notizen

Sobald ein Mitarbeiter eine Notiz speichert (Inbound-Erfassung oder Outbound-Recruitment), geht eine Telegram-Nachricht an alle aktiven Empfänger, die dafür freigeschaltet sind.

## Empfänger-Steuerung

- Neue Schaltoption "Notizen" pro Empfänger unter `/superadmin/telegram` (analog zu Bewerbungen / Gespräche / Verträge).
- Neues Feld `notify_notes` in der Empfänger-Tabelle, standardmäßig aktiv.

## Nachrichtinhalt

**A) Eingehender Anruf (Sipgate / normale Erfassung)**

```text
📞 Neue Anrufnotiz
────────────
🏢 Kunde: <Unternehmensname>
☎️ Angerufene Nummer: <to_number des Anrufs>
👤 Anrufer: <Name>
📱 Nummer: <Anrufernummer>
⏱ Dauer: <mm:ss>
📝 Notiz: <Anliegen>  (+ Kategorie / Priorität)
🕓 Zeitstempel
```

**B) Outbound-Recruitment-Anruf**

```text
🎯 Recruiting-Anruf
────────────
🏢 Kunde: <Unternehmensname>
📱 Angerufene Nummer: <Bewerbernummer>
👤 Bewerber: <Name>
✅/❌ Ergebnis: Erfolgreich / Fehlgeschlagen
⏱ Dauer: <mm:ss>
📝 Notiz: <Text>
🕓 Zeitstempel
```

Unterscheidung: Eine Notiz gilt als Recruiting-Anruf, wenn der zugehörige Kunde als Recruitment-Kunde markiert ist (kein Sipgate-Anruf verknüpft). Das Ergebnis wird aus dem Präfix `[Erfolgreich]` / `[Fehlgeschlagen]` gelesen, das die Recruitment-Erfassung bereits schreibt.

## Technische Umsetzung

1. **Migration**: Spalte `notify_notes boolean not null default true` auf `public.telegram_recipients`.
2. **Neue Edge Function `call-note-notify`** (verify_jwt aus, JWT im Code geprüft):
   - Body: `{ note_id }`.
   - Prüft, dass der Aufrufer ein eingeloggter Mitarbeiter ist.
   - Lädt die Notiz per Service-Role inkl. Kunde (`company_name`, `is_recruitment`) und ggf. verknüpftem `sipgate_calls`-Datensatz (`to_number`).
   - Ruft `telegram-notify` mit dem internen `TELEGRAM_NOTIFY_SECRET` und `type: "note"` auf.
3. **`telegram-notify`**: neuer Typ `note` mit den beiden Layouts oben, Empfängerfilter auf `notify_notes`, Button "Notiz öffnen" → `/mitarbeiter/notizen` bzw. `/superadmin/notizen`.
4. **Frontend**:
   - `Erfassen.tsx` und `RecruitmentErfassen.tsx`: nach erfolgreichem Insert (die Insert-Zeile liefert dafür die neue Notiz-ID zurück) `call-note-notify` aufrufen — Fehler werden nur geloggt, das Speichern bleibt davon unberührt.
   - `superadmin/Telegram.tsx`: Spalte "Notizen" mit Switch.

Keine bestehenden Benachrichtigungen werden verändert.
