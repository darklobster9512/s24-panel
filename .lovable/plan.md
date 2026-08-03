Zwei neue Vollzeit-Vertragsvorlagen anlegen: **37,5h/Woche** und **35h/Woche**.

**Gehaltsberechnung** (Stundenlohn 20 €, wie bestehende Vorlagen):
- 37,5h × 20 € × 52 / 12 = **3.250,00 € brutto/Monat**
- 35h × 20 € × 52 / 12 = **3.033,33 € brutto/Monat**

**Vorgehen**
1. Bestehende Vertragsvorlage (z. B. 20h-Teilzeit) aus `contract_templates` auslesen und als Inhaltsvorlage verwenden.
2. Zwei neue Zeilen in `contract_templates` einfügen:
   - Titel: **„Vollzeit 37,5h/Woche“** – Kategorie: **Vollzeit** – Gehalt: **3250.00**
   - Titel: **„Vollzeit 35h/Woche“** – Kategorie: **Vollzeit** – Gehalt: **3033.33**
3. Inhalt anpassen: alle Stundenangaben und Gehalts-/Stundenverweise auf 37,5h bzw. 35h umstellen, Platzhalter (`{{ monatsgehalt }}`, `{{ startdatum }}`, `{{ vollname }}`, Adresse etc.) beibehalten.
4. Beide Vorlagen auf **aktiv** setzen, damit sie sofort im Mitarbeiter-Wizard unter „Vertragsvorlage auswählen“ zur Verfügung stehen.
5. Im UI unter `/superadmin/vertraege` prüfen, dass beide Karten korrekt angezeigt werden.

**Hinweis**: Die Vorlagen enthalten aktuell noch den Arbeitgeber-Namen „aigis one GmbH“ aus der Vorlage. Falls du den auf „Sekretariat24“ oder deinen aktuellen Firmennamen ändern möchtest, sag kurz Bescheid – das passiert im selben Zug.