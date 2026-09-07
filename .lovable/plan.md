# Outbound-Recruitment und Onboarding für 11 Mitarbeiter aktivieren

Für die genannten Mitarbeiter werden in einem Rutsch gesetzt:

- Outbound-Recruitment aktiv + der jeweilige `clk_`-Schlüssel
- Onboarding aktiv, Telefonsystem **Sipgate**
- Softphone-Zugangsdaten: die angegebene E-Mail + das `Sipgate…`-Passwort

## Werte

| Mitarbeiter | Softphone-E-Mail | Passwort | Schlüssel |
|---|---|---|---|
| Patrick Ulmer | p.ulmer@sekretariat-24.de | Sipgate392806 | clk_3f86… |
| Vanessa Pfister | v.pfister@sekretariat24.app | Sipgate87513656 | clk_11f1… |
| Alina Reetz | a.reetz@sekretariat-24.de | Sipgate23578233 | – (kein Schlüssel) |
| Tom Henke | t.henke@sekretariat24.app | Sipgate82935732 | clk_de22… |
| Kevin Wettin | k.wettin@sekretariat24.app | Sipgate872538212 | clk_69ce… |
| Marcel Röll | m.roell@sekretariat24.app | Sipgate67518758 | clk_af71… |
| Stefanie Botros | s.botros@sekretariat24.app | Sipgate82953782 | clk_19ad… |
| Melanie Dreesmann | m.dreesmann@sekretariat24.app | Sipgate73654452 | clk_3a20… |
| Christiane Rappholz | c.rappholz@sekretariat24.app | Sipgate78325671 | clk_5de2… |
| Jacqueline Kaleyta | j.kaleyta@sekretariat24.app | Sipgate35726875 | clk_8bbd… |
| Dorian Pitz | d.pitz@sekretariat24.app | Sipgate68759897 | clk_bd5d… |

Alina Reetz bekommt Onboarding, Sipgate und Zugangsdaten; Outbound-Recruitment bleibt bei ihr ohne Schlüssel aktiviert, der Schlüssel kann später nachgetragen werden.

## Hinweise

- Die Telefonnummern in Klammern werden nicht hinterlegt (nur Info).
- Die Login-E-Mail für das Portal bleibt unverändert – teils weicht sie von der Softphone-E-Mail ab (z. B. Tom Henke, Kevin Wettin, Stefanie Botros, Dorian Pitz sind mit `@sekretariat-24.de` angelegt). Die oben genannten Adressen werden nur als Softphone-Zugang gespeichert.
- Patrick Ulmer hat bisher gar keinen Portal-Login; das ändert sich hier nicht.

## Technisch

- Ein Daten-Update auf `public.employees` (`outbound_recruitment`, `caller_api_key`, `onboarding_enabled`, `phone_system='sipgate'`, `softphone_email`, `softphone_password`), adressiert über die bekannten Mitarbeiter-IDs.
- Keine Schema-Änderung, keine Codeänderung; danach Kontrollabfrage über alle 11 Zeilen.
