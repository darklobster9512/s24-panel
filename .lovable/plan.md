## Ziel
Wizard von 5 auf 4 Steps reduzieren, indem „Adresse" und „Kontakt Firma" zu einem gemeinsamen Step zusammengefasst werden.

## Änderung in `src/pages/superadmin/KundenWizard.tsx`

### Neue Step-Struktur

1. **Unternehmen** — company_name, website, industry, vat_id, company_description
2. **Adresse & Kontakt** (neu, kombiniert) — street, postal_code, city, phone, email
3. **Ansprechpartner** — contact_person, contact_phone, contact_email
4. **Konfiguration** — logo, forwarding_enabled, greeting_text

### Layout des kombinierten Steps

```text
Step-Titel:        „Adresse & Kontakt"
Beschreibung:      „Firmensitz und geschäftliche Kontaktdaten"

[ Straße & Hausnr. — volle Breite ]
[ PLZ (140px) ] [ Stadt (flex)   ]
[ Telefon      ] [ E-Mail         ]
```

- Adresse-Block (street/PLZ/Stadt) oben, Kontakt-Block (phone/email) darunter — visuell durch `space-y-6` getrennt, kein zusätzlicher Divider nötig.
- Innerhalb des 2-Column-Grids: `street` spannt `md:col-span-2`, `postal_code` + `city` teilen sich eine Zeile (PLZ 140px), `phone` + `email` teilen sich die nächste Zeile.

### Zu aktualisierende Stellen

- Steps-Array: 5 → 4 Einträge (Titel, Beschreibung, Feldliste für Validierung).
- Stepper-Rendering (Sidebar vertikal + mobiler Horizontal-Stepper): läuft automatisch über das gekürzte Array.
- Step-Content-Rendering: die beiden Blöcke der bisherigen Steps 2 und 3 in einen gemeinsamen Step verschmelzen.
- „Weiter → Anlegen"-Umschaltung: greift jetzt auf Step 4 statt Step 5.
- Validierungs-Felder pro Step: Adresse- und Kontakt-Firma-Felder in einem gemeinsamen Feld-Set kombinieren.

## Nicht angefasst
Formular-Schema, DB-Felder, Draft-Speicherung, Routen, Design-Tokens — reine Step-Konsolidierung.
