## Problem

Das finale Vertrags-PDF wird in `src/pages/superadmin/ArbeitsvertragDetail.tsx` so erzeugt: die komplette Vorschau wird als **ein einziges Bild** (html2canvas) aufgenommen und dann mit verschobener Position mehrfach in jsPDF-Seiten eingefügt. Dabei wird an jeder Seitengrenze mitten durch eine Textzeile geschnitten – halbe Buchstaben oben/unten, Paragraphen-Überschriften getrennt vom Text, und der Unterschriftenblock kann zerrissen werden. Zusätzlich gibt es keinen definierten Seitenrand-Rhythmus, weil das Bild nur einmal skaliert wird.

(Vertrag von S. Maier: `contracts/c7d4649d…/8417ee9c….pdf`, Vorlage „Teilzeit – 20 Std./Woche · Sekretär:in (Homeoffice)“, Status abgeschlossen – erzeugt genau mit dieser Logik.)

## Lösung

Statt „ein Bild in Scheiben schneiden“ → **echte Seitenaufteilung vor dem Rendern**.

1. **Neues Modul `src/lib/contract-pdf.ts`**
   - Baut einen unsichtbaren Render-Container im A4-Format (794 px Breite ≙ 210 mm bei 96 dpi) mit festen Rändern (ca. 20 mm oben/unten, 18 mm seitlich).
   - Verteilt die Inhaltsblöcke (Absätze, Überschriften, Listen, Tabellen, Unterschriftenblock) nacheinander auf Seiten: passt ein Block nicht mehr in die Resthöhe, beginnt eine neue Seite. Blöcke werden **nie** getrennt.
   - Sehr lange Einzelblöcke (z. B. eine sehr lange Liste) werden auf Listen-/Absatzebene weiter aufgeteilt, damit auch die nicht überlaufen.
   - Überschriften werden zusammen mit dem ersten Folgeabsatz gehalten (keine einsame Überschrift am Seitenende).
   - Unterschriftenblock (Arbeitgeber/Arbeitnehmer inkl. Signaturbildern) ist ein unteilbarer Block und rutscht komplett auf die nächste Seite, wenn er nicht mehr passt.
   - Jede Seite wird einzeln mit html2canvas (scale 2, weißer Hintergrund) gerendert und als vollflächige A4-Seite in jsPDF eingefügt.
   - Optional dezente Fußzeile „Seite X von Y“.

2. **Druck-Styling `.contract-pdf` in `src/styles.css`**
   - Feste Typografie für das PDF: 10.5–11 pt, Zeilenhöhe ~1.5, schwarzer Text auf Weiß.
   - `overflow-wrap: anywhere` + `hyphens: auto` für lange IBANs/E-Mails, damit nichts seitlich aus dem Satzspiegel läuft.
   - Tabellen `width:100%`, `table-layout:fixed`; Bilder `max-width:100%`.
   - Kompakte, aber gleichmäßige Abstände (baut auf der bestehenden `.contract-preview`-Klasse auf).

3. **`ArbeitsvertragDetail.tsx`**
   - Der Bestätigen-Button ruft das neue Modul auf (HTML + Signaturdaten rein, PDF-Blob raus) statt der bisherigen Canvas-Slice-Logik.
   - Die Bildschirm-Vorschau bekommt dieselben Satzspiegel-Maße wie das PDF, sodass Vorschau und Ergebnis identisch aussehen.
   - Signaturbilder werden vor dem Rendern als Data-URL vorgeladen, damit sie im PDF garantiert erscheinen.

4. **Nachkontrolle**
   - Der bestehende Vertrag von S. Maier wird über den Bestätigen-/Neu-Generieren-Weg noch einmal erzeugt und das Ergebnis Seite für Seite visuell geprüft (Ränder, keine abgeschnittenen Zeilen, Unterschriftenblock vollständig).

## Technische Details

- Keine neuen Abhängigkeiten: `jspdf` und `html2canvas-pro` sind bereits im Projekt.
- Seitenmaße: A4 595.28 × 841.89 pt; Renderbreite 794 px wird 1:1 auf die Seitenbreite skaliert, Höhe entsprechend – dadurch bleibt der Maßstab auf allen Seiten gleich.
- Datenmodell und Workflow (Status `pending_employee` → `pending_admin` → `completed`, `pdf_path` im Storage-Bucket `contract-assets`) bleiben unverändert.
