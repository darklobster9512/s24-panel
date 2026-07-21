## Ziel
Neuen Status „Im Gespräch" ergänzen, der automatisch aktiv wird, solange der Gesprächs-Timer in `/mitarbeiter/erfassen` läuft, und nach Ende zurück auf den vorherigen Status (typisch „Verfügbar") wechselt.

## Änderungen

**`src/components/mitarbeiter/MitarbeiterLayout.tsx`**
- `Status`-Typ um `"im-gespraech"` erweitern, `STATUS_META`-Eintrag: Label „Im Gespräch", Dot/Ring in `primary` (grün) bzw. distinktem Ton (z.B. Sky/Blue) — Vorschlag: `bg-sky-400` / `ring-sky-400/40`, damit es sich klar von „Verfügbar" abhebt.
- Vorherigen manuellen Status merken (`prevStatusRef`), um nach dem Gespräch dorthin zurückzukehren.
- Auf window-Events lauschen:
  - `sekreteriat24:call-started` → aktuellen Status in `prevStatusRef` sichern, Status auf `"im-gespraech"` setzen.
  - `sekreteriat24:call-ended` → Status auf `prevStatusRef.current ?? "verfuegbar"` zurücksetzen.
- Dropdown-Item „Im Gespräch" ausblenden bzw. deaktivieren (nicht manuell wählbar), damit es nur automatisch gesetzt wird.

**`src/pages/mitarbeiter/Erfassen.tsx`**
- Beim Start des Timers (`startCall` und Auto-Start via sipgate answered) `window.dispatchEvent(new CustomEvent("sekreteriat24:call-started"))` feuern.
- Beim Stop (manuell via `stopCall`, `reset`, nach `save`, sowie im vorhandenen `sipgate:hangup`-Handler) `window.dispatchEvent(new CustomEvent("sekreteriat24:call-ended"))` feuern — genau dann, wenn `running` von true auf false wechselt.

## Technische Details
- Events sind entkoppelt (kein Prop-Drilling / Context nötig), passt zum bestehenden `sipgate:hangup`-Muster.
- Status bleibt lokaler UI-State; keine DB-Änderung.
- „Im Gespräch" ist read-only im Dropdown (visuell sichtbar, aber nicht klickbar), sodass User nicht versehentlich manuell rein/raus schalten.