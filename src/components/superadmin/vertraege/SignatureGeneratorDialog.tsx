import { useEffect, useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SIGNATURE_STYLES, buildSignatureSvg, type SignatureStyle } from "@/lib/signature-styles";
import { SignaturePreview } from "./SignaturePreview";
import { supabase } from "@/integrations/supabase/client";

const STYLE_KEYS: SignatureStyle[] = ["elegant", "professional", "cursive", "bold"];

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initialName: string;
  initialTitle: string;
  onGenerated: () => void;
}

export function SignatureGeneratorDialog({ open, onOpenChange, initialName, initialTitle, onGenerated }: Props) {
  const [name, setName] = useState(initialName);
  const [title, setTitle] = useState(initialTitle);
  const [style, setStyle] = useState<SignatureStyle>("elegant");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      setName(initialName);
      setTitle(initialTitle);
      setStyle("elegant");
    }
  }, [open, initialName, initialTitle]);

  async function handleGenerate() {
    if (!name.trim()) return toast.error("Bitte einen Namen eingeben");
    setBusy(true);
    try {
      const svg = buildSignatureSvg(name.trim(), style);
      const path = `signatures/sig-${Date.now()}.svg`;
      const { error: upErr } = await supabase.storage
        .from("contract-assets")
        .upload(path, new Blob([svg], { type: "image/svg+xml" }), {
          contentType: "image/svg+xml",
          upsert: true,
        });
      if (upErr) throw new Error(upErr.message);

      const { error } = await (supabase as any)
        .from("company_signature")
        .upsert(
          {
            singleton: true,
            signer_name: name.trim(),
            signer_title: title.trim(),
            signature_url: path,
            signature_source: "generated",
            signature_style: style,
          },
          { onConflict: "singleton" },
        );
      if (error) throw new Error(error.message);
      onGenerated();
      onOpenChange(false);
      toast.success("Unterschrift generiert");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Fehler beim Generieren");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Firmenunterschrift Generator
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="sig-name">Name des Unterzeichners</Label>
            <Input id="sig-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="z.B. Max Mustermann" className="mt-1" />
          </div>
          <div>
            <Label htmlFor="sig-title">Titel des Unterzeichners</Label>
            <Input id="sig-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="z.B. Geschäftsführer" className="mt-1" />
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium">Unterschrift-Stil wählen</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {STYLE_KEYS.map((key) => {
              const s = SIGNATURE_STYLES[key];
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setStyle(key)}
                  className={cn(
                    "flex flex-col items-stretch gap-2 rounded-md border p-3 text-left transition-colors",
                    style === key ? "border-primary ring-2 ring-primary/30" : "border-border hover:bg-muted/50",
                  )}
                >
                  <div className="text-sm font-semibold">{s.label}</div>
                  <div className="text-xs text-muted-foreground">{s.description}</div>
                  <div className="flex h-16 items-center justify-center overflow-hidden rounded border border-border bg-background">
                    <SignaturePreview name={name || "Max Mustermann"} style={key} />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>Abbrechen</Button>
          <Button onClick={handleGenerate} disabled={busy}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Unterschrift generieren
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
