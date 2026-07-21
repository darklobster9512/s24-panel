import { useEffect, useMemo, useState } from "react";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Legend,
} from "recharts";
import { PageHeader, Panel, StatCard } from "@/components/mitarbeiter/MitarbeiterLayout";
import { Button } from "@/components/ui/button";
import { PhoneCall, Clock, StickyNote } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const TIMEFRAMES = ["Woche", "Monat", "Quartal"] as const;
type TF = (typeof TIMEFRAMES)[number];

const KAT_COLORS: Record<string, string> = {
  Rückruf: "hsl(var(--primary))",
  Termin: "#60a5fa",
  Info: "#fbbf24",
  Weiterleitung: "#a78bfa",
  Beschwerde: "#f87171",
  Sonstiges: "#94a3b8",
};

function tfConfig(tf: TF) {
  if (tf === "Woche") return { days: 7, bucket: "day" as const };
  if (tf === "Monat") return { days: 30, bucket: "day" as const };
  return { days: 90, bucket: "week" as const };
}

function fmtDauer(sec: number) {
  if (!sec || sec < 0) return "–";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function dayKey(d: Date) {
  return d.toISOString().slice(0, 10);
}
function weekKey(d: Date) {
  const tmp = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = tmp.getUTCDay() || 7;
  tmp.setUTCDate(tmp.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
  const w = Math.ceil((((tmp.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${tmp.getUTCFullYear()}-W${w.toString().padStart(2, "0")}`;
}
function labelForDay(d: Date) {
  return d.toLocaleDateString("de-DE", { weekday: "short", day: "2-digit", month: "2-digit" });
}

export default function Statistik() {
  const [tf, setTf] = useState<TF>("Woche");
  const [loading, setLoading] = useState(true);
  const [employeeId, setEmployeeId] = useState<string | null>(null);

  const [calls, setCalls] = useState<any[]>([]);
  const [prevCalls, setPrevCalls] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [prevNotes, setPrevNotes] = useState<any[]>([]);
  const [clientMap, setClientMap] = useState<Record<string, string>>({});

  useEffect(() => {
    (async () => {
      const { data: userRes } = await supabase.auth.getUser();
      const uid = userRes.user?.id;
      if (!uid) return;
      const { data: emp } = await supabase
        .from("employees")
        .select("id")
        .eq("user_id", uid)
        .maybeSingle();
      if (emp?.id) setEmployeeId(emp.id);
    })();
  }, []);

  useEffect(() => {
    if (!employeeId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { days } = tfConfig(tf);
      const now = new Date();
      const from = new Date(now.getTime() - days * 86400000);
      const prevFrom = new Date(now.getTime() - 2 * days * 86400000);

      const [callsRes, notesRes, clientsRes] = await Promise.all([
        supabase
          .from("sipgate_calls")
          .select("id,started_at,answered_at,ended_at,status,client_id")
          .eq("handled_by_employee_id", employeeId)
          .gte("started_at", prevFrom.toISOString())
          .order("started_at", { ascending: true }),
        supabase
          .from("call_notes")
          .select("id,created_at,kategorie,client_id,dauer_sekunden")
          .eq("employee_id", employeeId)
          .gte("created_at", prevFrom.toISOString())
          .order("created_at", { ascending: true }),
        supabase.from("clients").select("id,unternehmensname"),
      ]);
      if (cancelled) return;

      const cutoff = from.getTime();
      const allCalls = callsRes.data ?? [];
      const allNotes = notesRes.data ?? [];
      setCalls(allCalls.filter((c) => new Date(c.started_at).getTime() >= cutoff));
      setPrevCalls(allCalls.filter((c) => new Date(c.started_at).getTime() < cutoff));
      setNotes(allNotes.filter((n) => new Date(n.created_at).getTime() >= cutoff));
      setPrevNotes(allNotes.filter((n) => new Date(n.created_at).getTime() < cutoff));

      const cm: Record<string, string> = {};
      (clientsRes.data ?? []).forEach((c: any) => {
        cm[c.id] = c.unternehmensname ?? "—";
      });
      setClientMap(cm);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [employeeId, tf]);

  const kpis = useMemo(() => {
    const totalCalls = calls.length;
    const prevTotal = prevCalls.length;
    const callDelta =
      prevTotal > 0 ? `${Math.round(((totalCalls - prevTotal) / prevTotal) * 100)}%` : undefined;

    const durs = calls
      .filter((c) => c.answered_at && c.ended_at)
      .map((c) => (new Date(c.ended_at).getTime() - new Date(c.answered_at).getTime()) / 1000);
    const avg = durs.length ? durs.reduce((a, b) => a + b, 0) / durs.length : 0;
    const prevDurs = prevCalls
      .filter((c) => c.answered_at && c.ended_at)
      .map((c) => (new Date(c.ended_at).getTime() - new Date(c.answered_at).getTime()) / 1000);
    const prevAvg = prevDurs.length ? prevDurs.reduce((a, b) => a + b, 0) / prevDurs.length : 0;
    const avgDeltaSec = prevAvg ? Math.round(avg - prevAvg) : undefined;

    const notesCount = notes.length;
    const prevNotesCount = prevNotes.length;
    const notesDelta =
      prevNotesCount > 0
        ? `${Math.round(((notesCount - prevNotesCount) / prevNotesCount) * 100)}%`
        : undefined;

    return {
      totalCalls,
      callDelta: callDelta ? (callDelta.startsWith("-") ? callDelta : `+${callDelta}`) : undefined,
      avg,
      avgDelta:
        avgDeltaSec !== undefined
          ? `${avgDeltaSec > 0 ? "+" : ""}${avgDeltaSec}s`
          : undefined,
      notesCount,
      notesDelta: notesDelta
        ? notesDelta.startsWith("-")
          ? notesDelta
          : `+${notesDelta}`
        : undefined,
    };
  }, [calls, prevCalls, notes, prevNotes]);

  const daily = useMemo(() => {
    const { days, bucket } = tfConfig(tf);
    const buckets: { key: string; label: string; calls: number; avg: number; _sum: number; _n: number }[] = [];
    const now = new Date();
    if (bucket === "day") {
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 86400000);
        buckets.push({ key: dayKey(d), label: labelForDay(d), calls: 0, avg: 0, _sum: 0, _n: 0 });
      }
      for (const c of calls) {
        const key = dayKey(new Date(c.started_at));
        const b = buckets.find((x) => x.key === key);
        if (!b) continue;
        b.calls++;
        if (c.answered_at && c.ended_at) {
          const dur = (new Date(c.ended_at).getTime() - new Date(c.answered_at).getTime()) / 1000;
          b._sum += dur;
          b._n++;
        }
      }
    } else {
      const weeks = Math.ceil(days / 7);
      for (let i = weeks - 1; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 7 * 86400000);
        buckets.push({ key: weekKey(d), label: `KW ${weekKey(d).slice(-2)}`, calls: 0, avg: 0, _sum: 0, _n: 0 });
      }
      for (const c of calls) {
        const key = weekKey(new Date(c.started_at));
        const b = buckets.find((x) => x.key === key);
        if (!b) continue;
        b.calls++;
        if (c.answered_at && c.ended_at) {
          const dur = (new Date(c.ended_at).getTime() - new Date(c.answered_at).getTime()) / 1000;
          b._sum += dur;
          b._n++;
        }
      }
    }
    buckets.forEach((b) => (b.avg = b._n ? Math.round(b._sum / b._n) : 0));
    return buckets;
  }, [calls, tf]);

  const kategorien = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const n of notes) {
      const key = n.kategorie ?? "Sonstiges";
      counts[key] = (counts[key] ?? 0) + 1;
    }
    return Object.entries(counts).map(([name, value]) => ({
      name,
      value,
      color: KAT_COLORS[name] ?? "#94a3b8",
    }));
  }, [notes]);

  const proKunde = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const n of notes) {
      if (!n.client_id) continue;
      counts[n.client_id] = (counts[n.client_id] ?? 0) + 1;
    }
    return Object.entries(counts)
      .map(([id, calls]) => ({ name: clientMap[id] ?? "—", calls }))
      .sort((a, b) => b.calls - a.calls)
      .slice(0, 6);
  }, [notes, clientMap]);

  const empty = !loading && calls.length === 0 && notes.length === 0;

  return (
    <>
      <PageHeader
        title="Meine Statistik"
        subtitle="Deine Performance-Kennzahlen."
        actions={
          <div className="inline-flex rounded-full border border-border/60 bg-card p-1">
            {TIMEFRAMES.map((t) => (
              <Button
                key={t}
                size="sm"
                variant={t === tf ? "default" : "ghost"}
                className="h-7 rounded-full px-3 text-xs"
                onClick={() => setTf(t)}
              >
                {t}
              </Button>
            ))}
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          label="Anrufe"
          value={loading ? "…" : String(kpis.totalCalls)}
          delta={kpis.callDelta}
          icon={<PhoneCall className="h-4 w-4" />}
        />
        <StatCard
          label="Ø Dauer"
          value={loading ? "…" : fmtDauer(kpis.avg)}
          delta={kpis.avgDelta}
          icon={<Clock className="h-4 w-4" />}
        />
        <StatCard
          label="Notizen"
          value={loading ? "…" : String(kpis.notesCount)}
          delta={kpis.notesDelta}
          icon={<StickyNote className="h-4 w-4" />}
        />
      </div>

      {empty && (
        <div className="mt-6 rounded-2xl border border-dashed border-border/60 bg-card/40 p-8 text-center text-sm text-muted-foreground">
          Noch keine Daten in diesem Zeitraum.
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Panel title={tf === "Quartal" ? "Anrufe pro Woche" : "Anrufe pro Tag"}>
          <div className="h-64">
            {daily.length === 0 || daily.every((d) => d.calls === 0) ? (
              <EmptyChart />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={daily}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
                  <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                  />
                  <Bar dataKey="calls" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Panel>

        <Panel title="Ø Gesprächsdauer (Sek)">
          <div className="h-64">
            {daily.length === 0 || daily.every((d) => d.avg === 0) ? (
              <EmptyChart />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={daily}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
                  <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip
                    contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                  />
                  <Line type="monotone" dataKey="avg" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </Panel>

        <Panel title="Verteilung nach Kategorie">
          <div className="h-64">
            {kategorien.length === 0 ? (
              <EmptyChart />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={kategorien} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={2}>
                    {kategorien.map((c) => <Cell key={c.name} fill={c.color} />)}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </Panel>

        <Panel title="Anrufe pro Kunde">
          <div className="h-64">
            {proKunde.length === 0 ? (
              <EmptyChart />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={proKunde} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
                  <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} width={140} />
                  <Tooltip
                    contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                  />
                  <Bar dataKey="calls" fill="hsl(var(--primary))" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Panel>
      </div>
    </>
  );
}

function EmptyChart() {
  return (
    <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
      Noch keine Daten in diesem Zeitraum.
    </div>
  );
}
