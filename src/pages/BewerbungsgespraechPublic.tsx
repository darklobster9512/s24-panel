import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarUI } from "@/components/ui/calendar";
import { toast } from "sonner";
import { Loader2, CalendarDays, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { de } from "date-fns/locale";
import { format } from "date-fns";

type Interview = {
  application_id: string;
  vorname: string;
  nachname: string;
  appointment_date: string | null;
  appointment_time: string | null;
  status: string | null;
};

type SlotConfig = {
  slot_start: string;
  slot_end: string;
  interval_minutes: number;
  weekdays: number[];
  company_name: string | null;
  accent_color: string | null;
  logo_text: string | null;
};

function generateTimeSlots(start: string, end: string, interval: number) {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  const startMin = sh * 60 + sm;
  const endMin = eh * 60 + em;
  const out: string[] = [];
  for (let m = startMin; m < endMin; m += interval) {
    out.push(`${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`);
  }
  return out;
}

function splitLogo(t: string) {
  const m = t.match(/^(.*?)(\d+)$/);
  return m ? { head: m[1], tail: m[2] } : { head: t, tail: "" };
}

export default function BewerbungsgespraechPublic() {
  const { token } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(true);
  const [interview, setInterview] = useState<Interview | null>(null);
  const [config, setConfig] = useState<SlotConfig | null>(null);
  const [bookedSlots, setBookedSlots] = useState<Array<{ appointment_date: string; appointment_time: string }>>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [rebook, setRebook] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!token) return;
      setLoading(true);
      const [{ data: iv, error: ivErr }, { data: cfg }, { data: booked }] = await Promise.all([
        (supabase as any).rpc("get_interview_by_token", { _token: token }),
        (supabase as any).rpc("get_interview_slot_config"),
        (supabase as any).rpc("list_booked_interview_slots"),
      ]);
      if (cancelled) return;
      if (ivErr || !iv || iv.length === 0) {
        setError("Dieser Buchungslink ist ungültig oder nicht mehr aktiv.");
      } else {
        setInterview(iv[0] as Interview);
      }
      if (cfg && cfg.length > 0) setConfig(cfg[0] as SlotConfig);
      setBookedSlots(booked ?? []);
      setLoading(false);
    }
    load();
  }, [token]);

  const accent = config?.accent_color || "#7bed9f";
  const logoText = config?.logo_text || config?.company_name || "Sekretariat24";
  const { head, tail } = splitLogo(logoText);
  const companyName = config?.company_name || "Sekretariat24";

  const timeSlots = useMemo(() => {
    if (!config) return [];
    return generateTimeSlots(config.slot_start.slice(0, 5), config.slot_end.slice(0, 5), config.interval_minutes);
  }, [config]);

  const bookedTimesForDate = useMemo(() => {
    if (!selectedDate) return new Set<string>();
    const ds = format(selectedDate, "yyyy-MM-dd");
    const set = new Set<string>();
    for (const s of bookedSlots) {
      if (s.appointment_date === ds) set.add(s.appointment_time.slice(0, 5));
    }
    return set;
  }, [selectedDate, bookedSlots]);

  const availableTimes = useMemo(() => {
    if (!selectedDate) return timeSlots;
    const now = new Date();
    const cutoff = new Date(now.getTime() + 60 * 60 * 1000); // min +1h
    return timeSlots.filter((t) => {
      const [h, m] = t.split(":").map(Number);
      const d = new Date(selectedDate);
      d.setHours(h, m, 0, 0);
      return d > cutoff;
    });
  }, [selectedDate, timeSlots]);

  const isDateDisabled = (d: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (d < today) return true;
    const weekdays = config?.weekdays ?? [1, 2, 3, 4, 5];
    // JS: 0=Sun; map to 1..7 (Mon..Sun)
    const w = d.getDay() === 0 ? 7 : d.getDay();
    return !weekdays.includes(w);
  };

  async function submitBooking() {
    if (!selectedDate || !selectedTime || !token) return;
    setSubmitting(true);
    const { error } = await (supabase as any).rpc("book_interview_slot", {
      _token: token,
      _date: format(selectedDate, "yyyy-MM-dd"),
      _time: selectedTime + ":00",
    });
    setSubmitting(false);
    if (error) {
      const msg =
        error.message?.includes("slot_taken") ? "Dieser Slot wurde gerade vergeben. Bitte wähle einen anderen."
        : error.message?.includes("invalid_token") ? "Buchungslink ungültig."
        : error.message?.includes("past_date") ? "Dieser Tag liegt in der Vergangenheit."
        : "Buchung fehlgeschlagen.";
      toast.error(msg);
      return;
    }
    // Refresh
    const { data: iv } = await (supabase as any).rpc("get_interview_by_token", { _token: token });
    if (iv && iv.length) setInterview(iv[0] as Interview);
    setRebook(false);
    toast.success("Termin bestätigt");
  }

  return (
    <div className="min-h-screen bg-[#f5f7f5] px-4 py-10">
      <div className="mx-auto w-full max-w-2xl">
        <div className="overflow-hidden rounded-2xl border border-[#eaeee9] bg-white shadow-[0_8px_32px_-8px_rgba(16,24,20,0.12)]">
          <div className="bg-[#130f40] px-8 py-8 text-center">
            <div className="text-2xl font-bold tracking-tight text-white">
              {head}
              <span style={{ color: accent }}>{tail}</span>
            </div>
          </div>
          <div className="h-[3px]" style={{ background: accent }} />

          <div className="p-8 md:p-10">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : error ? (
              <div className="flex flex-col items-center gap-3 py-10 text-center">
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-destructive/10">
                  <AlertCircle className="h-6 w-6 text-destructive" />
                </div>
                <div className="text-lg font-semibold">Ungültiger Link</div>
                <div className="text-sm text-muted-foreground">{error}</div>
              </div>
            ) : interview?.appointment_date && !rebook ? (
              <div className="space-y-6 text-center">
                <div
                  className="mx-auto grid h-14 w-14 place-items-center rounded-2xl"
                  style={{ background: `${accent}22` }}
                >
                  <CheckCircle2 className="h-7 w-7" style={{ color: "#2fa363" }} />
                </div>
                <div>
                  <div className="text-xl font-semibold">Termin bestätigt</div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    {interview.vorname}, dein Bewerbungsgespräch ist gebucht.
                  </div>
                </div>
                <div
                  className="mx-auto max-w-sm rounded-xl border-l-4 bg-[#f5f7f5] px-4 py-3 text-left"
                  style={{ borderLeftColor: accent }}
                >
                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">
                      {format(new Date(interview.appointment_date), "dd. MMMM yyyy", { locale: de })}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{interview.appointment_time?.slice(0, 5)} Uhr</span>
                  </div>
                </div>
                <Button variant="outline" onClick={() => { setRebook(true); setSelectedDate(undefined); setSelectedTime(null); }}>
                  Termin ändern
                </Button>
              </div>
            ) : (
              <>
                <h1 className="text-xl font-semibold tracking-tight">
                  Hallo {interview?.vorname}, buche dein Bewerbungsgespräch
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Wähle einen für dich passenden Termin. Wir freuen uns auf das Kennenlernen.
                </p>

                <div className="mt-6 grid gap-6 md:grid-cols-2">
                  <div>
                    <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Datum
                    </div>
                    <CalendarUI
                      mode="single"
                      selected={selectedDate}
                      onSelect={(d) => { setSelectedDate(d); setSelectedTime(null); }}
                      disabled={isDateDisabled}
                      locale={de}
                      weekStartsOn={1}
                      className="rounded-lg border border-border p-3"
                    />
                  </div>
                  <div>
                    <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Uhrzeit
                    </div>
                    {!selectedDate ? (
                      <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                        Wähle zuerst ein Datum.
                      </div>
                    ) : availableTimes.length === 0 ? (
                      <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                        Keine freien Zeiten an diesem Tag.
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 gap-2">
                        {availableTimes.map((t) => {
                          const taken = bookedTimesForDate.has(t);
                          const active = selectedTime === t;
                          return (
                            <button
                              key={t}
                              type="button"
                              disabled={taken}
                              onClick={() => setSelectedTime(t)}
                              className={`h-10 rounded-md border text-sm font-medium transition ${
                                taken
                                  ? "cursor-not-allowed border-border bg-muted text-muted-foreground line-through"
                                  : active
                                    ? "border-transparent text-[#0f1a2e]"
                                    : "border-border bg-white hover:border-foreground/30"
                              }`}
                              style={active ? { background: accent } : undefined}
                            >
                              {t}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-8 flex justify-end gap-2">
                  {rebook && (
                    <Button variant="ghost" onClick={() => setRebook(false)}>
                      Abbrechen
                    </Button>
                  )}
                  <Button
                    onClick={submitBooking}
                    disabled={!selectedDate || !selectedTime || submitting}
                    style={{ background: accent, color: "#0f1a2e" }}
                    className="hover:opacity-90"
                  >
                    {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Termin bestätigen
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="mt-6 text-center text-xs text-muted-foreground">
          Powered by {companyName}
        </div>
      </div>
    </div>
  );
}
