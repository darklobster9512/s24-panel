# Onboarding-Termine: E-Mail-Spalte ausblenden, Zeile bearbeitbar

## Änderungen

1. **E-Mail-Spalte entfernen** — die Spalte „E-Mail" verschwindet aus Kopfzeile und Zeilen; die Breiten der übrigen Spalten werden entsprechend angepasst. Die E-Mail bleibt in der Suche und im Bearbeiten-Dialog sichtbar.
2. **Zeile anklickbar** — ein Klick auf eine Terminzeile öffnet dasselbe Popup wie beim Anlegen, jetzt im Bearbeiten-Modus mit vorbefüllten Werten: Datum, Uhrzeit, Notiz, Startdatum.
   - Titel wechselt zu „Onboarding-Termin bearbeiten", Speichern aktualisiert den bestehenden Eintrag.
   - Der zugeordnete Bewerber wird oben als feste Info angezeigt (keine erneute Suche nötig), lässt sich aber über „Ändern" austauschen.
   - Klicks auf Status-Auswahl und Löschen-Button lösen den Dialog nicht aus.
   - Zeile bekommt Hover-Effekt und Cursor-Pointer als Klick-Hinweis.

## Technische Details

- Datei: `src/pages/superadmin/OnboardingTermine.tsx`, keine Datenbankänderung.
- Neuer State `editingId`; `save()` verzweigt zwischen `insert` und `update ... eq("id", editingId)`.
- Beim Öffnen einer Zeile werden Felder aus dem `Row`-Objekt gesetzt und ein Pseudo-`selected` aus den Snapshot-Feldern des Termins gebaut; das Auto-Vorbefüllen aus dem Bewerbungsgespräch wird im Bearbeiten-Modus übersprungen, damit vorhandene Eingaben nicht überschrieben werden.
- Grid-Definition von `[170px_1fr_1fr_140px_150px_1fr_60px_60px_90px_150px_60px]` auf die Variante ohne E-Mail-Spalte reduzieren (Kopfzeile und Datenzeile identisch halten).
- Status-Select und Lösch-Button erhalten `stopPropagation` im Click-Handler.
