import { useMemo, useState } from "react";
import { ChevronRight } from "lucide-react";
import { useGetWorkspace, type Person } from "@workspace/api-client-react";
import { TextField } from "@workspace/afterglow-design-system/components/afterglow/text-field";
import { Button } from "@workspace/afterglow-design-system/components/afterglow/button";
import { Tabs, TabsList, TabsTrigger } from "@workspace/afterglow-design-system/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@workspace/afterglow-design-system/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@workspace/afterglow-design-system/components/ui/table";
import { cn } from "@workspace/afterglow-design-system/lib/utils";
import { PageHeader, useOpenPerson } from "@/components/shell";
import { Face, StatusPill, DuePill, LoadingBlock, ErrorBlock, Empty } from "@/components/bits";
import { rankPeople, eventsById, workspaceToday, eligible, fmtDate, type Ranked } from "@/lib/afterglow";

type MetFilter = "all" | "met" | "not";
type StatusFilter = "all" | "suggested" | "saved" | "contacted" | "replied" | "registered" | "dismissed";
type Sort = "priority" | "name" | "due";

const STATUS_OPTIONS: [StatusFilter, string][] = [
  ["all", "All statuses"], ["suggested", "Suggested"], ["saved", "Saved"], ["contacted", "Contacted"],
  ["replied", "Replied"], ["registered", "Registered only"], ["dismissed", "Dismissed"],
];

function matchesStatus(p: Person, f: StatusFilter) {
  if (f === "all") return true;
  if (f === "dismissed") return p.dismissed;
  if (f === "registered") return !eligible(p);
  return eligible(p) && !p.dismissed && p.status === f;
}

