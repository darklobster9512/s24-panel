import { computeSignatureGeometry, escapeXml, SIGNATURE_STYLES, type SignatureStyle } from "@/lib/signature-styles";
import { cn } from "@/lib/utils";

export function SignaturePreview({ name, style, className }: { name: string; style: SignatureStyle; className?: string }) {
  const cfg = SIGNATURE_STYLES[style];
  const { width, height, cx, cy } = computeSignatureGeometry(name || " ", style);
  const safe = escapeXml(name || " ");
  return (
    <div className={cn("flex w-full items-center justify-center overflow-hidden text-foreground", className)}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="xMidYMid meet"
        className="h-full w-full"
        dangerouslySetInnerHTML={{
          __html: `<text x="${cx}" y="${cy}" text-anchor="middle" font-family="${cfg.font}" font-size="${cfg.size}" font-weight="${cfg.weight}" fill="currentColor" transform="rotate(${cfg.rotate} ${cx} ${cy})">${safe}</text>`,
        }}
      />
    </div>
  );
}
