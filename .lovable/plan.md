# Neues Call-Skript für „aigis one GmbH" (Sekretariat24 intern)

Der Kunde `aigis one GmbH` (Recruitment-Kunde, Skript-Variablen: Mein_Name = Julian Vollmer, Firmenname = Sekretariat24) bekommt ein neues Call-Skript. Es ersetzt das aktuelle Bewerber-Onboarding-Skript und passt zum Bewerbungsgespräch für die Stelle **Telefonische:r Recruiter:in (m/w/d)** aus der Karriereseite.

Kernbotschaft: Bewerbungen kommen meist auf die Sekretariats-Stelle – dort ist aktuell **kein Platz frei**; offen ist ausschließlich die **Recruiter:in-Stelle** (20 €/Std., 100 % Homeoffice, Teil-/Vollzeit).

## Änderung

Nur ein Datenbank-Update: `clients.call_script_content` für `aigis one GmbH` (id `b122af54…`) wird durch den Text unten ersetzt. Keine Code-Änderung, Variablen `[Bewerber_Name]`, `[Mein_Name]`, `[Firmenname]` bleiben wie gehabt.

## Skript-Entwurf

**1. Begrüßung**
Hallo Frau/Herr [Bewerber_Name], mein Name ist [Mein_Name] von [Firmenname].
Vielen Dank für Ihre Bewerbung und dass Sie sich heute Zeit nehmen.
Passt es Ihnen gerade zeitlich – haben Sie ca. 15 Minuten?
Wäre es für Sie in Ordnung, wenn wir uns duzen? Bei uns im Team ist das üblich.
*(Bei Zustimmung)* Super, danke dir – dann leg ich direkt los.

**2. Einordnung der Stelle (wichtig, gleich zu Beginn)**
Eine Sache vorweg, damit wir beide nicht aneinander vorbeireden:
Du hast dich bei uns im Bereich Sekretariat / Telefonservice beworben. Dort sind aktuell **alle Plätze besetzt** – wir stellen im Sekretariat gerade nicht ein.
Was wir aktuell **offen** haben, ist die Stelle als **telefonische:r Recruiter:in**. Die Rahmenbedingungen sind identisch: **20 € Stundenlohn, 100 % Homeoffice, Teilzeit oder Vollzeit**, planbare Schichten.
Der Unterschied: Du nimmst keine Kundenanrufe entgegen, sondern rufst Bewerber:innen unserer Kundenunternehmen an und führst mit ihnen Erstgespräche.
**Ist das grundsätzlich etwas, das für dich in Frage kommt?**
*(Falls nein: Dank für die Zeit, wir nehmen dich gerne in den Pool auf und melden uns, sobald im Sekretariat wieder etwas frei wird. – Gespräch freundlich beenden.)*

**3. Kennenlernen**
Bevor ich die Stelle im Detail vorstelle, erzähl mir kurz etwas über dich:
- Was machst du aktuell beruflich?
- Wo hast du schon telefoniert – Recruiting, Personal, Vertrieb oder Kundenservice?
- Suchst du Vollzeit oder Teilzeit? Wie viele Stunden pro Woche?
- Ab wann könntest du starten?
- Wie sieht dein Arbeitsplatz zuhause aus – ruhig und ungestört?

**4. Die Stelle: Telefonische:r Recruiter:in**
Unsere Kundenunternehmen – Handwerksbetriebe, Praxen, Online-Shops – beauftragen uns damit, ihre Bewerber:innen telefonisch anzusprechen und vorzuqualifizieren. Du bist dabei der erste persönliche Kontakt.
Deine Aufgaben:
- Kandidat:innen für Kundenunternehmen telefonisch ansprechen und vorqualifizieren
- Telefonische Erstgespräche (Screening-Calls) führen und Ergebnisse dokumentieren
- Interviewtermine zwischen Kandidat:innen und Kundenunternehmen koordinieren
- Bewerberdaten im Bewerbermanagement bzw. CRM des jeweiligen Kunden pflegen
- Zu- und Absagen sowie Nachfassaktionen im Namen der Kunden kommunizieren
Du arbeitest mit festen Gesprächsleitfäden und klaren Prozessen – du musst dir also nichts selbst ausdenken.
**Wie klingt das für dich?**

**5. Rahmenbedingungen**
- 20 € Stundenlohn
- 100 % Homeoffice, deutschlandweit
- Teilzeit oder Vollzeit, planbare Schichten
- Feste Ansprechpartner, Einarbeitung durch das Team
Was du mitbringen musst:
- Verhandlungssicheres Deutsch in Wort und Schrift
- Vorerfahrung am Telefon (Recruiting, Personal, Vertrieb oder Kundenbetreuung)
- Ruhiger Arbeitsplatz ohne Hintergrundgeräusche
- Eigener Computer/Laptop, Headset und stabile Internetverbindung
**Ist das bei dir alles gegeben?**

**6. Rückfragen des Bewerbers**
Was möchtest du von mir wissen?
*(Häufige Fragen: Schichtzeiten, Einarbeitung, Vertragsart, Startdatum – ehrlich und konkret beantworten.)*

**7. Nächste Schritte**
Wenn das für dich passt, ist der Ablauf so:
1. Ich halte unser Gespräch intern fest und gebe deine Unterlagen weiter.
2. Du bekommst per E-Mail deinen Zugang zu unserem Mitarbeiterportal – dort läuft alles Weitere: Onboarding, Unterlagen, Vertrag.
3. Nach Freigabe vereinbaren wir deinen Onboarding-Termin und dein Startdatum.
Bitte achte darauf, dass du in den nächsten Tagen telefonisch und per E-Mail gut erreichbar bist.
**Ab wann könntest du realistisch starten?** *(Antwort notieren.)*

**8. Abschluss**
Dann bedanke ich mich herzlich für deine Zeit und das offene Gespräch.
Du hörst zeitnah von uns – bei Fragen melde dich jederzeit.
Einen schönen Tag noch und bis bald bei [Firmenname]!

## Technisch

- Update via Migration/SQL auf `public.clients` (`id = b122af54-7a0c-40c5-b33f-6673a3dfd2ca`), Feld `call_script_content` als HTML (`h1`/`h2`/`p`/`ul`) im gleichen Format wie `src/lib/call-script-template.ts`.
- Anzeige unverändert über `/mitarbeiter/kunden/:id` und `/mitarbeiter/erfassen`.
