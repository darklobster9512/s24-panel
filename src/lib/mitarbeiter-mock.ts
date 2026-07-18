// Zentrale Dummy-Daten für die /mitarbeiter Mockups.
// Wird später gegen echte Supabase-Queries getauscht.

export interface MockClient {
  id: string;
  name: string;
  branche: string;
  telefon: string;
  logo?: string; // Emoji als Logo-Platzhalter
  firmeninhalt: string;
  begruessung: string;
  weiterleitung: boolean;
  weiterleitungNummer?: string;
  ansprechpartner: string;
  ansprechpartnerTel: string;
  adresse: string;
}

export interface MockCall {
  id: string;
  clientId: string;
  anruferName: string;
  anruferNummer: string;
  richtung: "eingehend" | "ausgehend";
  status: "klingelt" | "im-gespraech" | "beendet" | "verpasst";
  startedAt: string; // ISO
  dauerSek?: number;
  kategorie?: "Rückruf" | "Termin" | "Info" | "Beschwerde" | "Weiterleitung";
  agent?: string;
}

export interface MockNote {
  id: string;
  clientId: string;
  callId?: string;
  agent: string;
  createdAt: string;
  kategorie: "Rückruf" | "Termin" | "Info" | "Beschwerde" | "Weiterleitung";
  anruferName: string;
  anruferNummer: string;
  text: string;
  rueckrufGewuenscht?: boolean;
  rueckrufZeit?: string;
}

export interface MockTicket {
  id: string;
  clientId: string;
  titel: string;
  status: "offen" | "in-bearbeitung" | "erledigt";
  prioritaet: "niedrig" | "normal" | "hoch";
  agent: string;
  createdAt: string;
  beschreibung: string;
}

// Aktuell eingeloggter Mock-Mitarbeiter — IDs der zugewiesenen Kunden
export const CURRENT_EMPLOYEE = {
  id: "emp-1",
  name: "Sofia Weber",
  loginEmail: "sofia@sekreteriat24.de",
  contractType: "Vollzeit",
  startDate: "2025-03-01",
};

export const ASSIGNED_CLIENT_IDS = ["c1", "c2", "c3", "c4"];

export const MOCK_CLIENTS: MockClient[] = [
  {
    id: "c1",
    name: "Meier & Partner GmbH",
    branche: "Rechtsanwaltskanzlei",
    telefon: "+49 30 12345678",
    logo: "⚖️",
    firmeninhalt:
      "Kanzlei für Wirtschafts- und Arbeitsrecht mit 12 Anwälten. Fokus auf Mittelstand und Startups im Berliner Raum.",
    begruessung:
      "Guten Tag, Kanzlei Meier & Partner, mein Name ist [Name], wie kann ich Ihnen helfen?",
    weiterleitung: true,
    weiterleitungNummer: "+49 30 12345699",
    ansprechpartner: "Dr. Klaus Meier",
    ansprechpartnerTel: "+49 30 12345600",
    adresse: "Kurfürstendamm 42, 10719 Berlin",
  },
  {
    id: "c2",
    name: "Zahnpraxis Nord",
    branche: "Zahnmedizin",
    telefon: "+49 40 5551234",
    logo: "🦷",
    firmeninhalt:
      "Moderne Zahnarztpraxis in Hamburg-Nord. Schwerpunkte: Prophylaxe, Implantologie, Kieferorthopädie. Öffnungszeiten Mo–Fr 8–18 Uhr.",
    begruessung:
      "Zahnpraxis Nord, guten Tag, Sie sprechen mit [Name].",
    weiterleitung: false,
    ansprechpartner: "Dr. Anna Schröder",
    ansprechpartnerTel: "+49 40 5551200",
    adresse: "Alsterdorfer Str. 88, 22297 Hamburg",
  },
  {
    id: "c3",
    name: "Beckmann Immobilien",
    branche: "Immobilienmakler",
    telefon: "+49 89 998877",
    logo: "🏠",
    firmeninhalt:
      "Immobilienmakler für Wohn- und Gewerbeobjekte in München und Umgebung. Vermittlung von Miet- und Kaufobjekten seit 1998.",
    begruessung:
      "Beckmann Immobilien, guten Tag, [Name] am Apparat.",
    weiterleitung: true,
    weiterleitungNummer: "+49 89 998800",
    ansprechpartner: "Michael Beckmann",
    ansprechpartnerTel: "+49 89 998811",
    adresse: "Maximilianstr. 12, 80539 München",
  },
  {
    id: "c4",
    name: "Café Sonne",
    branche: "Gastronomie",
    telefon: "+49 221 445566",
    logo: "☕",
    firmeninhalt:
      "Kleines Café in der Kölner Südstadt. Reservierungen für Frühstück und Mittagstisch, Cateringanfragen weiterleiten.",
    begruessung:
      "Café Sonne, hallo, [Name] hier.",
    weiterleitung: false,
    ansprechpartner: "Lena Fischer",
    ansprechpartnerTel: "+49 221 445500",
    adresse: "Chlodwigplatz 7, 50678 Köln",
  },
  {
    id: "c5",
    name: "Kanzlei Brandt & Söhne",
    branche: "Rechtsanwaltskanzlei",
    telefon: "+49 69 776655",
    logo: "📜",
    firmeninhalt: "Nicht zugewiesen — für andere Mitarbeiter.",
    begruessung: "",
    weiterleitung: false,
    ansprechpartner: "—",
    ansprechpartnerTel: "—",
    adresse: "Frankfurt",
  },
];

