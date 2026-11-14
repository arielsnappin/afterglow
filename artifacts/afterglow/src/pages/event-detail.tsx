import { useState } from "react";
import { Link, useParams } from "wouter";
import { ArrowLeft, MapPin, Clock, Save, Wand2, Check, X, History } from "lucide-react";
import {
  useGetWorkspace,
  useUpdateEvent,
  usePreviewDebrief,
  useUpdatePerson,
  type DebriefPreview,
  type Event as AgEvent,
  type Workspace,
} from "@workspace/api-client-react";
import { Button } from "@workspace/afterglow-design-system/components/afterglow/button";
import { GlassCard } from "@workspace/afterglow-design-system/components/afterglow/glass-card";
import { TextField } from "@workspace/afterglow-design-system/components/afterglow/text-field";
import { Sticker } from "@workspace/afterglow-design-system/components/afterglow/sticker";
import { AvatarStack } from "@workspace/afterglow-design-system/components/afterglow/avatar-stack";
import { toneFor } from "@workspace/afterglow-design-system/components/afterglow/tone";
import { useToast } from "@workspace/afterglow-design-system/hooks/use-toast";
import { cn } from "@workspace/afterglow-design-system/lib/utils";
import { useOpenPerson } from "@/components/shell";
import { Face, StatusPill, LoadingBlock, ErrorBlock, Empty, Panel } from "@/components/bits";
import { fmtDate, useInvalidateAll, eventPeople, recentSharedEvents } from "@/lib/afterglow";

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const ws = useGetWorkspace();
  if (ws.isLoading) return <LoadingBlock />;
  if (ws.isError || !ws.data) return <ErrorBlock onRetry={() => ws.refetch()} />;
  const ev = ws.data.events.find((e) => e.id === id);
  if (!ev) return <Empty title="That event isn't in your workspace"><Link href="/events" className="font-semibold text-pop-ink underline">Back to events</Link></Empty>;
  return <EventView key={ev.id} ev={ev} ws={ws.data} />;
}

