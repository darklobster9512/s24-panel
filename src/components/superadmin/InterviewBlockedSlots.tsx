import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { Ban, Loader2, X } from "lucide-react";
import { Panel } from "@/components/superadmin/SuperadminLayout";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarUI } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type BlockedSlot = {
  id: string;
  blocked_date: string;
  blocked_time: string;
  reason: string | null;
};

function generateTimeSlots(start: string, end: string, interval: number) {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  const startMin = sh * 60 + sm;
  const endMin = eh * 60 + em;
  const out: string[] = [];
  const step = interval > 0 ? interval : 30;
  for (let m = startMin; m < endMin; m += step) {
    out.push(`${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`);
  }
  return out;
}

export default function InterviewBlockedSlots({
  slotStart,
  slotEnd,
  intervalMinutes,
}: {
  slotStart: string;
  slotEnd: string;
  intervalMinutes: number;
}) {
  const qc = useQueryClient();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [reason, setReason] = useState("");

  const { data: blocked = [], isLoading } = useQuery({
    queryKey: ["interview_blocked_slots"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("interview_blocked_slots")
        .select("id, blocked_date, blocked_time, reason")
        .order("blocked_date", { ascending: true })
        .order("blocked_time", { ascending: true });
      if (error) throw error;
      const rows = (data ?? []) as BlockedSlot[];
      const today = format(new Date(), "yyyy-MM-dd");
      const past = rows.filter((s) => s.blocked_date < today);
      if (past.length > 0) {
        (supabase as any)
          .from("interview_blocked_slots")
          .delete()
          .in("id", past.map((s) => s.id))
          .then(() => {});
      }
      return rows.filter((s) => s.blocked_date >= today);
    },
  });

  const { data: booked = [] } = useQuery({
    queryKey: ["interview_booked_slots_admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("interview_appointments")
        .select("appointment_date, appointment_time")
        .gte("appointment_date", format(new Date(), "yyyy-MM-dd"));
      if (error) throw error;
      return (data ?? []) as Array<{ appointment_date: string; appointment_time: string }>;
    },
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["interview_blocked_slots"] });
  };

  const blockMutation = useMutation({
    mutationFn: async (time: string) => {
      if (!selectedDate) return;
      const { data: userRes } = await supabase.auth.getUser();
      const { error } = await (supabase as any).from("interview_blocked_slots").insert({
        blocked_date: format(selectedDate, "yyyy-MM-dd"),
        blocked_time: `${time}:00`,
        reason: reason.trim() || null,
        created_by: userRes.user?.id ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      toast.success("Zeit blockiert");
    },
    onError: (e: any) => toast.error(e?.message ?? "Blockieren fehlgeschlagen"),
  });

  const unblockMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("interview_blocked_slots").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      toast.success("Zeit freigegeben");
    },
    onError: (e: any) => toast.error(e?.message ?? "Freigeben fehlgeschlagen"),
  });

  const timeSlots = useMemo(
    () => generateTimeSlots(slotStart.slice(0, 5), slotEnd.slice(0, 5), intervalMinutes),
    [slotStart, slotEnd, intervalMinutes],
  );

  const blockedForDate = useMemo(() => {
    const map = new Map<string, string>();
    if (!selectedDate) return map;
    const ds = format(selectedDate, "yyyy-MM-dd");
    blocked
      .filter((s) => s.blocked_date === ds)
      .forEach((s) => map.set(s.blocked_time.slice(0, 5), s.id));
    return map;
  }, [selectedDate, blocked]);

  const bookedForDate = useMemo(() => {
    const set = new Set<string>();
    if (!selectedDate) return set;
    const ds = format(selectedDate, "yyyy-MM-dd");
    booked.filter((s) => s.appointment_date === ds).forEach((s) => set.add(s.appointment_time.slice(0, 5)));
    return set;
  }, [selectedDate, booked]);

  const grouped = useMemo(() => {
    const groups = new Map<string, BlockedSlot[]>();
    blocked.forEach((s) => {
      const arr = groups.get(s.blocked_date) ?? [];
      arr.push(s);
      groups.set(s.blocked_date, arr);
    });
    return Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [blocked]);

  return (
    <Panel title="Bewerbungsgespräch · Zeiten blockieren" className="lg:col-span-2">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-3">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Datum</div>
          <CalendarUI
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            disabled={(d) => {
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              return d < today;
            }}
            locale={de}
            weekStartsOn={1}
            className="pointer-events-auto rounded-lg border border-border p-3"
          />
          <div className="space-y-1.5">
            <Label>Grund (optional)</Label>
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="z. B. Urlaub, Meeting"
            />
          </div>
        </div>

        <div className="space-y-3">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Zeiten {selectedDate ? `· ${format(selectedDate, "dd.MM.yyyy", { locale: de })}` : ""}
          </div>
          {!selectedDate ? (
            <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              Wähle zuerst ein Datum.
            </div>
          ) : (
            <div className="grid max-h-[340px] grid-cols-3 gap-1.5 overflow-y-auto pr-1">
              {timeSlots.map((t) => {
                const blockedId = blockedForDate.get(t);
                const isBooked = bookedForDate.has(t);
                return (
                  <button
                    key={t}
                    type="button"
                    disabled={isBooked || blockMutation.isPending || unblockMutation.isPending}
                    onClick={() => (blockedId ? unblockMutation.mutate(blockedId) : blockMutation.mutate(t))}
                    className={`h-9 rounded-md border text-sm font-medium transition ${
                      isBooked
                        ? "cursor-not-allowed border-border bg-muted text-muted-foreground line-through"
                        : blockedId
                          ? "border-destructive/40 bg-destructive/10 text-destructive"
                          : "border-border bg-background hover:border-foreground/30"
                    }`}
                    title={isBooked ? "Bereits gebucht" : blockedId ? "Klicken zum Freigeben" : "Klicken zum Blockieren"}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            Klick blockiert eine Zeit, erneuter Klick gibt sie frei. Bereits gebuchte Zeiten sind durchgestrichen.
          </p>
        </div>
      </div>

      <div className="mt-6 border-t border-border/60 pt-4">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
          <Ban className="h-4 w-4 text-destructive" />
          Blockierte Zeiten
        </div>
        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Lädt…
          </div>
        ) : grouped.length === 0 ? (
          <div className="text-sm text-muted-foreground">Keine blockierten Zeiten.</div>
        ) : (
          <div className="space-y-3">
            {grouped.map(([date, slots]) => (
              <div key={date} className="rounded-lg border border-border/60 p-3">
                <div className="mb-2 text-sm font-medium">
                  {format(new Date(`${date}T00:00:00`), "EEEE, dd. MMMM yyyy", { locale: de })}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {slots.map((s) => (
                    <span
                      key={s.id}
                      className="inline-flex items-center gap-1.5 rounded-md border border-destructive/30 bg-destructive/10 px-2 py-1 text-xs font-medium text-destructive"
                    >
                      {s.blocked_time.slice(0, 5)}
                      {s.reason ? <span className="opacity-70">· {s.reason}</span> : null}
                      <button
                        type="button"
                        onClick={() => unblockMutation.mutate(s.id)}
                        className="opacity-70 transition hover:opacity-100"
                        aria-label="Freigeben"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Panel>
  );
}
