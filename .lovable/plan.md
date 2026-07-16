## Ziel
Wizard von schmalem Ein-Spalten-Layout auf ein desktop-optimiertes 2-Spalten-Layout umbauen. Aktuell wirken die Cards leer und die Felder verlieren sich im Panel.

## Neues Layout (`src/pages/superadmin/KundenWizard.tsx`)

### Desktop (≥ lg)
Zweispaltiges Layout im `Panel`:

```text
┌───────────────────────────────────────────────────────────┐
│  PageHeader (Titel + Zurück-Button)                       │
├────────────────────┬──────────────────────────────────────┤
│  Stepper (vertikal)│  Step-Titel + Beschreibung          │
│  ● Unternehmen     │  ─────────────────────────────       │
│  ● Adresse         │                                      │
│  ● Kontakt Firma   │   [ Feld ]  [ Feld ]                 │
│  ● Ansprechpartner │   [ Feld ]  [ Feld ]                 │
│  ● Konfiguration   │   [ Feld voll breit ]                │
│                    │                                      │
│  (max-w-64)        │   (flex-1, max-w-3xl)                │
├────────────────────┴──────────────────────────────────────┤
│  [Zurück]        [Als Entwurf speichern] [Weiter/Anlegen] │
└───────────────────────────────────────────────────────────┘
```

- Linke Sidebar: vertikaler Stepper mit nummerierten Steps, aktivem/erledigtem Zustand und Kurzbeschreibung pro Step. Sticky ab lg.
- Rechte Content-Spalte: Step-Titel als Sub-Heading + Kurzbeschreibung, dann die Felder in flüssigem 2-Column-Grid.
- Feld-Grid: `grid-cols-1 md:grid-cols-2`, Textareas und der Adresse-Block spannen `md:col-span-2`.
- Innen mehr Luft: `p-8`, `gap-6`, größere Label-Typo.
- Mindest-Content-Höhe entfernen (die leere Fläche im Screenshot); stattdessen konsistente Sektions-Höhen via `space-y-6`.

### Mobile / Tablet (< lg)
Horizontaler Stepper oben (bestehende Pill-Optik, aber kompakter — nur aktive Nummer + Titel voll, Rest als Nummern). Felder einspaltig. Buttons stapeln unten.

## Feld-Umbau pro Step

- **Unternehmen**: 2 Cols für company_name/website/industry/vat_id; company_description volle Breite.
- **Adresse**: street volle Breite, PLZ + Stadt in einer Zeile (PLZ 140px + Stadt flex).
- **Kontakt Firma**: 2 Cols (phone, email).
- **Ansprechpartner**: 2 Cols; contact_email darf einzeln stehen (2. Zeile).
- **Konfiguration**: Logo-Upload + Weiterleitung-Checkbox links, Begrüßungstext rechts als große Textarea (`md:col-span-2` wenn kein Sidebar-Split).

## Panel & Header
- `Panel` verliert die Content-Padding-Enge; im Wizard-Fall Panel als `<section>` mit `p-0 lg:grid lg:grid-cols-[240px_1fr]` — Sidebar bekommt eigene Border rechts.
- Buttons-Footer bleibt im Content-Bereich, sticky auf Mobile (`sticky bottom-0 bg-background/95 backdrop-blur`).

## Nicht angefasst
- Formular-Logik, Draft-Speicherung, Validierung, Routes, DB — alles bleibt unverändert. Reine Layout-/Presentation-Änderung.
