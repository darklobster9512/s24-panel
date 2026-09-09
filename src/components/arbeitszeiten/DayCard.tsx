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

export function DayCard({
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
        "flex h-full flex-col rounded-2xl border bg-card p-4 transition-colors",
        entry.active ? "border-primary/40" : "border-border/60 bg-surface/40",
        errors.length > 0 && "border-destructive/60",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{label}</p>
          {dateLabel && <p className="text-xs text-muted-foreground">{dateLabel}</p>}
        </div>
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

      {entry.active ? (
        <div className="mt-3 flex flex-1 flex-col gap-2">
          {entry.segments.map((seg, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <Input
                type="time"
                className="h-9 flex-1 px-2 text-center font-mono text-xs"
                value={seg.start}
                disabled={disabled}
                onChange={(e) => setSegment(i, { start: e.target.value })}
              />
              <span className="text-muted-foreground">–</span>
              <Input
                type="time"
                className="h-9 flex-1 px-2 text-center font-mono text-xs"
                value={seg.end}
                disabled={disabled}
                onChange={(e) => setSegment(i, { end: e.target.value })}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
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

          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 justify-start gap-1.5 px-2 text-xs text-muted-foreground hover:text-foreground"
            disabled={disabled}
            onClick={() => onChange({ ...entry, segments: [...entry.segments, emptySegment()] })}
          >
            <Plus className="h-3.5 w-3.5" /> Block
          </Button>

          {errors.length > 0 && (
            <p className="flex items-start gap-1.5 text-xs text-destructive">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>{errors[0]}</span>
            </p>
          )}

          <div className="mt-auto pt-2 text-right text-xs font-medium text-muted-foreground">
            {fmtHoursShort(minutes)}
          </div>
        </div>
      ) : (
        <div className="mt-3 flex flex-1 items-end text-xs text-muted-foreground">frei</div>
      )}
    </div>
  );
}

export default DayCard;
