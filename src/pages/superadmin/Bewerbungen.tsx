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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Search, FileText, Download, Trash2, ExternalLink } from "lucide-react";
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
  ranking: string | null;
  created_at: string;
};

const STATUS_OPTIONS = [
  { value: "neu", label: "Neu" },
  { value: "gesichtet", label: "Gesichtet" },
  { value: "angenommen", label: "Angenommen" },
  { value: "abgelehnt", label: "Abgelehnt" },
];

const RANKING_OPTIONS = [
  { value: "sehr_gut", label: "Sehr gut" },
  { value: "gut", label: "Gut" },
  { value: "mittel", label: "Mittel" },
  { value: "schlecht", label: "Schlecht" },
];

const RANKING_CLASSES: Record<string, string> = {
  sehr_gut: "bg-primary/20 text-primary-foreground border-primary/40",
  gut: "bg-primary/10 text-foreground border-primary/30",
  mittel: "bg-muted text-foreground border-border",
  schlecht: "bg-destructive/15 text-destructive border-destructive/40",
};

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
  const [rankingFilter, setRankingFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Application | null>(null);
  const [preview, setPreview] = useState<{ url: string; name: string; mime: string | null } | null>(null);

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
      if (rankingFilter !== "all") {
        if (rankingFilter === "none") {
          if (r.ranking) return false;
        } else if (r.ranking !== rankingFilter) return false;
      }
      if (q) {
        const hay = [r.vorname, r.nachname, r.email, r.handynummer, r.staatsangehoerigkeit]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [rows, search, statusFilter, rankingFilter]);

  const PAGE_SIZE = 10;
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, rankingFilter]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const pageStart = (page - 1) * PAGE_SIZE;
  const paged = filtered.slice(pageStart, pageStart + PAGE_SIZE);


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

  async function updateRanking(id: string, rankingValue: string) {
    const ranking = rankingValue === "none" ? null : rankingValue;
    const { error } = await (supabase as any)
      .from("applications")
      .update({ ranking })
      .eq("id", id);
    if (error) {
      toast.error("Ranking-Update fehlgeschlagen");
      return;
    }
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ranking } : r)));
    if (selected?.id === id) setSelected({ ...selected, ranking });
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
    setPreview({
      url: data.signedUrl,
      name: row.lebenslauf_filename || `${row.vorname}_${row.nachname}_Lebenslauf`,
      mime: row.lebenslauf_mime,
    });
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
          <Select value={rankingFilter} onValueChange={setRankingFilter}>
            <SelectTrigger className="h-9 w-[180px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Rankings</SelectItem>
              <SelectItem value="none">Ohne Ranking</SelectItem>
              {RANKING_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="divide-y divide-border/60">
          <div className="grid grid-cols-[160px_1fr_1fr_140px_140px_110px_140px_120px_150px_100px] gap-4 pb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            <span>Eingegangen</span>
            <span>Name</span>
            <span>E-Mail</span>
            <span>Telefon</span>
            <span>Anstellung</span>
            <span>Geburtsdatum</span>
            <span>Staatsang.</span>
            <span>Status</span>
            <span>Ranking</span>
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
                className="grid grid-cols-[160px_1fr_1fr_140px_140px_110px_140px_120px_150px_100px] items-center gap-4 py-3 text-sm cursor-pointer hover:bg-accent/40 rounded-md px-2 -mx-2 transition-colors"
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
                <span className="truncate text-muted-foreground">{r.geburtsdatum ? formatDate(r.geburtsdatum) : "—"}</span>
                <span className="truncate text-muted-foreground">{r.staatsangehoerigkeit}</span>
                <Badge variant={statusVariant(r.status)} className="w-fit capitalize">
                  {r.status}
                </Badge>
                <div onClick={(e) => e.stopPropagation()}>
                  <Select
                    value={r.ranking ?? "none"}
                    onValueChange={(v) => updateRanking(r.id, v)}
                  >
                    <SelectTrigger
                      className={`h-7 text-xs ${r.ranking ? RANKING_CLASSES[r.ranking] ?? "" : ""}`}
                    >
                      <SelectValue placeholder="—" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">—</SelectItem>
                      {RANKING_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
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

                <div>
                  <div className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Ranking
                  </div>
                  <Select
                    value={selected.ranking ?? "none"}
                    onValueChange={(v) => updateRanking(selected.id, v)}
                  >
                    <SelectTrigger
                      className={`h-9 ${selected.ranking ? RANKING_CLASSES[selected.ranking] ?? "" : ""}`}
                    >
                      <SelectValue placeholder="—" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">—</SelectItem>
                      {RANKING_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
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

      <Dialog open={!!preview} onOpenChange={(o) => !o && setPreview(null)}>
        <DialogContent className="max-w-5xl w-[95vw] h-[85vh] flex flex-col p-0 gap-0">
          <DialogHeader className="px-6 py-4 border-b">
            <DialogTitle className="truncate">{preview?.name}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 min-h-0 bg-muted/30">
            {preview && (
              preview.mime && !preview.mime.includes("pdf") && !preview.mime.startsWith("image/") ? (
                <div className="flex h-full flex-col items-center justify-center gap-4 p-6 text-center text-sm text-muted-foreground">
                  <FileText className="h-10 w-10" />
                  <div>Vorschau für diesen Dateityp nicht möglich.</div>
                  <Button asChild variant="outline">
                    <a href={preview.url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      In neuem Tab öffnen
                    </a>
                  </Button>
                </div>
              ) : preview.mime?.startsWith("image/") ? (
                <div className="flex h-full items-center justify-center overflow-auto p-4">
                  <img src={preview.url} alt={preview.name} className="max-h-full max-w-full object-contain" />
                </div>
              ) : (
                <iframe src={preview.url} title={preview.name} className="h-full w-full border-0" />
              )
            )}
          </div>
          <DialogFooter className="px-6 py-3 border-t">
            {preview && (
              <Button asChild variant="outline">
                <a href={preview.url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  In neuem Tab öffnen
                </a>
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