export const MOCK_LIVE_CALLS: MockCall[] = [
  {
    id: "call-live-1",
    clientId: "c1",
    anruferName: "unbekannt",
    anruferNummer: "+49 172 8845621",
    richtung: "eingehend",
    status: "klingelt",
    startedAt: new Date(Date.now() - 12_000).toISOString(),
  },
  {
    id: "call-live-2",
    clientId: "c3",
    anruferName: "Herr Weiß",
    anruferNummer: "+49 89 4433221",
    richtung: "eingehend",
    status: "klingelt",
    startedAt: new Date(Date.now() - 38_000).toISOString(),
  },
];

export const MOCK_RECENT_CALLS: MockCall[] = [
  {
    id: "call-1",
    clientId: "c1",
    anruferName: "Frau Schulze",
    anruferNummer: "+49 30 555 1234",
    richtung: "eingehend",
    status: "beendet",
    startedAt: new Date(Date.now() - 25 * 60_000).toISOString(),
    dauerSek: 214,
    kategorie: "Rückruf",
    agent: "Sofia Weber",
  },
  {
    id: "call-2",
    clientId: "c2",
    anruferName: "Herr Bauer",
    anruferNummer: "+49 40 662233",
    richtung: "eingehend",
    status: "beendet",
    startedAt: new Date(Date.now() - 45 * 60_000).toISOString(),
    dauerSek: 138,
    kategorie: "Termin",
    agent: "Sofia Weber",
  },
  {
    id: "call-3",
    clientId: "c3",
    anruferName: "Frau Yildiz",
    anruferNummer: "+49 172 998877",
    richtung: "eingehend",
    status: "verpasst",
    startedAt: new Date(Date.now() - 90 * 60_000).toISOString(),
    agent: "Sofia Weber",
  },
  {
    id: "call-4",
    clientId: "c4",
    anruferName: "Herr Hoffmann",
    anruferNummer: "+49 221 111 222",
    richtung: "eingehend",
    status: "beendet",
    startedAt: new Date(Date.now() - 3 * 3600_000).toISOString(),
    dauerSek: 92,
    kategorie: "Info",
    agent: "Sofia Weber",
  },
];

