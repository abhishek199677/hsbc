"use client";

/**
 * DatePicker — a self-contained calendar popover for scheduling dates.
 *
 * The native `<input type="date">` renders without a picker on Safari and most
 * mobile browsers, so the candidate had no way to choose a date. This renders
 * the value as a normal text input and opens a real month grid on click.
 *
 * It mirrors the rules enforced by POST /api/interview: dates in the past and
 * weekends are not selectable.
 */

import { useEffect, useId, useRef, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** Local-timezone YYYY-MM-DD (new Date().toISOString() would shift by a day). */
export function toISODate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function fromISODate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return Number.isNaN(date.getTime()) ? null : date;
}

interface DatePickerProps {
  /** Selected date as YYYY-MM-DD, or "" when nothing is picked. */
  value: string;
  onChange: (value: string) => void;
  /** Earliest selectable date (YYYY-MM-DD). Defaults to today. */
  minDate?: string;
  /** Saturdays and Sundays can't be scheduled — disabled by default. */
  disableWeekends?: boolean;
  className?: string;
  id?: string;
}

export default function DatePicker({
  value,
  onChange,
  minDate,
  disableWeekends = true,
  className = "",
  id,
}: DatePickerProps) {
  const todayISO = toISODate(new Date());
  const minISO = minDate || todayISO;

  const [open, setOpen] = useState(false);
  const [view, setView] = useState<Date>(() => fromISODate(value) || fromISODate(minISO) || new Date());
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dialogId = useId();

  // Close when clicking outside or pressing Escape
  useEffect(() => {
    if (!open) return;
    const handlePointer = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        inputRef.current?.focus();
      }
    };
    document.addEventListener("mousedown", handlePointer);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handlePointer);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  // The visible month only matters while the popover is open, so it is synced
  // in openPicker() rather than from an effect.
  const openPicker = () => {
    const selected = fromISODate(value);
    if (selected) setView(selected);
    setOpen((current) => !current);
  };

  const selectDate = (date: Date) => {
    onChange(toISODate(date));
    setOpen(false);
    inputRef.current?.focus();
  };

  const year = view.getFullYear();
  const month = view.getMonth();
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (Date | null)[] = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let day = 1; day <= daysInMonth; day++) cells.push(new Date(year, month, day));
  while (cells.length % 7 !== 0) cells.push(null);

  const isDisabled = (date: Date) => {
    const iso = toISODate(date);
    if (iso < minISO) return true;
    if (disableWeekends && (date.getDay() === 0 || date.getDay() === 6)) return true;
    return false;
  };

  const atMinimum = `${year}-${String(month + 1).padStart(2, "0")}` <= minISO.slice(0, 7);

  return (
    <div ref={rootRef} className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          id={id}
          type="text"
          readOnly
          role="combobox"
          aria-expanded={open}
          aria-controls={dialogId}
          aria-haspopup="dialog"
          placeholder="Select a date"
          value={value}
          onClick={openPicker}
          onKeyDown={(event) => {
            if (!open && (event.key === "Enter" || event.key === " ")) {
              event.preventDefault();
              openPicker();
            }
          }}
          className={`${className} w-full rounded-lg border border-border p-2.5 pr-10 text-sm text-foreground bg-background focus:ring-2 focus:ring-[#e050b0] cursor-pointer`}
        />
        <button
          type="button"
          aria-label="Open calendar"
          onClick={openPicker}
          className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted-foreground hover:text-secondary"
        >
          <CalendarDays className="h-4 w-4" />
        </button>
      </div>

      {open && (
        <div
          id={dialogId}
          role="dialog"
          aria-label="Choose an interview date"
          className="absolute left-0 top-full z-30 mt-1 w-72 border border-border bg-surface p-3 shadow-2xl"
        >
          <div className="mb-2 flex items-center justify-between">
            <button
              type="button"
              aria-label="Previous month"
              disabled={atMinimum}
              onClick={() => setView(new Date(year, month - 1, 1))}
              className="p-1 text-muted-foreground hover:text-secondary disabled:opacity-30 disabled:hover:text-muted-foreground"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm font-mono font-bold text-foreground">
              {MONTHS[month]} {year}
            </span>
            <button
              type="button"
              aria-label="Next month"
              onClick={() => setView(new Date(year, month + 1, 1))}
              className="p-1 text-muted-foreground hover:text-secondary"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1">
            {WEEKDAYS.map((day) => (
              <span
                key={day}
                className="py-1 text-center text-[10px] font-mono font-bold uppercase text-muted-foreground"
              >
                {day.slice(0, 1)}
              </span>
            ))}
            {cells.map((date, index) => {
              if (!date) return <span key={`gap-${index}`} />;
              const iso = toISODate(date);
              const disabled = isDisabled(date);
              const selected = iso === value;
              const isToday = iso === todayISO;
              return (
                <button
                  key={iso}
                  type="button"
                  disabled={disabled}
                  onClick={() => selectDate(date)}
                  aria-pressed={selected}
                  aria-label={date.toDateString()}
                  className={[
                    "flex h-8 items-center justify-center text-xs font-mono",
                    disabled
                      ? "cursor-not-allowed text-muted-foreground/30 line-through"
                      : "text-foreground hover:bg-surface-hover",
                    selected
                      ? "bg-secondary font-bold text-primary-foreground"
                      : isToday
                        ? "border border-secondary"
                        : "",
                  ].join(" ")}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>

          <div className="mt-2 flex items-center justify-between border-t border-border pt-2">
            <button
              type="button"
              onClick={() => {
                onChange("");
                setOpen(false);
              }}
              className="text-xs font-mono text-muted-foreground hover:text-secondary"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => selectDate(new Date())}
              disabled={isDisabled(new Date())}
              className="text-xs font-mono text-secondary hover:underline disabled:opacity-30 disabled:no-underline"
            >
              Today
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
