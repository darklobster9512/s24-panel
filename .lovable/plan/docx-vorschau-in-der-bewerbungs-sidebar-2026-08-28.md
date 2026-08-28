# DOCX-Vorschau in der Bewerbungs-Sidebar

Aktuell zeigt die Lebenslauf-Vorschau nur PDFs (iframe) und Bilder. Für DOCX erscheint „Vorschau für diesen Dateityp nicht möglich“ und man muss die Datei herunterladen.

## Was gebaut wird

- DOCX-Lebensläufe werden direkt in der linken Spalte der Sidebar gerendert – lesbar formatiert (Überschriften, Absätze, Listen, Fett/Kursiv, Tabellen, eingebettete Bilder).
- Ladezustand während der Konvertierung, Fehlerfall fällt auf den bisherigen „In neuem Tab öffnen“-Hinweis zurück.
- Alle anderen Dateitypen (PDF, Bilder) verhalten sich unverändert.
- Alte `.doc`-Dateien (Binärformat) bleiben ohne Vorschau – dort weiterhin der Download-Hinweis.

## Technische Umsetzung

- Neues Paket `mammoth` (Browser-Build) – konvertiert DOCX zu HTML rein clientseitig, kein Backend nötig.
- In `src/pages/superadmin/Bewerbungen.tsx`: neuer Effekt, der bei DOCX-MIME (`...wordprocessingml.document`) bzw. Endung `.docx` die Signed URL als ArrayBuffer lädt, per `mammoth.convertToHtml` umwandelt und das HTML in einem State hält.
- Rendering in einem scrollbaren Container mit Tailwind-`prose`-Styling (Design-Tokens, kein hartkodiertes Weiß/Schwarz).
- HTML wird vor dem Einfügen mit DOMPurify bereinigt, da es aus einer Nutzer-Upload-Datei stammt.
- State wird beim Wechsel der Auswahl zurückgesetzt; Cleanup-Flag wie beim bestehenden Signed-URL-Effekt.
