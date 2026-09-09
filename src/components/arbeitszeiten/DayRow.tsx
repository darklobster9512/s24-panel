import { AlertCircle, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import {
  DayEntry,
  dayMinutes,
  emptySegment,
  fmtHoursShort,
  validateDay,
} from "@/lib/work-schedule";

export function DayRow({
  label,
  dateLabel,
  entry,
  onChange,
  disabled,
}: {
  label: string;
  dateLabel?: string;
  entry: DayEntry;
  onChange: (next: DayEntry) => void;
  disabled?: boolean;
}) {
  const errors = validateDay(entry);
  const minutes = dayMinutes(entry);

  const setSegment = (index: number, patch: Partial<{ start: string; end: string }>) => {
    const segments = entry.segments.map((s, i) => (i === index ? { ...s, ...patch } : s));
    onChange({ ...entry, segments });
  };

  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-3 px-4 py-3 transition-colors md:grid-cols-[9rem_3rem_1fr_5rem] md:items-start md:gap-4",
        entry.active ? "bg-transparent" : "bg-surface/40",
      )}
    >
      {/* Tag */}
      <div className="flex items-center justify-between gap-2 md:block">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{label}</p>
          {dateLabel && <p className="text-xs text-muted-foreground">{dateLabel}</p>}
        </div>
        <div className="md:hidden">
          <Switch
            checked={entry.active}
            disabled={disabled}
            aria-label={`${label} Arbeitstag`}
            onCheckedChange={(v) =>
              onChange({
                active: v,
                segments: entry.segments.length ? entry.segments : [emptySegment()],
              })
            }
          />
        </div>
      </div>

      {/* Schalter (Desktop) */}
      <div className="hidden md:flex md:h-9 md:items-center">
        <Switch
          checked={entry.active}
          disabled={disabled}
          aria-label={`${label} Arbeitstag`}
          onCheckedChange={(v) =>
            onChange({
              active: v,
              segments: entry.segments.length ? entry.segments : [emptySegment()],
            })
          }
        />
      </div>

      {/* Zeitblöcke */}
      <div className="min-w-0">
        {entry.active ? (
          <div className="flex flex-col gap-2">
            {entry.segments.map((seg, i) => (
              <div key={i} className="flex flex-wrap items-center gap-2">
                <Input
                  type="time"
                  className="h-9 w-[7.5rem] shrink-0 text-center font-mono text-sm"
                  value={seg.start}
                  disabled={disabled}
                  onChange={(e) => setSegment(i, { start: e.target.value })}
                />
                <span className="text-muted-foreground">–</span>
                <Input
                  type="time"
                  className="h-9 w-[7.5rem] shrink-0 text-center font-mono text-sm"
                  value={seg.end}
                  disabled={disabled}
                  onChange={(e) => setSegment(i, { end: e.target.value })}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive"
                  aria-label="Zeitblock entfernen"
                  disabled={disabled || entry.segments.length <= 1}
                  onClick={() =>
                    onChange({ ...entry, segments: entry.segments.filter((_, x) => x !== i) })
                  }
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}

            {errors.length > 0 && (
              <p className="flex items-start gap-1.5 text-xs text-destructive">
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>{errors[0]}</span>
              </p>
            )}

            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 w-fit justify-start gap-1.5 px-2 text-xs text-muted-foreground hover:text-foreground"
              disabled={disabled}
              onClick={() => onChange({ ...entry, segments: [...entry.segments, emptySegment()] })}
            >
              <Plus className="h-3.5 w-3.5" /> Block
            </Button>
          </div>
        ) : (
          <div className="flex h-9 items-center text-sm text-muted-foreground">frei</div>
        )}
      </div>

      {/* Summe */}
      <div className="flex h-9 items-center justify-end text-sm font-medium text-muted-foreground">
        {entry.active ? fmtHoursShort(minutes) : "–"}
      </div>
    </div>
  );
}

export default DayRow;
