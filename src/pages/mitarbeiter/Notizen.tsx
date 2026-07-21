import { useMemo, useState } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Search, Clock } from "lucide-react";
import { PageHeader, Panel, ClientLogo } from "@/components/mitarbeiter/MitarbeiterLayout";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAssignedClients } from "@/hooks/use-assigned-clients";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { fmtRelative } from "@/lib/mitarbeiter-mock";

const KATEGORIEN = ["Alle", "Rückruf", "Termin", "Info", "Beschwerde", "Weiterleitung"];

type Note = {
  id: string;
  client_id: string;
  anrufer_name: string | null;
  anrufer_nummer: string | null;
  anliegen: string;
  kategorie: string | null;
  prioritaet: string;
  rueckruf_gewuenscht: boolean;
  rueckruf_zeit: string | null;
  created_at: string;
};

export default function Notizen() {
  const { byId, clients, logoUrls } = useAssignedClients();
  const { user } = useAuth();
  const [q, setQ] = useState("");
  const [kat, setKat] = useState("Alle");
  const [clientFilter, setClientFilter] = useState("alle");

  const { data: notesData } = useSuspenseQuery({
    queryKey: ["mitarbeiter-notes", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("call_notes")
        .select("id, client_id, anrufer_name, anrufer_nummer, anliegen, kategorie, prioritaet, rueckruf_gewuenscht, rueckruf_zeit, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data as Note[] | null) ?? [];
    },
  });

  const notes = useMemo(() => {
    return notesData
      .filter((n) => kat === "Alle" || n.kategorie === kat)
      .filter((n) => clientFilter === "alle" || n.client_id === clientFilter)
      .filter((n) => {
        if (!q.trim()) return true;
        const needle = q.toLowerCase();
        const client = byId(n.client_id);
        return [n.anrufer_name ?? "", n.anrufer_nummer ?? "", n.anliegen, client?.name ?? ""]
          .join(" ")
          .toLowerCase()
          .includes(needle);
      });
  }, [notesData, q, kat, clientFilter, byId]);

  return (
    <>
      <PageHeader
        title="Notizen"
        subtitle="Alle deine Call-Notizen zu zugewiesenen Kunden."
      />

      <Panel>
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="relative min-w-[240px] max-w-sm flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Notizen durchsuchen…"
              className="h-9 pl-9"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>

          <Select value={kat} onValueChange={setKat}>
            <SelectTrigger className="h-9 w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {KATEGORIEN.map((k) => <SelectItem key={k} value={k}>{k}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={clientFilter} onValueChange={setClientFilter}>
            <SelectTrigger className="h-9 w-[200px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="alle">Alle Kunden</SelectItem>
              {clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="py-12 text-center text-sm text-muted-foreground">Lädt…</div>
        ) : notes.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            Keine Notizen gefunden.
          </div>
        ) : (
          <ul className="space-y-3">
            {notes.map((n) => {
              const client = byId(n.client_id);
              return (
                <li
                  key={n.id}
                  className="rounded-xl border border-border/60 bg-surface/40 p-4 transition hover:border-primary/40"
                >
                  <div className="flex items-start gap-3">
                    <ClientLogo logoUrl={client ? logoUrls[client.id] : undefined} name={client?.name ?? "?"} size="sm" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{client?.name ?? "Unbekannter Kunde"}</span>
                          {(n.anrufer_name || n.anrufer_nummer) && (
                            <span className="text-xs text-muted-foreground">
                              · {n.anrufer_name ?? "—"} {n.anrufer_nummer && <>· <span className="font-mono">{n.anrufer_nummer}</span></>}
                            </span>
                          )}
                        </div>
                        <span className="inline-flex items-center gap-1 font-mono text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" /> {fmtRelative(n.created_at)}
                        </span>
                      </div>
                      <p className="mt-2 whitespace-pre-wrap text-sm text-foreground/90">{n.anliegen}</p>
                      <div className="mt-3 flex flex-wrap items-center gap-1.5">
                        {n.kategorie && (
                          <Badge variant="secondary" className="text-[10px]">{n.kategorie}</Badge>
                        )}
                        {n.prioritaet && n.prioritaet !== "normal" && (
                          <Badge variant="outline" className="text-[10px] capitalize">
                            Prio: {n.prioritaet}
                          </Badge>
                        )}
                        {n.rueckruf_gewuenscht && (
                          <Badge variant="outline" className="text-[10px]">
                            Rückruf {n.rueckruf_zeit && `· ${n.rueckruf_zeit}`}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>
    </>
  );
}
