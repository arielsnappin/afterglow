import { useState } from "react";
import { Send } from "lucide-react";
import { useGetWorkspace, useUpdatePerson, type PersonUpdateStatus } from "@workspace/api-client-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@workspace/afterglow-design-system/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@workspace/afterglow-design-system/components/ui/tabs";
import { Button } from "@workspace/afterglow-design-system/components/afterglow/button";
import { GlassCard } from "@workspace/afterglow-design-system/components/afterglow/glass-card";
import { useToast } from "@workspace/afterglow-design-system/hooks/use-toast";
import { PageHeader, useOpenPerson } from "@/components/shell";
import { Face, DuePill, StatusPill, LoadingBlock, ErrorBlock, Empty } from "@/components/bits";
import { groupFollowUps, STATUS_META, useInvalidateAll, workspaceToday, type FollowUpView } from "@/lib/afterglow";

const VIEWS: [FollowUpView, string][] = [["reach", "To reach out"], ["waiting", "Waiting for reply"], ["all", "All"]];
const EMPTY: Record<FollowUpView, [string, string]> = {
  reach: ["No one to reach out to right now", "Warm follow-ups appear here after you attend an event with someone."],
  waiting: ["Not waiting on anyone", "Once you mark someone contacted, they'll wait here until they reply."],
  all: ["No follow-ups yet", "Import a synthetic event history from Integrations to get started."],
};

export default function FollowUpsPage() {
  const ws = useGetWorkspace();
  const open = useOpenPerson();
  const update = useUpdatePerson();
  const invalidate = useInvalidateAll();
  const { toast } = useToast();
  const [view, setView] = useState<FollowUpView>("reach");
  if (ws.isLoading) return <LoadingBlock />;
  if (ws.isError || !ws.data) return <ErrorBlock onRetry={() => ws.refetch()} />;
  const groups = groupFollowUps(ws.data.people, ws.data.preferences, workspaceToday(ws.data));
  const list = groups[view];

  const setStatus = (id: string, status: PersonUpdateStatus) =>
    update.mutate({ id, data: { status } }, {
      onSuccess: async () => { await invalidate(); toast({ title: `Status set to ${STATUS_META[status].label.toLowerCase()}` }); },
      onError: () => toast({ title: "Couldn't update status", description: "Nothing was changed. Try again.", variant: "destructive" }),
    });

  return (
    <div>
      <PageHeader eyebrow="Follow-ups" title="Keep the conversation going." />
      <Tabs value={view} onValueChange={(v) => setView(v as FollowUpView)} className="mb-6">
        <TabsList aria-label="Follow-up views" className="max-w-full justify-start overflow-x-auto">
          {VIEWS.map(([k, l]) => (
            <TabsTrigger key={k} value={k} data-testid={`button-filter-${k}`}>
              {l} <span className="ml-1.5 text-xs opacity-70">{groups[k].length}</span>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      {list.length === 0 ? <Empty title={EMPTY[view][0]}>{EMPTY[view][1]}</Empty> : (
        <GlassCard as="section" className="divide-y divide-line p-0" aria-label="Follow-up list">
          {list.map(({ person: p, reasons }) => (
            <div key={p.id} data-testid={`row-followup-${p.id}`} className="grid items-center gap-4 p-4 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1.5fr)_auto] md:px-6">
              <div className="flex min-w-0 items-center gap-3">
                <Face p={p} />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2"><span className="truncate font-semibold">{p.name}</span>{view === "all" && <StatusPill status={p.status} />}</div>
                  <div className="truncate text-xs text-ink-muted">{reasons[0] ?? `${p.role} · ${p.company}`}</div>
                </div>
              </div>
              <div className="min-w-0 text-sm">
                <div className="flex flex-wrap items-center gap-2"><span className="truncate">{p.nextAction || <span className="italic text-ink-muted">No next step set</span>}</span><DuePill date={p.dueDate} done={p.status === "replied"} /></div>
                {p.commitment && <div className="mt-0.5 truncate text-xs text-ink-muted"><span className="font-semibold text-pop-ink">You promised:</span> {p.commitment}</div>}
                {p.draft && <div className="mt-0.5 truncate text-xs text-ink-muted">Draft saved · {p.draft.slice(0, 60)}</div>}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button size="sm" onClick={() => open(p.id)} data-testid={`button-reach-out-${p.id}`} icon={<Send className="h-3.5 w-3.5" />}>Reach out</Button>
                <Select value={p.status} onValueChange={(v) => setStatus(p.id, v as PersonUpdateStatus)}>
                  <SelectTrigger className="h-9 w-32 focus-visible:ring-3 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-bg" aria-label={`Status for ${p.name}`} data-testid={`select-status-${p.id}`}><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(STATUS_META).map(([k, m]) => <SelectItem key={k} value={k}>{m.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
          ))}
        </GlassCard>
      )}
      <p className="mt-4 text-xs text-ink-muted">Suggestions only include people you attended an event with. A registration isn't attendance, and attending together doesn't mean you met. Afterglow never sends messages for you.</p>
    </div>
  );
}