function EventView({ ev, ws }: { ev: AgEvent; ws: Workspace }) {
  const open = useOpenPerson();
  const attendees = eventPeople(ws, ev);
  return (
    <div>
      <Button asChild variant="ghost" size="sm" className="mb-6"><Link href="/events" data-testid="link-back-events"><ArrowLeft className="h-4 w-4" aria-hidden="true" />Events</Link></Button>
      <GlassCard as="header" tone={toneFor(ev.id)} slab className="relative mb-8 md:p-10">
        <div className="absolute right-6 top-6"><Sticker tone={toneFor(ev.id) === "zap" ? "sun" : "zap"} tilt={6}>{ev.kind === "upcoming" ? "Prepare" : "Review"}</Sticker></div>
        <div className="type-label pr-28">{ev.source}</div>
        <h1 className="type-title md:type-display-xl mt-2 max-w-3xl" data-testid="text-event-title">{ev.title}</h1>
        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-sm font-semibold">
          <span>{fmtDate(ev.date, "EEEE, MMMM d yyyy")}</span>
          <span className="flex items-center gap-1"><Clock className="h-4 w-4" aria-hidden="true" />{ev.time}</span>
          <span className="flex items-center gap-1"><MapPin className="h-4 w-4" aria-hidden="true" />{ev.location}</span>
        </div>
        <p className="mt-4 max-w-2xl">{ev.description}</p>
      </GlassCard>
      {ws.memberships && <details className="mb-6 rounded-md border border-line bg-glass p-4 text-sm">
        <summary className="cursor-pointer font-semibold">Registration and attendance evidence · {ws.memberships.filter(m => m.eventId === ev.id).length} guest records</summary>
        <p className="my-2 text-xs text-ink-muted">Source registrations are separate from confirmed ticket check-ins and your demo-defined self-attendance. Approved does not mean attended. No check-in does not prove absence.</p>
        <ul className="divide-y divide-line">{ws.memberships.filter(m => m.eventId === ev.id).map(m => <li key={m.guestId} className="py-2">
          {ws.people.find(p => p.id === m.personId)?.name} <span className="text-ink-muted">· {m.personId} · {m.approvalStatus} · {m.checkedInAt ? `ticket checked in ${m.checkedInAt}` : "no check-in evidence available"}</span>
        </li>)}</ul>
      </details>}

      {ev.kind === "past" ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
          <Debrief ev={ev} ws={ws} />
          <Panel>
            <h2 className="type-title">People you attended with</h2>
            <p className="mb-3 mt-1 text-sm">{ev.attendanceLabel}</p>
            {attendees.length > 0 && <AvatarStack className="mb-3" people={attendees.map((p) => ({ name: p.name, tone: toneFor(p.id) }))} caption={`${attendees.length} you know`} />}
            {attendees.length === 0 ? <Empty title="No one linked yet">Confirmed co-attendees will appear here.</Empty> : attendees.map((p) => (
              <button key={p.id} onClick={() => open(p.id)} data-testid={`button-attendee-${p.id}`} className="flex w-full items-center gap-3 rounded-md border-t border-line px-2 py-3 text-left first:border-0 hover:bg-glass focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus">
                <Face p={p} size="sm" />
                <div className="min-w-0 flex-1"><div className="text-sm font-semibold">{p.name}</div><div className="truncate text-xs text-ink-muted">{p.met ? "Meeting recorded (event unspecified)" : "No meeting recorded"} · {p.role}{p.sourceUserId ? ` · ${p.sourceUserId}` : ""}</div></div>
                <StatusPill status={p.status} />
              </button>
            ))}
          </Panel>
        </div>
      ) : (
        <div>
          <h2 className="type-title">Who you might see</h2>
          <p className="mb-5 mt-1 text-sm text-ink-muted">Approved registrations, not confirmed attendance. Prior shared events below require both ticket check-in and demo self-attendance; they do not prove a meeting.</p>
          {attendees.length === 0 ? <Empty title="No known attendees yet">Nobody from your past events is listed for this one.</Empty> : (
            <div className="grid gap-4 md:grid-cols-2">
              {attendees.map((p) => {
                const prior = recentSharedEvents(ws, p).filter(e => e.id !== ev.id);
                return (
                  <button key={p.id} onClick={() => open(p.id)} data-testid={`card-repeat-${p.id}`} className="ag-glass ag-glass--compact text-left transition-[transform,background-color] duration-220 hover:-translate-y-0.5 hover:bg-glass-strong focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-focus motion-reduce:transform-none">
                    <div className="flex items-center gap-3"><Face p={p} /><div className="flex-1"><div className="font-semibold">{p.name}</div><div className="text-xs text-ink-muted">{p.role} · {p.company}{p.sourceUserId ? ` · ${p.sourceUserId}` : ""}</div></div>{prior.length > 0 && <Sticker tone="sun">Prior attendance</Sticker>}</div>
                    {prior.length > 0 && <div className="mt-3 flex items-center gap-1.5 text-xs text-ink-muted"><History className="h-3 w-3" aria-hidden="true" />Shared attendance{ws.journey ? ` in demo's ${ws.journey.windowDays}-day window` : ""}: {prior.map(e => e.title).join(", ")}</div>}
                    <div className="mt-3 rounded-md border border-line bg-bg-raised p-3 text-sm">{p.notes ? p.notes : <span className="italic text-ink-muted">No notes yet.</span>}</div>
                    {p.commitment && <div className="mt-2 text-xs"><span className="font-semibold text-pop-ink">You promised:</span> {p.commitment}</div>}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Debrief({ ev, ws }: { ev: AgEvent; ws: Workspace }) {
  const { toast } = useToast();
  const invalidate = useInvalidateAll();
  const updateEvent = useUpdateEvent();
  const preview = usePreviewDebrief();
  const updatePerson = useUpdatePerson();
  const [text, setText] = useState(ev.debrief);
  const [result, setResult] = useState<DebriefPreview | null>(null);
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [handled, setHandled] = useState<Record<string, "approved" | "skipped">>({});
  const dirty = text !== ev.debrief;

  const save = () => updateEvent.mutate({ id: ev.id, data: { debrief: text } }, {
    onSuccess: async () => { await invalidate(); toast({ title: "Debrief saved" }); },
    onError: () => toast({ title: "Couldn't save debrief", variant: "destructive" }),
  });
  const find = () => preview.mutate({ id: ev.id, data: { text } }, {
    onSuccess: (r) => { setResult(r); setEdits(Object.fromEntries(r.candidates.map((c) => [c.personId, c.notes]))); setHandled({}); },
    onError: () => toast({ title: "Couldn't scan debrief", variant: "destructive" }),
  });
  const approve = (personId: string) => {
    const p = ws.people.find((x) => x.id === personId);
    const add = (edits[personId] ?? "").trim();
    if (!p || !add) return;
    const notes = p.notes.trim() ? `${p.notes.trim()}\n\n${add}` : add;
    updatePerson.mutate({ id: personId, data: { notes } }, {
      onSuccess: async () => { setHandled((h) => ({ ...h, [personId]: "approved" })); await invalidate(); toast({ title: `Added to ${p.name}'s notes`, description: "Met status unchanged — set it yourself if you talked." }); },
      onError: () => toast({ title: "Couldn't add note", variant: "destructive" }),
    });
  };

  return (
    <Panel className="space-y-4">
      <div className="flex items-baseline justify-between"><h2 className="type-title">Your notes from this event</h2><span className="text-xs text-ink-muted">{dirty ? "Unsaved" : ev.debrief ? "Saved" : "Empty"}</span></div>
      {ev.scenarioDebrief && <div className="space-y-2 rounded-md border border-dashed border-line p-3 text-sm"><p>{ev.scenarioDebrief}</p><Button variant="secondary" size="sm" className="max-w-full whitespace-normal" disabled={!!text.trim()} onClick={() => setText(ev.scenarioDebrief!)} data-testid="button-load-scenario-debrief">Use fictional prompt for review</Button><p className="text-xs text-ink-muted">Only fills this unsaved editor. Edit before saving. Matching names never marks anyone met or contacted.</p></div>}
      <TextField multiline aria-label="Debrief" data-testid="input-debrief" rows={9} value={text} onChange={(e) => setText(e.target.value)} placeholder="Talked to Mika about pricing. Promised Jo the deck." />
      <p className="text-xs text-ink-muted">Demo workspace: write about the fictional people here only. Don't enter real personal data.</p>
      <div className="flex flex-wrap gap-2">
        <Button onClick={save} loading={updateEvent.isPending} disabled={!dirty} data-testid="button-save-debrief" icon={<Save className="h-4 w-4" />}>{updateEvent.isPending ? "Saving" : "Save debrief"}</Button>
        <Button variant="secondary" onClick={find} loading={preview.isPending} disabled={!text.trim()} data-testid="button-preview-debrief" icon={<Wand2 className="h-4 w-4" />}>{preview.isPending ? "Scanning" : "Find people mentioned"}</Button>
      </div>
      {result && (
        <div className="space-y-3 rounded-lg border border-dashed border-line p-4" data-testid="panel-debrief-suggestions">
          <div className="text-xs text-ink-muted"><span className="font-semibold text-ink">Name matching, not AI.</span> {result.explanation} Review each suggestion — nothing is saved until you approve, and nobody is marked as met.</div>
          {result.candidates.length === 0 ? <div className="text-sm italic text-ink-muted">No names from this event's guest list showed up in your text.</div> : result.candidates.map((c) => {
            const state = handled[c.personId];
            const p = ws.people.find((x) => x.id === c.personId);
            return (
              <div key={c.personId} className={cn("rounded-md border border-line bg-bg-raised p-3 transition-opacity", state && "opacity-60")} data-testid={`card-candidate-${c.personId}`}>
                <div className="mb-2 flex items-center gap-2">{p && <Face p={p} size="sm" />}<span className="text-sm font-semibold">{c.name}</span>{state && <span className="ml-auto text-xs capitalize text-ink-muted">{state}</span>}</div>
                <TextField multiline rows={2} aria-label={`Note for ${c.name}`} value={edits[c.personId] ?? ""} disabled={!!state} onChange={(e) => setEdits((s) => ({ ...s, [c.personId]: e.target.value }))} data-testid={`input-candidate-${c.personId}`} />
                {!state && <div className="mt-2 flex gap-2">
                  <Button size="sm" variant="zap" disabled={updatePerson.isPending || !(edits[c.personId] ?? "").trim()} onClick={() => approve(c.personId)} data-testid={`button-approve-${c.personId}`} icon={<Check className="h-3.5 w-3.5" />}>Add to notes</Button>
                  <Button size="sm" variant="ghost" onClick={() => setHandled((h) => ({ ...h, [c.personId]: "skipped" }))} data-testid={`button-skip-${c.personId}`} icon={<X className="h-3.5 w-3.5" />}>Skip</Button>
                </div>}
              </div>
            );
          })}
        </div>
      )}
    </Panel>
  );
}
