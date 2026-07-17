export type ContractPlaceholder = { token: string; label: string };
export type ContractPlaceholderGroup = { title: string; items: ContractPlaceholder[] };

export const CONTRACT_PLACEHOLDER_GROUPS: ContractPlaceholderGroup[] = [
  {
    title: "Persönliche Daten",
    items: [
      { token: "{{ vorname }}", label: "Vorname" },
      { token: "{{ nachname }}", label: "Nachname" },
      { token: "{{ vollname }}", label: "Vollständiger Name" },
      { token: "{{ email }}", label: "E-Mail" },
      { token: "{{ telefon }}", label: "Telefon" },
      { token: "{{ geburtsdatum }}", label: "Geburtsdatum" },
      { token: "{{ geburtsort }}", label: "Geburtsort" },
      { token: "{{ familienstand }}", label: "Familienstand" },
      { token: "{{ beschaeftigungsart }}", label: "Beschäftigungsart" },
      { token: "{{ startdatum }}", label: "Startdatum" },
    ],
  },
  {
    title: "Adresse",
    items: [
      { token: "{{ strasse }}", label: "Straße" },
      { token: "{{ plz }}", label: "PLZ" },
      { token: "{{ stadt }}", label: "Stadt" },
      { token: "{{ adresse }}", label: "Komplette Adresse" },
    ],
  },
  {
    title: "Bankdaten",
    items: [
      { token: "{{ iban }}", label: "IBAN" },
      { token: "{{ bic }}", label: "BIC" },
      { token: "{{ bank }}", label: "Bank" },
      { token: "{{ steuer_id }}", label: "Steuer-ID" },
      { token: "{{ sv_nummer }}", label: "Sozialversicherungsnummer" },
      { token: "{{ krankenkasse }}", label: "Krankenkasse" },
    ],
  },
  {
    title: "Vertrag & Firma",
    items: [
      { token: "{{ monatsgehalt }}", label: "Monatliches Gehalt" },
      { token: "{{ firma }}", label: "Firmenname" },
      { token: "{{ heutiges_datum }}", label: "Heutiges Datum" },
    ],
  },
];
