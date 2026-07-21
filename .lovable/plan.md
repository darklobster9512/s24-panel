## Ziel
Kunden-Logos in `/mitarbeiter` (Cockpit & Kunden) vollständig anzeigen statt beschnitten.

## Ursache
`ClientLogo` in `src/components/mitarbeiter/MitarbeiterLayout.tsx` nutzt `object-cover` mit grünem Tint-Hintergrund (`bg-primary/15`) — dadurch werden Logos beschnitten und wirken „im Kreis". Auf `/mitarbeiter/kunden` (`CardLogo`) ist es bereits korrekt mit `object-contain`.

## Änderung
Nur `ClientLogo` anpassen (wird in Cockpit unter „Meine Kunden" und „Letzte Anrufe" verwendet):

- `object-cover` → `object-contain`
- Padding hinzufügen (`p-1` bei sm, `p-1.5` sonst), damit das Logo Luft hat
- Hintergrund von `bg-primary/15` auf `bg-background` mit `border border-border/60` (wie in `CardLogo`), damit farbige Logos nicht mit dem grünen Tint kollidieren
- Form bleibt `rounded-xl` (kein Kreis)

## Nicht Teil des Plans
- `/mitarbeiter/kunden` `CardLogo` bleibt unverändert (bereits `object-contain`)
- Keine Änderungen an anderen Panels (Superadmin etc.)
