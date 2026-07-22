import { useEffect, useMemo, useState } from "react";
import { PageHeader, Panel } from "@/components/superadmin/SuperadminLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Search, FileText, Download, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

type Application = {
  id: string;
  vorname: string;
  nachname: string;
  email: string;
  handynummer: string;
  geburtsdatum: string;
  staatsangehoerigkeit: string;
  anstellung: string;
  lebenslauf_path: string | null;
  lebenslauf_filename: string | null;
  lebenslauf_mime: string | null;
  status: string;
  created_at: string;
};

const STATUS_OPTIONS = [
  { value: "neu", label: "Neu" },
  { value: "gesichtet", label: "Gesichtet" },
  { value: "angenommen", label: "Angenommen" },
  { value: "abgelehnt", label: "Abgelehnt" },
];

function statusVariant(s: string): "default" | "secondary" | "destructive" | "outline" {
  if (s === "abgelehnt") return "destructive";
  if (s === "angenommen") return "default";
  if (s === "gesichtet") return "outline";
  return "secondary";
}

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("de-DE");
}

export default function Bewerbungen() {
  const [rows, setRows] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selected, setSelected] = useState<Application | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const { data, error } = await (supabase as any)
        .from("applications")
        .select("*")
        .order("created_at", { ascending: false });
      if (cancelled) return;
      if (error) {
        console.error("[Bewerbungen] load failed:", error.message);
        toast.error("Bewerbungen konnten nicht geladen werden");
      }
      setRows((data as Application[]) ?? []);
      setLoading(false);
    }
    load();

    const channel = supabase
      .channel("superadmin_applications")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "applications" },
        () => load(),
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (q) {
        const hay = [r.vorname, r.nachname, r.email, r.handynummer, r.staatsangehoerigkeit]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [rows, search, statusFilter]);

  async function updateStatus(id: string, status: string) {
    const { error } = await (supabase as any)
      .from("applications")
      .update({ status })
      .eq("id", id);
    if (error) {
      toast.error("Status-Update fehlgeschlagen");
      return;
    }
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
    if (selected?.id === id) setSelected({ ...selected, status });
  }

  async function openLebenslauf(row: Application) {
    if (!row.lebenslauf_path) {
      toast.error("Keine Datei vorhanden");
      return;
    }
    const { data, error } = await supabase.storage
      .from("applications")
      .createSignedUrl(row.lebenslauf_path, 60 * 10);
    if (error || !data?.signedUrl) {
      toast.error("Datei konnte nicht geladen werden");
      return;
    }
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  }

  async function deleteRow(row: Application) {
    if (!confirm(`Bewerbung von ${row.vorname} ${row.nachname} wirklich löschen?`)) return;
    if (row.lebenslauf_path) {
      await supabase.storage.from("applications").remove([row.lebenslauf_path]);
    }
    const { error } = await (supabase as any).from("applications").delete().eq("id", row.id);
    if (error) {
      toast.error("Löschen fehlgeschlagen");
      return;
    }
    toast.success("Bewerbung gelöscht");
    setSelected(null);
    setRows((prev) => prev.filter((r) => r.id !== row.id));
  }

  return (
    <>
      <PageHeader
        title="Bewerbungen"
        subtitle="Alle eingegangenen Bewerbungen von der Karriere-Seite."
      />

      <Panel>
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="relative max-w-sm flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Name, E-Mail, Telefon…"
              className="h-9 pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-9 w-[180px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Status</SelectItem>
              {STATUS_OPTIONS.map((s) => (
                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="divide-y divide-border/60">
          <div className="grid grid-cols-[160px_1fr_1fr_140px_140px_120px_100px] gap-4 pb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            <span>Eingegangen</span>
            <span>Name</span>
            <span>E-Mail</span>
            <span>Telefon</span>
            <span>Anstellung</span>
            <span>Status</span>
            <span>Lebenslauf</span>
          </div>

          {loading ? (
            <div className="py-10 text-center text-sm text-muted-foreground">Lade Bewerbungen…</div>
          ) : filtered.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              Keine Bewerbungen gefunden.
            </div>
          ) : (
            filtered.map((r) => (
              <div
                key={r.id}
                className="grid grid-cols-[160px_1fr_1fr_140px_140px_120px_100px] items-center gap-4 py-3 text-sm cursor-pointer hover:bg-accent/40 rounded-md px-2 -mx-2 transition-colors"
                onClick={() => setSelected(r)}
              >
                <span className="font-mono text-xs text-muted-foreground">
                  {formatDateTime(r.created_at)}
                </span>
                <span className="truncate font-medium">
                  {r.vorname} {r.nachname}
                </span>
                <span className="truncate text-muted-foreground">{r.email}</span>
                <span className="truncate font-mono text-xs">{r.handynummer}</span>
                <span className="truncate capitalize text-muted-foreground">{r.anstellung}</span>
                <Badge variant={statusVariant(r.status)} className="w-fit capitalize">
                  {r.status}
                </Badge>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    openLebenslauf(r);
                  }}
                  disabled={!r.lebenslauf_path}
                  className="h-7"
                >
                  <FileText className="mr-1 h-3.5 w-3.5" /> Öffnen
                </Button>
              </div>
            ))
          )}
        </div>
      </Panel>

      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle>
                  {selected.vorname} {selected.nachname}
                </SheetTitle>
                <SheetDescription>
                  Eingegangen am {formatDateTime(selected.created_at)}
                </SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-4 text-sm">
                <Field label="E-Mail" value={selected.email} />
                <Field label="Handynummer" value={selected.handynummer} />
                <Field label="Geburtsdatum" value={formatDate(selected.geburtsdatum)} />
                <Field label="Staatsangehörigkeit" value={selected.staatsangehoerigkeit} />
                <Field label="Anstellung" value={selected.anstellung} />

                <div>
                  <div className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Status
                  </div>
                  <Select
                    value={selected.status}
                    onValueChange={(v) => updateStatus(selected.id, v)}
                  >
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((s) => (
                        <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="pt-2 flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    onClick={() => openLebenslauf(selected)}
                    disabled={!selected.lebenslauf_path}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Lebenslauf öffnen
                  </Button>
                  <Button variant="destructive" onClick={() => deleteRow(selected)}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Löschen
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="mt-0.5">{value}</div>
    </div>
  );
}