export default function PeoplePage() {
  const ws = useGetWorkspace();
  const open = useOpenPerson();
  const [q, setQ] = useState("");
  const [met, setMet] = useState<MetFilter>("all");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [sort, setSort] = useState<Sort>("priority");
  const ranked = useMemo(() => (ws.data ? rankPeople(ws.data.people, ws.data.preferences, workspaceToday(ws.data), false) : []), [ws.data]);
  if (ws.isLoading) return <LoadingBlock />;
  if (ws.isError || !ws.data) return <ErrorBlock onRetry={() => ws.refetch()} />;
  const evs = eventsById(ws.data.events);
  const dismissed: Ranked[] = ws.data.people.filter((p) => p.dismissed).map((person) => ({ person, score: 0, matched: [], reasons: [] }));
  const ql = q.toLowerCase().trim();
  const filtered = [...ranked, ...dismissed].filter(({ person: p }) =>
    (met === "all" || (met === "met" ? p.met : !p.met)) && matchesStatus(p, status) &&
    (!ql || [p.name, p.role, p.company, p.bio, p.notes, ...p.interests].join(" ").toLowerCase().includes(ql)));
  const list = sort === "priority" ? filtered : [...filtered].sort((a, b) => {
    if (sort === "name") return a.person.name.localeCompare(b.person.name);
    const da = eligible(a.person) ? a.person.dueDate : "", db = eligible(b.person) ? b.person.dueDate : "";
    if (!da !== !db) return da ? -1 : 1;
    return da.localeCompare(db) || a.person.name.localeCompare(b.person.name);
  });
  const filteredOut = !!ql || met !== "all" || status !== "all";
  const clear = () => { setQ(""); setMet("all"); setStatus("all"); };
  const titles = (ids?: string[]) => (ids ?? []).map((id) => evs[id]?.title).filter(Boolean).join(" · ");

  return (
    <div>
      <PageHeader eyebrow="People" title="Your people" />
      <p className="-mt-4 mb-6 max-w-2xl text-sm text-ink-muted">Relationship history from your events: what you talked about, whether you met, and what comes next.</p>
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <TextField className="min-w-56 flex-1" type="search" aria-label="Search people" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search names, roles, interests, notes" data-testid="input-search-people" />
        <Tabs value={met} onValueChange={(v) => setMet(v as MetFilter)}>
          <TabsList aria-label="Filter by met">
            {([["all", "Everyone"], ["met", "Met"], ["not", "Not met yet"]] as const).map(([k, l]) => (
              <TabsTrigger key={k} value={k} data-testid={`button-filter-${k}`}>{l}</TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Select value={status} onValueChange={(v) => setStatus(v as StatusFilter)}>
          <SelectTrigger className="w-48" aria-label="Filter by follow-up status" data-testid="select-status-filter"><SelectValue /></SelectTrigger>
          <SelectContent>{STATUS_OPTIONS.map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={sort} onValueChange={(v) => setSort(v as Sort)}>
          <SelectTrigger className="w-48" aria-label="Sort people" data-testid="select-sort-people"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="priority">Sort: Priority</SelectItem>
            <SelectItem value="name">Sort: Name</SelectItem>
            <SelectItem value="due">Sort: Due date</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-sm text-ink-muted" aria-live="polite" data-testid="text-people-count">
          {list.length} of {ws.data.people.length} {ws.data.people.length === 1 ? "person" : "people"}
        </span>
      </div>

      {list.length === 0 ? (
        <Empty title={ws.data.people.length === 0 ? "No people yet" : "No one matches that"}>
          {ws.data.people.length === 0 ? "Bring in a synthetic event history from Integrations." : (
            <>Try a different word or filter.{filteredOut && <div className="mt-3"><Button size="sm" variant="secondary" onClick={clear} data-testid="button-clear-filters">Clear filters</Button></div>}</>
          )}
        </Empty>
      ) : (
        <div className="rounded-lg border border-line bg-glass" data-testid="table-people">
          <Table className="min-w-4xl">
            <TableHeader>
              <TableRow>
                <TableHead>Person</TableHead>
                <TableHead>Event context</TableHead>
                <TableHead>Met</TableHead>
                <TableHead>Follow-up</TableHead>
                <TableHead>Next action</TableHead>
                <TableHead>Note</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map(({ person: p, matched }) => {
                const ok = eligible(p);
                const shared = titles(p.sharedEventIds);
                return (
                  <TableRow key={p.id} className={cn(p.dismissed && "opacity-60")} data-testid={`row-person-${p.id}`}>
                    <TableCell className="align-top">
                      <button type="button" onClick={() => open(p.id)} data-testid={`card-person-${p.id}`} aria-label={`Open ${p.name}`}
                        className="group flex min-w-48 items-center gap-3 rounded-md text-left focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus">
                        <Face p={p} size="sm" />
                        <span className="min-w-0">
                          <span className="flex items-center gap-1 font-semibold group-hover:underline">{p.name}<ChevronRight className="h-3.5 w-3.5 text-ink-muted transition-transform duration-220 group-hover:translate-x-0.5 motion-reduce:transform-none" aria-hidden="true" /></span>
                          <span className="block truncate text-xs text-ink-muted">{p.role} · {p.company}</span>
                        </span>
                      </button>
                    </TableCell>
                    <TableCell className="max-w-56 align-top text-xs">
                      {p.sharedEventIds === undefined ? (
                        <span className="text-ink-muted">{titles(p.eventIds) || "No events"}</span>
                      ) : shared ? (
                        <><div className="font-semibold">Attended together</div><div className="line-clamp-2 text-ink-muted">{shared}</div></>
                      ) : (
                        <><div className="font-semibold text-ink-muted">Attendance not confirmed</div><div className="line-clamp-2 text-ink-muted">Registered: {titles(p.eventIds) || "none"}</div></>
                      )}
                    </TableCell>
                    <TableCell className="align-top">
                      <span className={cn("whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-semibold", p.met ? "bg-zap text-on-bright" : "border border-line text-ink-muted")}>{p.met ? "Met" : "Not met"}</span>
                    </TableCell>
                    <TableCell className="align-top">
                      <div className="flex flex-wrap gap-1.5">
                        {ok ? <StatusPill status={p.status} /> : <span className="whitespace-nowrap rounded-full border border-line px-2.5 py-0.5 text-xs text-ink-muted">Registered only</span>}
                        {p.dismissed && <span className="text-xs text-ink-muted">Dismissed</span>}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-48 align-top text-xs">
                      {ok && (p.nextAction || p.dueDate) ? (
                        <div className="space-y-1">
                          {p.nextAction && <div className="line-clamp-2">{p.nextAction}</div>}
                          {p.dueDate && <div className="flex flex-wrap items-center gap-1.5"><span className="text-ink-muted">{fmtDate(p.dueDate)}</span><DuePill date={p.dueDate} done={p.status === "replied"} /></div>}
                        </div>
                      ) : <span className="text-ink-muted">None</span>}
                    </TableCell>
                    <TableCell className="max-w-64 align-top text-xs">
                      <div className="line-clamp-2">{p.notes || p.bio}</div>
                      {matched.length > 0 && <div className="mt-1 truncate text-pop-ink">{matched.slice(0, 3).join(", ")}</div>}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
