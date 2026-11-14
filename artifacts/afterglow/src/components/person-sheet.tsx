import { useState, type RefObject } from "react";
import { Copy, Linkedin, Save, Sparkles, Lightbulb, Mail, CalendarPlus, Quote, Info, Check } from "lucide-react";
import {
  useGetWorkspace,
  useUpdatePerson,
  useSuggestDraft,
  type Person,
  type Workspace,
  type PersonUpdateStatus,
  type DraftInputMode,
} from "@workspace/api-client-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@workspace/afterglow-design-system/components/ui/sheet";
import { Switch } from "@workspace/afterglow-design-system/components/ui/switch";
import { Label } from "@workspace/afterglow-design-system/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@workspace/afterglow-design-system/components/ui/tabs";
import { Button } from "@workspace/afterglow-design-system/components/afterglow/button";
import { GlassCard } from "@workspace/afterglow-design-system/components/afterglow/glass-card";
import { TextField } from "@workspace/afterglow-design-system/components/afterglow/text-field";
import { toneFor } from "@workspace/afterglow-design-system/components/afterglow/tone";
import { useToast } from "@workspace/afterglow-design-system/hooks/use-toast";
import { cn } from "@workspace/afterglow-design-system/lib/utils";
import { Face, StatusPill } from "@/components/bits";
import { copyText, eventsById, fmtDate, rankPeople, useInvalidateAll, STATUS_META, workspaceToday, eligible, recentSharedEvents } from "@/lib/afterglow";

export function PersonSheet({ personId, onClose, returnFocusRef }: { personId: string | null; onClose: () => void; returnFocusRef: RefObject<HTMLElement | null> }) {
  const { data: ws } = useGetWorkspace();
  const person = ws?.people.find((p) => p.id === personId);
  return (
    <Sheet open={!!personId} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        className="w-full max-h-[100dvh] overflow-y-auto p-0 sm:max-w-xl"
        data-testid="sheet-person"
        onCloseAutoFocus={(event) => {
          if (returnFocusRef.current?.isConnected) {
            event.preventDefault();
            returnFocusRef.current.focus();
          }
        }}
      >
        {person && ws ? (
          <PersonEditor key={person.id} person={person} ws={ws} onDone={onClose} />
        ) : (
          <SheetHeader className="p-6 pr-14"><SheetTitle>Person not found</SheetTitle><SheetDescription>They may have been removed.</SheetDescription></SheetHeader>
        )}
      </SheetContent>
    </Sheet>
  );
}

const MODES: { mode: DraftInputMode; label: string; icon: typeof Mail }[] = [
  { mode: "followup", label: "Follow-up", icon: Mail },
  { mode: "idea", label: "Idea", icon: Lightbulb },
  { mode: "invite", label: "Invite", icon: CalendarPlus },
];

const label = "type-label text-ink";

