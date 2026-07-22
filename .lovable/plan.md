## Bestätigungsmail: mehr Branding-Farbe (#7bed9f)

Aktuell ist die Mail sehr grau/weiß, das Grün taucht nur im Logo-„24" auf. Ich bringe die Markenfarbe an mehreren gezielten Stellen ein, ohne den seriösen Ton zu verlieren.

**Header**
- Header-Band bekommt einen sanften Grün-Tint (`#f0fbf4` statt `#fafbfa`)
- Feine 3px Akzentlinie in `#7bed9f` unterhalb des Headers
- Trennlinie darunter in leicht grün getönt (`#d9f2e2`)

**Anrede**
- Erster Absatz („Hallo {Vorname}…") in kräftigerem Ink, mit dezenter grüner linker Border (3px, `#7bed9f`, `padding-left:14px`) — wirkt wie ein ruhiger Akzent, kein Zitatblock

**Info-Box „Der weitere Ablauf"**
- Hintergrund auf ganz zartes Grün (`#f4fbf6`), Border in `#d9f2e2`
- Überschrift „Der weitere Ablauf" in Akzentgrün (`#2fa363` — dunklere, lesbare Variante von `#7bed9f` für Text-Kontrast)
- Nummern (1./2./3.) als kleine runde Badges mit grünem Hintergrund (`#7bed9f`) und dunklem Ink-Text, statt fettem Inline-Text

**Footer**
- Firmenname in Akzentgrün-Dunkel (`#2fa363`)
- Feine grüne Trennlinie oberhalb des Footers

**Farbtokens in der Mail**
- Primärgrün (Flächen/Badges): `#7bed9f`
- Grün-Dunkel für Text (WCAG-tauglich auf Weiß): `#2fa363`
- Grün-Tint Flächen: `#f4fbf6` / `#f0fbf4`
- Grün-Border: `#d9f2e2`

**Betroffene Dateien**
- `src/lib/applicationEmail.ts` — HTML-Template
- `supabase/functions/submit-application/index.ts` — gespiegeltes Template, danach Redeploy

Text-Inhalte, Absatz-Rhythmus, Logo-Zentrierung und die 3-Schritt-Struktur bleiben unverändert — nur Farbeinsatz wird stärker.
