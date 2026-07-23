## Ziel
Beim Klick auf „Öffnen" (Lebenslauf) soll die Datei in einem Modal-Popup innerhalb der App angezeigt werden, statt in einem neuen Browser-Tab.

## Umsetzung in `src/pages/superadmin/Bewerbungen.tsx`

1. Neuen State hinzufügen: `previewUrl: string | null` und `previewName: string | null`.
2. `openLebenslauf(row)` anpassen: signierte URL nicht mehr via `window.open`, sondern in den State setzen, um den Dialog zu öffnen.
3. Neuen `Dialog` (shadcn) rendern:
   - Große Breite (`max-w-5xl`), Höhe ca. `85vh`.
   - Titel = Dateiname des Bewerbers.
   - Inhalt: `<iframe src={previewUrl}>` für PDFs (Browser-nativer PDF-Viewer). Für Nicht-PDF (z. B. DOCX) Fallback mit „In neuem Tab öffnen"-Button, da Browser DOCX nicht inline rendern.
   - Zusätzlicher Button „Herunterladen / In neuem Tab öffnen" im Footer.
4. Auf `onOpenChange=false` den State zurücksetzen.

Der bestehende „Öffnen"-Button in der Tabellenzeile und der „Lebenslauf öffnen"-Button im Detail-Sheet nutzen beide dieselbe Funktion — beide öffnen dann automatisch das Popup.