function PersonEditor({ person, ws, onDone }: { person: Person; ws: Workspace; onDone: () => void }) {
  const { toast } = useToast();
  const invalidate = useInvalidateAll();
  const update = useUpdatePerson();
  const suggest = useSuggestDraft();
  const [f, setF] = useState({
    met: person.met,
    notes: person.notes,
    commitment: person.commitment,
    status: person.status as PersonUpdateStatus,
    draft: person.draft,
    nextAction: person.nextAction,
    dueDate: person.dueDate,
    dismissed: person.dismissed,
  });
  const [explanation, setExplanation] = useState("");
  const [copied, setCopied] = useState(false);
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((s) => ({ ...s, [k]: v }));
  const evs = eventsById(ws.events);
  const rank = rankPeople([person], ws.preferences, workspaceToday(ws), false)[0];
  const metChanged = f.met !== person.met;
  const dirty = JSON.stringify(f) !== JSON.stringify({ met: person.met, notes: person.notes, commitment: person.commitment, status: person.status, draft: person.draft, nextAction: person.nextAction, dueDate: person.dueDate, dismissed: person.dismissed });

  const save = () => {
    const data = { ...f, draft: metChanged ? "" : f.draft };
    update.mutate(
      { id: person.id, data },
      {
        onSuccess: async () => {
          await invalidate();
          if (metChanged) setF((s) => ({ ...s, draft: "" }));
          toast({ title: "Saved", description: metChanged ? "Met status changed, so the old draft was cleared to avoid claiming a meeting that didn't happen." : `${person.name} is up to date.` });
        },
        onError: () => toast({ title: "Couldn't save", description: "Nothing was changed. Try again.", variant: "destructive" }),
      },
    );
  };

  const runSuggest = (mode: DraftInputMode) =>
    suggest.mutate(
      { id: person.id, data: { mode } },
      {
        onSuccess: (r) => { set("draft", r.text); setExplanation(r.explanation); },
        onError: () => toast({ title: "Template unavailable", description: "Couldn't build a suggestion right now.", variant: "destructive" }),
      },
    );

  const copy = async () => {
    const r = await copyText(f.draft);
    if (r.ok) { setCopied(true); setTimeout(() => setCopied(false), 1600); toast({ title: "Copied", description: "Paste it wherever you talk to them. Their status hasn't changed." }); }
    else toast({ title: "Copy failed", description: r.error, variant: "destructive" });
  };

  return (
    <div>
      <GlassCard as="header" tone={toneFor(person.id)} className="rounded-none p-6 pr-14">
        <SheetHeader className="space-y-0 text-left">
          <div className="flex items-center gap-4">
            <Face p={person} />
            <div className="min-w-0">
              <SheetTitle className="type-title text-on-bright" data-testid="text-person-name">{person.name}</SheetTitle>
              <SheetDescription className="text-sm font-semibold text-on-bright">{person.role} · {person.company}</SheetDescription>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">{eligible(person) ? <StatusPill status={person.status} /> : <span className="text-xs font-semibold">Registered only · not a follow-up suggestion</span>}<span className="text-xs font-semibold">Source: {person.source}</span></div>
        </SheetHeader>
        <p className="mt-4 text-sm">{person.bio}</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {person.interests.map((i) => <span key={i} className="rounded-full border-2 border-on-bright px-2.5 py-0.5 text-xs font-semibold">{i}</span>)}
        </div>
        <div className="mt-3 flex items-center gap-2 text-xs font-semibold" data-testid="text-linkedin">
          <Linkedin className="h-3.5 w-3.5" aria-hidden="true" />
          {person.linkedinUrl ? <a className="underline" href={person.linkedinUrl} target="_blank" rel="noreferrer">LinkedIn profile</a> : "No LinkedIn on file (fictional demo profile)"}
        </div>
      </GlassCard>

      <div className="p-6 space-y-6">
        <section aria-labelledby="reach-out-title" className="space-y-3 rounded-lg border border-line bg-glass-strong p-4" data-testid="section-reach-out">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 id="reach-out-title" className="type-title">Reach out</h3>
            <div className="flex flex-wrap gap-1">
              {MODES.map(({ mode, label: l, icon: Icon }) => (
                <Button key={mode} size="sm" variant="secondary" disabled={suggest.isPending || !eligible(person)} onClick={() => runSuggest(mode)} data-testid={`button-template-${mode}`} icon={<Icon className="h-3.5 w-3.5" />}>
                  {l}
                </Button>
              ))}
            </div>
          </div>
          <p className="text-xs text-ink-muted">{eligible(person) ? "Start from a template built on your notes, or write your own." : "Templates open up once you've attended an event together. You can still write a note yourself."}</p>
          <TextField multiline aria-label="Draft message" data-testid="input-draft" rows={7} value={f.draft} onChange={(e) => set("draft", e.target.value)} placeholder="Great meeting you at the breakfast..." className={cn(suggest.isPending && "opacity-50")} />
          <div className="flex items-start gap-1.5 text-xs text-ink-muted">
            <Sparkles className="mt-0.5 h-3 w-3 shrink-0" aria-hidden="true" />
            <span>{explanation ? `Template-based. ${explanation}` : "Template-based, not AI. Edit freely. Afterglow never sends anything for you."}</span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button disabled={!f.draft.trim()} onClick={copy} data-testid="button-copy-draft" icon={copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}>
              {copied ? "Copied" : "Copy message"}
            </Button>
            <span className="text-xs text-ink-muted">Copying doesn't change their status. Mark them contacted once you've actually sent it.</span>
          </div>
        </section>

        <section aria-labelledby="status-title" className="space-y-4">
          <h3 id="status-title" className={label}>Follow-up status</h3>
          <Tabs value={f.status} onValueChange={(v) => set("status", v as PersonUpdateStatus)}>
            <TabsList aria-label="Status" className="grid w-full grid-cols-4">
              {(Object.keys(STATUS_META) as PersonUpdateStatus[]).map((s) => (
                <TabsTrigger key={s} value={s} className="px-2 text-xs" data-testid={`button-status-${s}`}>{STATUS_META[s].label}</TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <TextField label="Next step" data-testid="input-next-action" value={f.nextAction} onChange={(e) => set("nextAction", e.target.value)} placeholder="Send intro email" />
            <TextField label="Due" data-testid="input-due-date" type="date" value={f.dueDate} onChange={(e) => set("dueDate", e.target.value)} />
          </div>
        </section>

        <section aria-labelledby="context-title" className="space-y-5 rounded-lg border border-line p-4" data-testid="section-context">
          <div>
            <h3 id="context-title" className="type-title">Your context</h3>
            <p className="mt-1 text-xs text-ink-muted">What you've recorded so far. Afterglow keeps your current notes and status, not a dated history of every interaction.</p>
          </div>

          <div className="rounded-md border border-line bg-glass p-4 text-sm">
            <div className={cn(label, "mb-2 flex items-center gap-1.5")}><Info className="h-3 w-3" aria-hidden="true" />{eligible(person) ? "Why they're a warm follow-up" : "Not a follow-up suggestion yet"}</div>
            {rank?.reasons.length ? <ul className="space-y-1">{rank.reasons.map((r) => <li key={r}>{r}</li>)}</ul> : <p className="text-ink-muted">{eligible(person) ? "No reasons recorded yet, or dismissed." : "A registration isn't attendance. Suggestions start once you've attended an event together."}</p>}
            {!!rank?.matched.length && <div className="mt-2 flex flex-wrap gap-1">{rank.matched.map((m) => <span key={m} className="rounded-full border border-line px-2 py-0.5 text-xs text-pop-ink">{m}</span>)}</div>}
          </div>

          <div className="text-sm">
            <div className={cn(label, "mb-1")}>Events</div>
            {person.sharedEventIds && <p data-testid="text-shared-events">Attended together: {person.sharedEventIds.map((id) => evs[id]?.title ?? id).join(", ") || "none confirmed yet"}</p>}
            <p className="text-xs text-ink-muted">Registered for: {person.eventIds.map((id) => evs[id]?.title ?? id).join(", ") || "none"}</p>
            {ws.journey && <p className="mt-1 text-xs text-ink-muted">{recentSharedEvents(ws, person).length} shared events in the demo's {ws.journey.windowDays}-day window. Attending together doesn't mean you met.</p>}
            {person.sourceUserId && <p className="mt-1 text-xs text-ink-muted">Source ID: {person.sourceUserId} · {person.email}</p>}
          </div>

          <div className="flex items-center justify-between gap-4 rounded-md border border-line p-4">
            <div>
              <Label htmlFor="met" className="type-label">We actually met</Label>
              <p className="text-xs text-ink-muted">{metChanged ? "Changing this clears the current draft on save." : f.met ? "You recorded meeting in person." : "Not recorded as met. Drafts won't assume you did."}</p>
            </div>
            <Switch id="met" checked={f.met} onCheckedChange={(v) => set("met", v)} data-testid="switch-met" />
          </div>

          <TextField multiline label="Notes" data-testid="input-notes" rows={4} value={f.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Talked about community pricing over coffee" hint="Demo workspace: don't enter real personal data." />
          <TextField label="Something I promised" data-testid="input-commitment" value={f.commitment} onChange={(e) => set("commitment", e.target.value)} placeholder="Send the article on community pricing" />

          {person.evidence.length > 0 && (
            <div>
              <div className={cn(label, "mb-2")}>From the event</div>
              <ul className="space-y-2">{person.evidence.map((e, i) => <li key={i} className="flex gap-2 text-sm"><Quote className="mt-1 h-3.5 w-3.5 shrink-0 text-pop-ink" aria-hidden="true" />{e}</li>)}</ul>
            </div>
          )}
        </section>

        <div className="flex items-center justify-between gap-4 rounded-md border border-line p-4">
          <div><Label htmlFor="dismiss" className="type-label">Hide from warm follow-ups</Label><p className="text-xs text-ink-muted">They stay in Your people.</p></div>
          <Switch id="dismiss" checked={f.dismissed} onCheckedChange={(v) => set("dismissed", v)} data-testid="switch-dismissed" />
        </div>
      </div>

      <div className="sticky bottom-0 flex flex-wrap items-center justify-end gap-2 border-t border-line bg-bg-raised px-6 py-4">
        <span className="mr-auto text-xs text-ink-muted" aria-live="polite">{dirty ? "Unsaved changes" : "All saved"}</span>
        <Button variant="ghost" onClick={onDone} data-testid="button-close-person">Close</Button>
        <Button onClick={save} loading={update.isPending} disabled={!dirty} data-testid="button-save-person" icon={<Save className="h-4 w-4" />}>{update.isPending ? "Saving" : "Save"}</Button>
      </div>
    </div>
  );
}

export { fmtDate };
