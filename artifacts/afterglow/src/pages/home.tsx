import { Link } from "wouter";
import { ArrowRight, Send } from "lucide-react";
import { useGetWorkspace, useGetSummary } from "@workspace/api-client-react";
import { EventCard } from "@workspace/afterglow-design-system/components/afterglow/event-card";
import { Button } from "@workspace/afterglow-design-system/components/afterglow/button";
import { toneFor } from "@workspace/afterglow-design-system/components/afterglow/tone";
import { cn } from "@workspace/afterglow-design-system/lib/utils";
import { PageHeader, useOpenPerson } from "@/components/shell";
import { Face, StatusPill, DuePill, LoadingBlock, ErrorBlock, Empty, Panel } from "@/components/bits";
import { followUpGroup, rankPeople, fmtDate, workspaceToday, eventPeople } from "@/lib/afterglow";

export default function HomePage() {
  const ws = useGetWorkspace();
  const sum = useGetSummary();
  const open = useOpenPerson();
  if (ws.isLoading) return <LoadingBlock />;
  if (ws.isError || !ws.data) return <ErrorBlock onRetry={() => ws.refetch()} />;
  const { events, people, preferences } = ws.data;
  const ranked = rankPeople(people, preferences, workspaceToday(ws.data)).filter((r) => followUpGroup(r.person.status) === "reach").slice(0, 5);
  const next = events.filter((e) => e.kind === "upcoming").sort((a, b) => a.date.localeCompare(b.date))[0];
  const s = sum.data;
  const v = (n: number | undefined) => (sum.isLoading ? "–" : n ?? "–");
  const stats = [
    { k: "Events attended", v: s?.eventsAttended, cls: "bg-pop", id: "events-attended" },
    { k: "People you met", v: s?.peopleMet, cls: "bg-sky", id: "people-met" },
    { k: "Conversations started", v: s?.conversationsStarted, cls: "bg-zap", id: "conversations-started" },
    { k: "Open follow-ups", v: s?.openFollowups, cls: "bg-sun", id: "open-follow-ups" },
  ];

  return (
    <div>
      <PageHeader eyebrow="Home" title="Keep good connections going." />
      <p className="-mt-4 mb-6 max-w-2xl text-sm text-ink-muted">Here's what your events have added up to so far, and who's worth a note next.</p>

      <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-4" aria-label="Your progress">
        {stats.map((x) => (
          <div key={x.k} className={cn("rounded-lg p-5 text-on-bright", x.cls)} data-testid={`stat-${x.id}`}>
            <div className="font-display text-5xl font-extrabold leading-none tracking-tight">{v(x.v)}</div>
            <div className="mt-2 text-sm font-semibold">{x.k}</div>
          </div>
        ))}
      </div>
      {!!s?.dueCount && (
        <Link href="/follow-ups" data-testid="stat-due-now" className="mb-8 inline-flex items-center gap-2 rounded-full border border-line px-4 py-2 text-sm font-semibold hover:bg-glass focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus">
          {s.dueCount} follow-up{s.dueCount === 1 ? "" : "s"} due <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Panel>
          <div className="mb-1 flex items-baseline justify-between gap-3">
            <h2 className="type-title">Warm follow-ups</h2>
            <Link href="/follow-ups" className="text-sm font-semibold text-pop-ink hover:underline" data-testid="link-all-followups">All follow-ups</Link>
          </div>
          <p className="mb-4 text-sm">People you attended events with, ordered by what you're looking for: "<span className="italic">{preferences.goal}</span>", plus open promises and due dates.</p>
          {ranked.length === 0 ? <Empty title="No warm follow-ups yet">Suggestions start once you've attended an event with someone. A registration alone doesn't count.</Empty> : (
            <ol className="divide-y divide-line">
              {ranked.map((r) => (
                <li key={r.person.id} className="flex flex-wrap items-start gap-3 px-2 py-3 sm:flex-nowrap">
                  <Face p={r.person} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2"><span className="font-semibold">{r.person.name}</span><StatusPill status={r.person.status} /><DuePill date={r.person.dueDate} /></div>
                    <div className="truncate text-xs text-ink-muted">{r.person.role} · {r.person.company}</div>
                    <div className="mt-1 text-sm text-ink">{r.reasons.slice(0, 2).join(" · ") || "You attended an event together"}</div>
                  </div>
                  <Button size="sm" onClick={() => open(r.person.id)} data-testid={`button-priority-${r.person.id}`} icon={<Send className="h-3.5 w-3.5" />}>Reach out</Button>
                </li>
              ))}
            </ol>
          )}
        </Panel>

        <div className="space-y-6">
          {next ? (
            <EventCard
              className="w-full"
              headingLevel="h2"
              tone={toneFor(next.id)}
              sticker="Up next"
              title={next.title}
              date={fmtDate(next.date)}
              time={next.time}
              location={next.location}
              host={next.host}
              going={eventPeople(ws.data, next).map((p) => ({ name: p.name, tone: toneFor(p.id) }))}
              goingCaption={`${eventPeople(ws.data, next).length} registered so far`}
            >
              <Button asChild variant="secondary" size="sm"><Link href={`/events/${next.id}`} data-testid="link-next-event">See who's coming back</Link></Button>
            </EventCard>
          ) : <Empty title="Nothing on the calendar yet">Upcoming events you've registered for will show up here.</Empty>}
        </div>
      </div>
    </div>
  );
}
