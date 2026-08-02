Problem: In der Vertragsvorlage "Teilzeit - 20 Stunden/Woche" sind die Abstände zwischen Titel/Arbeitgeber-/Arbeitnehmer-Blöcken zu groß, weil jeder `<p>`-Absatz im `.rich-text`-Container `margin-block: 0.65em` oben und unten erhält.

Geplante Änderung:

1. CSS-Regel für `.rich-text p` anpassen
   - Datei: `src/styles.css`
   - `margin-block: 0.65em` auf `0.65em` ist zu großzügig im Vertrags-PDF-Kontext.
   - Lösung: Die globale Regel bleibt für den Editor und die meisten Rich-Text-Views erhalten, aber wir fügen eine spezifischere Regel für die Vertragsvorschau hinzu, die die Absatzabstände im PDF-Renderer auf einen kompakteren Wert reduziert.
   - Konkret: Im Vertrags-Preview-Container (`src/pages/superadmin/ArbeitsvertragDetail.tsx`) wird die `rich-text`-Klasse erweitert oder ein zusätzlicher Wrapper ergänzt, der für `p` z.B. `margin-block: 0.25em` setzt, damit Titel und Adresszeilen enger zusammenrücken.
   - Optional: Überschriften (`h1, h2, h3`) innerhalb der Vertragsvorschau erhalten ebenfalls reduzierte `margin-block`-Werte, damit der gesamte Briefkopf kompakter wirkt.

2. Sicherstellen, dass die Änderung nur das Vertrags-PDF kompakt hält
   - Der Editor (`TipTapEditor`) und andere Rich-Text-Views (z.B. Recruitment Call-Skript, Bewerbungsgesprächs-Notizen) sollen ihre bisherigen Abstände behalten, damit bestehende Inhalte nicht ungewollt verändert werden.
   - Daher wird der spezifischere Selektor nur auf den Vertrags-Preview-Container angewendet, nicht auf die globale `.rich-text`-Klasse.

3. Überprüfung
   - Nach der Änderung die Vorlage "Teilzeit - 20 Stunden/Woche" unter `/superadmin/vertraege/<id>` öffnen.
   - Visuell prüfen, dass zwischen "Arbeitsvertrag", "Arbeitgeber:", Adressblock und "Arbeitnehmer:" weniger Leerzeichen vorhanden ist.
   - Build laufen lassen, um sicherzustellen, dass keine CSS-Validierungsfehler auftreten.

Keine Datenbank- oder Backend-Änderungen notwendig.