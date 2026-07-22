## Änderungen an der Bewerbungs-Bestätigungsmail

**Header-Band**
- Hintergrund wird auf das Sidebar-Dunkelblau (`#0f172a` / hsl-Äquivalent des `--sidebar-background` Tokens) umgestellt.
- Logotext „Sekreteriat“ in Weiß (`#ffffff`), die „24“ bleibt in Branding-Grün (`#7bed9f`).
- Die 3px Akzentlinie darunter bleibt in Branding-Grün als Trenner zum weißen Body.

**Anrede-Block**
- Der grüne linke Border-Strich (`border-left: 3px solid …`) wird komplett entfernt.
- Anrede wird als normaler Absatz ohne Einrückung/Hintergrund gerendert.

**Nicht angetastet**
- Nummern-Badges „Der weitere Ablauf“, Footer-Trennlinie und restliche Farbakzente bleiben unverändert.

### Betroffene Dateien
- `src/lib/applicationEmail.ts` (Frontend-Vorschau)
- `supabase/functions/submit-application/index.ts` (identisches Template, Edge Function wird neu deployt)
