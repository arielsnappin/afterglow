import { useState } from "react";
import { Link } from "wouter";
import { useGetWorkspace } from "@workspace/api-client-react";
import { EventCard } from "@workspace/afterglow-design-system/components/afterglow/event-card";
import { Button } from "@workspace/afterglow-design-system/components/afterglow/button";
import { toneFor } from "@workspace/afterglow-design-system/components/afterglow/tone";
import { Tabs, TabsList, TabsTrigger } from "@workspace/afterglow-design-system/components/ui/tabs";
import { PageHeader } from "@/components/shell";
import { LoadingBlock, ErrorBlock, Empty } from "@/components/bits";
import { fmtDate, eventPeople } from "@/lib/afterglow";

type Tab = "all" | "upcoming" | "past";

export default function EventsPage() {
  const ws = useGetWorkspace();
  const [tab, setTab] = useState<Tab>("all");
  if (ws.isLoading) return <LoadingBlock />;
  if (ws.isError || !ws.data) return <ErrorBlock onRetry={() => ws.refetch()} />;
  const list = ws.data.events.filter((e) => tab === "all" || e.kind === tab).sort((a, b) => (a.kind === b.kind ? (a.kind === "upcoming" ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date)) : a.kind === "upcoming" ? -1 : 1));

  return (
    <div>
      <PageHeader eyebrow="Events" title="Your events">
        <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
          <TabsList aria-label="Filter events">
            {(["all", "upcoming", "past"] as const).map((t) => (
              <TabsTrigger key={t} value={t} className="capitalize" data-testid={`button-tab-${t}`}>{t}</TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </PageHeader>
      <p className="-mt-4 mb-6 max-w-2xl text-sm text-ink-muted">Prepare for who you might see, and review who you met afterwards.</p>
      {list.length === 0 ? <Empty title="No events here">Bring in a synthetic event history from Integrations.</Empty> : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((e) => {
            const known = eventPeople(ws.data, e);
            const sticker = e.kind === "upcoming" ? "Upcoming" : !e.debrief ? "Add notes" : undefined;
            return (
              <div key={e.id} data-testid={`card-event-${e.id}`}>
                <EventCard
                  className="h-full w-full"
                  tone={toneFor(e.id)}
                  sticker={sticker}
                  title={e.title}
                  date={fmtDate(e.date, "EEE, MMM d yyyy")}
                  time={e.time}
                  location={e.location}
                  host={e.host}
                  going={known.map((p) => ({ name: p.name, tone: toneFor(p.id) }))}
                  goingCaption={`${known.length} ${e.kind === "upcoming" ? "registered" : "attended"} · ${e.attendanceLabel}`}
                >
                  <Button asChild variant="secondary" size="sm"><Link href={`/events/${e.id}`} data-testid={`link-event-open-${e.id}`}>{e.kind === "upcoming" ? "Prepare" : "Review event"}</Link></Button>
                </EventCard>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
