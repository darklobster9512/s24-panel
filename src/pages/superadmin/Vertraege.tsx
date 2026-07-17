import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, FileText, Copy, Trash2, Pencil, Upload, Sparkles, RefreshCw, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, Panel } from "@/components/superadmin/SuperadminLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { SignatureGeneratorDialog } from "@/components/superadmin/vertraege/SignatureGeneratorDialog";

type Template = {
  id: string;
  title: string;
  category: string | null;
  monthly_salary: number;
  version: number;
  is_active: boolean;
  updated_at: string;
};

type CompanySignature = {
  signer_name: string;
  signer_title: string;
  signature_url: string | null;
  signature_source: string;
  signature_style: string | null;
  updated_at: string;
};

export default function Vertraege() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [signature, setSignature] = useState<CompanySignature | null>(null);
  const [signatureSignedUrl, setSignatureSignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [genOpen, setGenOpen] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [titleDraft, setTitleDraft] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function load() {
    setLoading(true);
    const [tpl, sig] = await Promise.all([
      supabase.from("contract_templates" as never).select("id,title,category,monthly_salary,version,is_active,updated_at").order("updated_at", { ascending: false }),
      supabase.from("company_signature" as never).select("signer_name,signer_title,signature_url,signature_source,signature_style,updated_at").eq("singleton", true).maybeSingle(),
    ]);
    if (tpl.error) toast.error(tpl.error.message);
    else setTemplates((tpl.data ?? []) as Template[]);
    if (sig.data) {
      const s = sig.data as unknown as CompanySignature;
      setSignature(s);
      setNameDraft(s.signer_name);
      setTitleDraft(s.signer_title);
      if (s.signature_url) {
        const { data } = await supabase.storage.from("contract-assets").createSignedUrl(s.signature_url, 60 * 60);
        setSignatureSignedUrl(data?.signedUrl ?? null);
      } else {
        setSignatureSignedUrl(null);
      }
    }
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  async function persistSigner(name: string, jobTitle: string) {
    const { error } = await supabase
      .from("company_signature" as never)
      .upsert({ singleton: true, signer_name: name, signer_title: jobTitle }, { onConflict: "singleton" });
    if (error) toast.error(error.message);
  }

  function onSignerChange(name: string, jobTitle: string) {
    setNameDraft(name);
    setTitleDraft(jobTitle);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => void persistSigner(name, jobTitle), 600);
  }

  async function handleCreate() {
    if (!user) return;
    const { data, error } = await supabase
      .from("contract_templates" as never)
      .insert({ title: "Neue Vorlage", category: "Arbeitsvertrag", content_html: "<p></p>", created_by: user.id })
      .select("id")
      .single();
    if (error || !data) return toast.error(error?.message ?? "Fehler");
    navigate(`/superadmin/vertraege/${(data as { id: string }).id}`);
  }

  async function handleDuplicate(id: string) {
    if (!user) return;
    const { data: src } = await supabase.from("contract_templates" as never).select("*").eq("id", id).single();
    if (!src) return;
    const s = src as Record<string, unknown>;
    const { data, error } = await supabase
      .from("contract_templates" as never)
      .insert({
        title: `${s.title as string} (Kopie)`,
        category: s.category,
        monthly_salary: s.monthly_salary,
        content_html: s.content_html,
        is_active: false,
        created_by: user.id,
      })
      .select("id")
      .single();
    if (error) return toast.error(error.message);
    toast.success("Vorlage dupliziert");
    if (data) navigate(`/superadmin/vertraege/${(data as { id: string }).id}`);
  }

  async function handleDelete() {
    if (!deleteId) return;
    const { error } = await supabase.from("contract_templates" as never).delete().eq("id", deleteId);
    if (error) toast.error(error.message);
    else {
      toast.success("Vorlage gelöscht");
      setTemplates((prev) => prev.filter((t) => t.id !== deleteId));
    }
    setDeleteId(null);
  }

  async function handleUpload(file: File) {
    if (!file.type.startsWith("image/")) return toast.error("Bitte Bilddatei wählen");
    if (file.size > 5 * 1024 * 1024) return toast.error("Max 5 MB");
    const ext = file.name.split(".").pop() || "png";
    const path = `signatures/sig-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from("contract-assets")
      .upload(path, file, { contentType: file.type, upsert: true });
    if (upErr) return toast.error(upErr.message);
    const { error } = await supabase
      .from("company_signature" as never)
      .upsert(
        { singleton: true, signer_name: nameDraft, signer_title: titleDraft, signature_url: path, signature_source: "upload", signature_style: null },
        { onConflict: "singleton" },
      );
    if (error) return toast.error(error.message);
    toast.success("Unterschrift hochgeladen");
    void load();
  }

  const templateCards = useMemo(() => templates, [templates]);

  return (
    <>
      <PageHeader
        title="Verträge"
        subtitle="Arbeitsvertrags-Vorlagen und Firmenunterschrift verwalten."
        actions={
          <Button size="sm" className="gap-2" onClick={handleCreate}>
            <Plus className="h-4 w-4" /> Neue Vorlage
          </Button>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <Panel title="Vertragsvorlagen">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : templateCards.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border/60 p-10 text-center">
              <FileText className="mx-auto h-10 w-10 text-muted-foreground/60" />
              <p className="mt-3 text-sm text-muted-foreground">Noch keine Vorlagen. Lege deine erste Vorlage an.</p>
              <Button onClick={handleCreate} className="mt-4 gap-2">
                <Plus className="h-4 w-4" /> Neue Vorlage
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {templateCards.map((t) => (
                <Card key={t.id} className="flex flex-col gap-3 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <h3 className="truncate font-semibold">{t.title}</h3>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5">
                        {t.category && <Badge variant="secondary" className="text-xs">{t.category}</Badge>}
                        <Badge variant="outline" className="text-xs">v{t.version}</Badge>
                        {t.is_active ? (
                          <Badge className="bg-primary/20 text-ink-deep text-xs">aktiv</Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs">Entwurf</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Aktualisiert {new Date(t.updated_at).toLocaleDateString("de-DE")}
                  </p>
                  <div className="mt-auto flex flex-wrap gap-2">
                    <Button asChild size="sm" variant="default" className="gap-1.5">
                      <Link to={`/superadmin/vertraege/${t.id}`}>
                        <Pencil className="h-3.5 w-3.5" /> Bearbeiten
                      </Link>
                    </Button>
                    <Button size="sm" variant="outline" className="gap-1.5" onClick={() => handleDuplicate(t.id)}>
                      <Copy className="h-3.5 w-3.5" /> Duplizieren
                    </Button>
                    <Button size="sm" variant="ghost" className="gap-1.5 text-destructive hover:text-destructive" onClick={() => setDeleteId(t.id)}>
                      <Trash2 className="h-3.5 w-3.5" /> Löschen
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </Panel>

        <Panel title="Firmenunterschrift">
          <div className="space-y-4">
            <div>
              <Label htmlFor="signer-name">Name</Label>
              <Input
                id="signer-name"
                value={nameDraft}
                onChange={(e) => onSignerChange(e.target.value, titleDraft)}
                placeholder="Max Mustermann"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="signer-title">Position</Label>
              <Input
                id="signer-title"
                value={titleDraft}
                onChange={(e) => onSignerChange(nameDraft, e.target.value)}
                placeholder="Geschäftsführer"
                className="mt-1"
              />
            </div>

            <div className="rounded-md border border-border/60 bg-muted/20 p-4">
              <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">Vorschau</p>
              {signatureSignedUrl ? (
                <div className="flex flex-col items-center gap-2">
                  <img src={signatureSignedUrl} alt="Unterschrift" className="max-h-24 w-auto" />
                  <div className="text-center text-xs text-muted-foreground">
                    <div className="font-medium text-foreground">{signature?.signer_name}</div>
                    <div>{signature?.signer_title}</div>
                  </div>
                </div>
              ) : (
                <p className="py-6 text-center text-sm text-muted-foreground">Noch keine Unterschrift generiert oder hochgeladen.</p>
              )}
            </div>

            <div className="grid gap-2">
              <Button className="gap-2" onClick={() => setGenOpen(true)}>
                <Sparkles className="h-4 w-4" />
                {signature?.signature_url ? "Neu generieren" : "Unterschrift generieren"}
              </Button>
              <Button variant="outline" className="gap-2" onClick={() => fileInputRef.current?.click()}>
                <Upload className="h-4 w-4" /> Bild hochladen
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void handleUpload(f);
                  e.target.value = "";
                }}
              />
              <Button variant="ghost" size="sm" className="gap-2" onClick={() => void load()}>
                <RefreshCw className="h-3.5 w-3.5" /> Aktualisieren
              </Button>
            </div>
          </div>
        </Panel>
      </div>

      <SignatureGeneratorDialog
        open={genOpen}
        onOpenChange={setGenOpen}
        initialName={nameDraft || "Max Mustermann"}
        initialTitle={titleDraft}
        onGenerated={() => void load()}
      />

      <AlertDialog open={!!deleteId} onOpenChange={(v) => !v && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Vorlage löschen?</AlertDialogTitle>
            <AlertDialogDescription>Diese Aktion kann nicht rückgängig gemacht werden.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
