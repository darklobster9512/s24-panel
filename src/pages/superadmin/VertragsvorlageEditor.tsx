import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { Editor } from "@tiptap/react";
import { PageHeader, Panel } from "@/components/superadmin/SuperadminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { TipTapEditor } from "@/components/superadmin/vertraege/TipTapEditor";
import { ContractPlaceholdersPanel } from "@/components/superadmin/vertraege/ContractPlaceholdersPanel";

const CATEGORIES = ["Arbeitsvertrag", "Vollzeit", "Teilzeit", "Minijob", "Freelance", "Praktikum", "Sonstige"];

export default function VertragsvorlageEditor() {
  const { templateId } = useParams<{ templateId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<string>("Arbeitsvertrag");
  const [salary, setSalary] = useState<string>("0");
  const [isActive, setIsActive] = useState(false);
  const [html, setHtml] = useState<string>("");
  const editorRef = useRef<Editor | null>(null);

  useEffect(() => {
    if (!templateId) return;
    void (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("contract_templates" as any)
        .select("*")
        .eq("id", templateId)
        .maybeSingle();
      if (error) toast.error(error.message);
      if (data) {
        const d = data as Record<string, unknown>;
        setTitle((d.title as string) ?? "");
        setCategory(((d.category as string) ?? "Arbeitsvertrag") || "Arbeitsvertrag");
        setSalary(String(d.monthly_salary ?? 0));
        setIsActive(Boolean(d.is_active));
        setHtml((d.content_html as string) ?? "");
      }
      setLoading(false);
    })();
  }, [templateId]);

  async function save() {
    if (!templateId) return;
    if (!title.trim()) return toast.error("Bitte einen Titel eingeben");
    setSaving(true);
    const { error } = await supabase
      .from("contract_templates" as any)
      .update({
        title: title.trim(),
        category,
        monthly_salary: Number(salary) || 0,
        is_active: isActive,
        content_html: html,
      })
      .eq("id", templateId);
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success("Vorlage gespeichert");
  }

  function insertPlaceholder(token: string) {
    const e = editorRef.current;
    if (!e) return;
    e.chain().focus().insertContent(token + " ").run();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Vertragsvorlage bearbeiten"
        subtitle="Metadaten, Inhalt und Platzhalter der Vorlage anpassen."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2" onClick={() => navigate("/superadmin/vertraege")}>
              <ArrowLeft className="h-4 w-4" /> Zurück
            </Button>
            <Button size="sm" className="gap-2" onClick={save} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Speichern
            </Button>
          </div>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <Panel title="Metadaten">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label htmlFor="title">Titel</Label>
                <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label>Kategorie</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="salary">Monatliches Gehalt (€)</Label>
                <Input id="salary" type="number" min="0" step="0.01" value={salary} onChange={(e) => setSalary(e.target.value)} className="mt-1" />
              </div>
              <div className="flex items-center justify-between rounded-md border border-border/60 p-3 sm:col-span-2">
                <div>
                  <Label className="text-sm">Aktiv</Label>
                  <p className="text-xs text-muted-foreground">Nur aktive Vorlagen können für den Versand ausgewählt werden.</p>
                </div>
                <Switch checked={isActive} onCheckedChange={setIsActive} />
              </div>
            </div>
          </Panel>

          <Panel title="Vertragsinhalt">
            <TipTapEditor value={html} onChange={setHtml} onEditorReady={(e) => { editorRef.current = e; }} />
          </Panel>
        </div>

        <div className="space-y-6">
          <ContractPlaceholdersPanel onInsert={insertPlaceholder} />
        </div>
      </div>
    </>
  );
}
