// Replaces {{ token }} placeholders in a contract template HTML with employee data.
export type ContractVars = {
  vorname?: string | null;
  nachname?: string | null;
  email?: string | null;
  telefon?: string | null;
  geburtsdatum?: string | null;
  geburtsort?: string | null;
  familienstand?: string | null;
  beschaeftigungsart?: string | null;
  startdatum?: string | null;
  strasse?: string | null;
  plz?: string | null;
  stadt?: string | null;
  iban?: string | null;
  bic?: string | null;
  bank?: string | null;
  steuer_id?: string | null;
  sv_nummer?: string | null;
  krankenkasse?: string | null;
  monatsgehalt?: string | number | null;
  firma?: string | null;
};

function esc(v: unknown): string {
  if (v === null || v === undefined || v === "") return "____________";
  return String(v);
}

export function renderContractHtml(html: string, vars: ContractVars): string {
  const vollname = [vars.vorname, vars.nachname].filter(Boolean).join(" ");
  const adresse = [
    vars.strasse,
    [vars.plz, vars.stadt].filter(Boolean).join(" "),
  ]
    .filter(Boolean)
    .join(", ");
  const map: Record<string, unknown> = {
    vorname: vars.vorname,
    nachname: vars.nachname,
    vollname,
    email: vars.email,
    telefon: vars.telefon,
    geburtsdatum: vars.geburtsdatum,
    geburtsort: vars.geburtsort,
    familienstand: vars.familienstand,
    beschaeftigungsart: vars.beschaeftigungsart,
    startdatum: vars.startdatum,
    strasse: vars.strasse,
    plz: vars.plz,
    stadt: vars.stadt,
    adresse,
    iban: vars.iban,
    bic: vars.bic,
    bank: vars.bank,
    steuer_id: vars.steuer_id,
    sv_nummer: vars.sv_nummer,
    krankenkasse: vars.krankenkasse,
    monatsgehalt:
      vars.monatsgehalt != null && vars.monatsgehalt !== ""
        ? `${vars.monatsgehalt} €`
        : null,
    firma: vars.firma ?? "Sekretariat24",
    heutiges_datum: new Date().toLocaleDateString("de-DE"),
  };
  return html.replace(/\{\{\s*([a-zA-Z_]+)\s*\}\}/g, (_m, key) => esc(map[key]));
}
