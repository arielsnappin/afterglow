import { useState } from "react";
import { Link } from "wouter";
import { Clock, ChevronRight, RotateCcw, AlertTriangle } from "lucide-react";
import { Button } from "@workspace/afterglow-design-system/components/afterglow/button";
import { GlassCard } from "@workspace/afterglow-design-system/components/afterglow/glass-card";
import { useGetWorkspace, useAdvanceDemo, useResetDemo } from "@workspace/api-client-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@workspace/afterglow-design-system/components/ui/alert-dialog";
import { useInvalidateAll } from "@/lib/afterglow";
import { cn } from "@workspace/afterglow-design-system/lib/utils";

const MAX_CHAPTER = 7;

export function errorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === "object") {
    const data = (err as { data?: unknown }).data;
    if (data && typeof data === "object" && typeof (data as { error?: unknown }).error === "string") {
      return (data as { error: string }).error;
    }
    const msg = (err as { message?: unknown }).message;
    if (typeof msg === "string" && msg) return msg;
  }
  return fallback;
}

function fmtUtc(iso: string) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", { timeZone: "UTC", weekday: "short", day: "numeric", month: "short", year: "numeric" }) + " UTC";
}

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/events", label: "Events" },
  { href: "/people", label: "People" },
  { href: "/follow-ups", label: "Follow-ups" },
];

export function DemoController({ className }: { className?: string }) {
  const ws = useGetWorkspace();
  const invalidate = useInvalidateAll();
  const advance = useAdvanceDemo();
  const reset = useResetDemo();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const journey = ws.data?.journey;

  if (!journey) return null;

  const busy = advance.isPending || reset.isPending;
  const atEnd = journey.chapter >= MAX_CHAPTER;

  const onAdvance = () => {
    if (busy || atEnd) return;
    reset.reset();
    advance.mutate({ data: { chapter: journey.chapter } }, { onSuccess: () => { void invalidate(); } });
  };
  const onReset = () => {
    advance.reset();
    reset.mutate({ data: { confirm: true } }, {
      onSuccess: () => { setConfirmOpen(false); void invalidate(); },
      onError: () => setConfirmOpen(false),
    });
  };
  const err = advance.error ?? reset.error;

  return (
    <GlassCard as="section" compact aria-labelledby="demo-controller-title" data-testid="demo-controller" className={className}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="type-label text-pop-ink">Demo journey · chapter {journey.chapter} of {MAX_CHAPTER}</div>
          <h2 id="demo-controller-title" className="type-title mt-1" data-testid="text-chapter-title">{journey.title}</h2>
        </div>
        <div className="flex items-center gap-1.5 rounded-full border border-line px-3 py-1 text-xs font-semibold" data-testid="text-simulated-date">
          <Clock className="h-3.5 w-3.5" aria-hidden /> Simulated today: {fmtUtc(journey.today)}
        </div>
      </div>
      <p className="mt-2 text-sm text-ink-muted max-w-2xl" data-testid="text-chapter-changes">{journey.changes}</p>
      <p className="mt-1 text-xs text-ink-muted">Repeat-attendance context uses a demo-defined {journey.windowDays}-day window, not a production recommendation policy. Time is simulated; no messages are sent.</p>

      <nav aria-label="Views affected by this chapter" className="mt-3 flex flex-wrap gap-2">
        {LINKS.map((l) => (
          <Link key={l.href} href={l.href} data-testid={`link-demo-${l.label.toLowerCase()}`}
            className="rounded-full border border-line px-3 py-1 text-xs hover:bg-glass focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            {l.label}
          </Link>
        ))}
      </nav>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Button size="sm" onClick={onAdvance} loading={advance.isPending} disabled={busy || atEnd} data-testid="button-advance-chapter" icon={<ChevronRight className="h-4 w-4" />}>
          {atEnd ? "Final chapter reached" : advance.isPending ? "Advancing" : `Go to chapter ${journey.chapter + 1}`}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setConfirmOpen(true)} disabled={busy} data-testid="button-reset-demo" icon={<RotateCcw className="h-4 w-4" />}>
          Reset demo
        </Button>
      </div>

      <div aria-live="polite" className="mt-3 min-h-0">
        {err && (
          <div role="alert" data-testid="text-demo-error" className="flex flex-wrap items-center gap-2 rounded-md border border-danger px-3 py-2 text-sm text-danger">
            <AlertTriangle className="h-4 w-4" aria-hidden />
            {errorMessage(err, "That didn't go through.")}
            {advance.error && <Button size="sm" variant="secondary" onClick={() => { void ws.refetch(); advance.reset(); }} data-testid="button-demo-refresh">Refresh state</Button>}
          </div>
        )}
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={(o) => { if (!reset.isPending) setConfirmOpen(o); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="type-title">Reset this demo?</AlertDialogTitle>
            <AlertDialogDescription>
              This clears this browser's demo changes, notes, and follow-up statuses, and restores the original pre-import workspace. It can't be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={reset.isPending} data-testid="button-reset-cancel">Keep my demo</AlertDialogCancel>
            <AlertDialogAction data-testid="button-reset-confirm" disabled={reset.isPending}
              onClick={(e) => { e.preventDefault(); onReset(); }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {reset.isPending ? "Resetting" : "Reset demo"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </GlassCard>
  );
}

export default DemoController;
