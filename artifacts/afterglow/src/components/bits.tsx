import type { ReactNode } from "react";
import { RotateCw } from "lucide-react";
import { Skeleton } from "@workspace/afterglow-design-system/components/ui/skeleton";
import { Button } from "@workspace/afterglow-design-system/components/afterglow/button";
import { GlassCard } from "@workspace/afterglow-design-system/components/afterglow/glass-card";
import { Avatar } from "@workspace/afterglow-design-system/components/afterglow/avatar-stack";
import { toneFor } from "@workspace/afterglow-design-system/components/afterglow/tone";
import { cn } from "@workspace/afterglow-design-system/lib/utils";
import { useGetWorkspace, type Person } from "@workspace/api-client-react";
import { STATUS_META, dueInfo, workspaceToday } from "@/lib/afterglow";

/** A person's initials on their stable neon tone (source AvatarStack avatar). */
export function Face({ p, size = "md" }: { p: Pick<Person, "id" | "name">; size?: "sm" | "md" }) {
  return <Avatar name={p.name} tone={toneFor(p.id)} size={size} className="shrink-0" />;
}

export function StatusPill({ status }: { status: string }) {
  const m = STATUS_META[status] ?? STATUS_META.suggested;
  return <span data-testid={`status-${status}`} className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold", m.cls)}>{m.label}</span>;
}

export function DuePill({ date, done }: { date: string; done?: boolean }) {
  const { data: ws } = useGetWorkspace();
  const d = dueInfo(date, ws ? workspaceToday(ws) : new Date());
  if (!d) return null;
  const late = d.days < 0 && !done;
  const today = d.days === 0 && !done;
  const label = d.days === 0 ? "Due today" : d.days < 0 ? `${-d.days}d overdue` : `In ${d.days}d`;
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold", late ? "border-danger text-danger" : today ? "border-transparent bg-sun text-on-bright" : "border-line text-ink-muted")}>
      {label}
    </span>
  );
}

export function LoadingBlock({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-4" data-testid="state-loading" aria-busy="true" aria-label="Loading">
      <Skeleton className="h-12 w-72 rounded-full" />
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-24 w-full rounded-lg" />
      ))}
    </div>
  );
}

export function ErrorBlock({ onRetry, message }: { onRetry: () => void; message?: string }) {
  return (
    <GlassCard data-testid="state-error" className="max-w-lg" role="alert">
      <h3>Couldn't load this</h3>
      <p>{message ?? "We couldn't reach your workspace. Nothing was changed."}</p>
      <Button className="mt-5" onClick={onRetry} data-testid="button-retry" icon={<RotateCw className="h-4 w-4" />}>Try again</Button>
    </GlassCard>
  );
}

export function Empty({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <GlassCard compact data-testid="state-empty" className="border-dashed px-6 py-10 text-center">
      <h3>{title}</h3>
      {children && <div className="mt-1 text-sm text-ink-muted">{children}</div>}
    </GlassCard>
  );
}

export function Panel({ className, children, ...rest }: { className?: string; children: ReactNode; [k: string]: unknown }) {
  return <GlassCard as="section" {...rest} className={cn("min-w-0", className)}>{children}</GlassCard>;
}

/** Small uppercase-free field label in source `label` type. */
export const fieldLabel = "type-label text-ink";

/** Static tone → fill classes (kept literal so Tailwind generates them). */
export const TONE_BG = { pop: "bg-pop", zap: "bg-zap", sun: "bg-sun", sky: "bg-sky", grape: "bg-grape" } as const;
