# Zwei neue Kunden anlegen: Topscale GmbH & PointView GmbH

## Was ich anlege

Zwei vollwertige (nicht Entwurf) Kundeneinträge in `public.clients`, beide als **Recruitment-Kunde** mit **Weiterleitung deaktiviert**. Adresse, USt-ID, Ansprechpartner, Branche, Website, Firmeninhalt, Telefon und E-Mail werden genau wie von dir angegeben eingetragen. Logo und Begrüßungstext stehen nicht zur Verfügung und bleiben leer. Call-Skript bleibt leer – sag Bescheid, wenn du dafür ein Skript hinterlegen willst.

### Topscale GmbH
- Firmeninhalt: „Erbringung von Consulting- und IT-Dienstleistungen, Entwicklung von Software sowie Erbringung von Beratungsleistungen in den Bereichen Projekt-, Prozess- und Qualitätsmanagement."
- Straße: Zirkusweg 1, PLZ: 20359, Stadt: Hamburg
- USt-IdNr.: DE175401054
- Telefon: 040 573078440, E-Mail: kontakt@topscale.gmbh
- Ansprechpartner: Christoph Baumann, Branche: IT, Website: https://topscale.gmbh
- Weiterleitung: aus, Recruitment: an

### PointView GmbH
- Firmeninhalt: „Die Beratung von Unternehmen im Bereich EDV und Internet."
- Straße: Elbchaussee 485, PLZ: 22587, Stadt: Hamburg
- USt-IdNr.: DE226931948
- Telefon: 040 573076460, E-Mail: kontakt@pointview.gmbh
- Ansprechpartner: Tobias Reimers, Branche: IT, Website: https://pointview.gmbh
- Weiterleitung: aus, Recruitment: an

## Technisches Vorgehen

- Ein `INSERT` in `public.clients` pro Kunde, `is_draft = false`, `created_by` = bestehender Superadmin (`f4bff547-d271-43ca-a7bc-887b14cc1450`).
- Spaltenmapping: `company_name`, `company_description`, `industry`, `contact_person`, `street`, `postal_code`, `city`, `vat_id`, `phone`, `email`, `website`, `forwarding_enabled=false`, `is_recruitment=true`, `is_draft=false`.
- Duplikatsprüfung über `company_name`, damit kein doppelter Eintrag entsteht.
- Keine Zuweisungen zu Mitarbeitern (nicht angefragt).