export const MOCK_NOTES: MockNote[] = [
  {
    id: "n1",
    clientId: "c1",
    callId: "call-1",
    agent: "Sofia Weber",
    createdAt: new Date(Date.now() - 25 * 60_000).toISOString(),
    kategorie: "Rückruf",
    anruferName: "Frau Schulze",
    anruferNummer: "+49 30 555 1234",
    text: "Mandantin möchte Rückruf zur Vertragsprüfung. Zeitfenster morgen 10–12 Uhr.",
    rueckrufGewuenscht: true,
    rueckrufZeit: "morgen 10:00",
  },
  {
    id: "n2",
    clientId: "c2",
    callId: "call-2",
    agent: "Sofia Weber",
    createdAt: new Date(Date.now() - 45 * 60_000).toISOString(),
    kategorie: "Termin",
    anruferName: "Herr Bauer",
    anruferNummer: "+49 40 662233",
    text: "Kontrolltermin vereinbart für Dienstag 09:30. Patient kommt zum ersten Mal.",
  },
  {
    id: "n3",
    clientId: "c3",
    agent: "Sofia Weber",
    createdAt: new Date(Date.now() - 2 * 3600_000).toISOString(),
    kategorie: "Weiterleitung",
    anruferName: "Herr Weber",
    anruferNummer: "+49 89 3322110",
    text: "Interessent für Objekt Rosenstraße — an Herrn Beckmann weitergeleitet.",
  },
  {
    id: "n4",
    clientId: "c4",
    callId: "call-4",
    agent: "Sofia Weber",
    createdAt: new Date(Date.now() - 3 * 3600_000).toISOString(),
    kategorie: "Info",
    anruferName: "Herr Hoffmann",
    anruferNummer: "+49 221 111 222",
    text: "Frage nach Öffnungszeiten am Feiertag — Auskunft gegeben.",
  },
];

export const MOCK_TICKETS: MockTicket[] = [
  {
    id: "t1",
    clientId: "c1",
    titel: "Angebot Wartungsvertrag erstellen",
    status: "offen",
    prioritaet: "hoch",
    agent: "Sofia Weber",
    createdAt: new Date(Date.now() - 60 * 60_000).toISOString(),
    beschreibung: "Kunde erwartet Angebot bis Freitag. Umfang: 12 Monate, monatliche Rechnung.",
  },
  {
    id: "t2",
    clientId: "c3",
    titel: "Besichtigung Rosenstraße bestätigen",
    status: "in-bearbeitung",
    prioritaet: "normal",
    agent: "Sofia Weber",
    createdAt: new Date(Date.now() - 5 * 3600_000).toISOString(),
    beschreibung: "Termin Donnerstag 14:00 — Interessent bringt Partner mit.",
  },
  {
    id: "t3",
    clientId: "c2",
    titel: "Patientendaten aktualisieren",
    status: "erledigt",
    prioritaet: "niedrig",
    agent: "Sofia Weber",
    createdAt: new Date(Date.now() - 24 * 3600_000).toISOString(),
    beschreibung: "Neue Anschrift von Frau Bauer im System hinterlegt.",
  },
  {
    id: "t4",
    clientId: "c4",
    titel: "Cateringanfrage weiterleiten",
    status: "offen",
    prioritaet: "normal",
    agent: "Sofia Weber",
    createdAt: new Date(Date.now() - 8 * 3600_000).toISOString(),
    beschreibung: "Firmenfeier für 40 Personen am 20.11. — Anfrage an Lena Fischer.",
  },
];

export function fmtTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
}

export function fmtRelative(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return `vor ${Math.floor(diff)}s`;
  if (diff < 3600) return `vor ${Math.floor(diff / 60)}min`;
  if (diff < 86400) return `vor ${Math.floor(diff / 3600)}h`;
  return `vor ${Math.floor(diff / 86400)}d`;
}

export function fmtDauer(sek?: number) {
  if (!sek) return "—";
  const m = Math.floor(sek / 60);
  const s = sek % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}
