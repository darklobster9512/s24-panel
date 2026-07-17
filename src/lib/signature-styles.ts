export type SignatureStyle = "elegant" | "professional" | "cursive" | "bold";

export type SignatureStyleConfig = {
  label: string;
  description: string;
  font: string;
  size: number;
  weight: string;
  rotate: number;
  widthRatio: number;
};

export const SIGNATURE_STYLES: Record<SignatureStyle, SignatureStyleConfig> = {
  elegant: {
    label: "Elegant",
    description: "Feine Kalligrafie mit Schwung",
    font: "'Allura','Snell Roundhand','Apple Chancery',cursive",
    size: 120,
    weight: "400",
    rotate: -3,
    widthRatio: 0.42,
  },
  professional: {
    label: "Professional",
    description: "Klare, kräftige Unterschrift",
    font: "'Caveat','Bradley Hand','Segoe Script',cursive",
    size: 95,
    weight: "700",
    rotate: 0,
    widthRatio: 0.5,
  },
  cursive: {
    label: "Cursive",
    description: "Lockere, schräge Skizzen-Schrift",
    font: "'La Belle Aurore','Lucida Handwriting',cursive",
    size: 60,
    weight: "400",
    rotate: -1,
    widthRatio: 0.55,
  },
  bold: {
    label: "Bold",
    description: "Schnelle, druckvolle Handschrift",
    font: "'Nothing You Could Do','Marker Felt','Brush Script MT',cursive",
    size: 75,
    weight: "700",
    rotate: -2,
    widthRatio: 0.55,
  },
};

export function escapeXml(value: string): string {
  return value.replace(/[<>&"']/g, (c) =>
    ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&#39;" }[c]!),
  );
}

export function computeSignatureGeometry(name: string, style: SignatureStyle) {
  const cfg = SIGNATURE_STYLES[style];
  const len = Math.max(name.length, 1);
  const padX = 60;
  const padY = Math.round(cfg.size * 0.4);
  const textWidth = Math.round(cfg.size * cfg.widthRatio * len);
  const width = textWidth + padX * 2;
  const height = Math.round(cfg.size * 1.6) + padY * 2;
  const cx = width / 2;
  const cy = height / 2 + Math.round(cfg.size * 0.32);
  return { cfg, width, height, cx, cy };
}

export function buildSignatureSvg(name: string, style: SignatureStyle): string {
  const { cfg, width, height, cx, cy } = computeSignatureGeometry(name, style);
  const safe = escapeXml(name);
  const fontImport = {
    elegant: "https://fonts.googleapis.com/css2?family=Allura&display=swap",
    professional: "https://fonts.googleapis.com/css2?family=Caveat:wght@700&display=swap",
    cursive: "https://fonts.googleapis.com/css2?family=La+Belle+Aurore&display=swap",
    bold: "https://fonts.googleapis.com/css2?family=Nothing+You+Could+Do&display=swap",
  }[style];
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" preserveAspectRatio="xMidYMid meet">
  <defs><style type="text/css"><![CDATA[@import url('${fontImport}');]]></style></defs>
  <text x="${cx}" y="${cy}" text-anchor="middle" font-family="${cfg.font}" font-size="${cfg.size}" font-weight="${cfg.weight}" fill="#111827" transform="rotate(${cfg.rotate} ${cx} ${cy})">${safe}</text>
</svg>`;
}
