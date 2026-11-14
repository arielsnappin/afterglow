import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, ArrowRight, CalendarDays, Compass, FileSpreadsheet, Plug, Plus, RotateCw, Save, Send, Sparkles, Ticket, Users, X } from "lucide-react";
import { SiGooglecalendar, SiPinterest } from "react-icons/si";
import { useGetWorkspace, useUpdatePreferences } from "@workspace/api-client-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@workspace/afterglow-design-system/components/ui/dialog";
import { Progress } from "@workspace/afterglow-design-system/components/ui/progress";
import { Skeleton } from "@workspace/afterglow-design-system/components/ui/skeleton";
import { Button } from "@workspace/afterglow-design-system/components/afterglow/button";
import { TextField } from "@workspace/afterglow-design-system/components/afterglow/text-field";
import { cn } from "@workspace/afterglow-design-system/lib/utils";
import { GlassCard } from "@workspace/afterglow-design-system/components/afterglow/glass-card";
import { Sticker } from "@workspace/afterglow-design-system/components/afterglow/sticker";
import { ConnectionLadder, DraftPreview, Rise, StepHero } from "./tour-visuals";
import { useInvalidateAll } from "@/lib/afterglow";
import {
  draftDiffers, loadTour, MAX_TOPIC_LEN, MAX_TOPICS, saveTour, TOUR_STEPS, validateProfile,
  type ProfileDraft, type TourState,
} from "./tour-state";

type Pending = { kind: "next" } | { kind: "skip" } | { kind: "nav"; href: string; complete: boolean } | null;

const STEP_TITLES = ["Welcome to Afterglow", "Your profile: goals and topics", "Integrations", "How follow-ups work"];

const visible = (el: HTMLElement | null | undefined): el is HTMLElement =>
  !!el && el.isConnected && el.getClientRects().length > 0 && !el.closest("[aria-hidden='true'],[inert]");

/**
 * Tour state lives in the shell: the profile draft and the save mutation survive the dialog
 * closing or a step unmounting, so callbacks are never lost mid-save.
 */
export function useOnboardingTour() {
  const [loc] = useLocation();
  const ws = useGetWorkspace();
  const invalidate = useInvalidateAll();
  const mutation = useUpdatePreferences();
  const [state, setState] = useState<TourState>(loadTour);
  const [open, setOpenRaw] = useState(false);
  const [draft, setDraft] = useState<ProfileDraft | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const opener = useRef<HTMLElement | null>(null);
  const restoreOnClose = useRef(true);
  const desktopLauncher = useRef<HTMLButtonElement | null>(null);
  const mobileLauncher = useRef<HTMLButtonElement | null>(null);
  const autoChecked = useRef(false);
  const saved = ws.data?.preferences;
  const dirty = draftDiffers(draft, saved);

  const update = (s: TourState) => { setState(s); saveTour(s); };
  const markSeen = (s: TourState) => { if (s.status === "new") update({ status: "dismissed", step: s.step }); };

  const openTour = () => {
    const a = document.activeElement;
    opener.current = a instanceof HTMLElement && a !== document.body ? a : null;
    markSeen(state);
    setOpenRaw(true);
  };

  const restoreFocus = () => {
    // Called by Radix after the closing content unmounts, not when its exit
    // animation starts (background launchers are still aria-hidden then).
    window.setTimeout(() => {
      if (restoreOnClose.current) {
        const target = [opener.current, desktopLauncher.current, mobileLauncher.current].find(visible);
        target?.focus();
      }
      opener.current = null;
    }, 0);
  };

  /** Returns false when closing is blocked (save in flight). */
  const closeTour = (opts: { restore?: boolean } = {}) => {
    if (saving) return false;
    // An unmodified draft is a stale snapshot; drop it so reopening reads the latest saved profile.
    if (!dirty) setDraft(null);
    restoreOnClose.current = opts.restore !== false;
    setOpenRaw(false);
    return true;
  };

  useEffect(() => {
    if (autoChecked.current) return;
    autoChecked.current = true;
    // Auto-open once for a fresh browser, only on Home (never over deep-linked screens).
    if (state.status === "new" && loc === "/") {
      opener.current = null;
      markSeen(state);
      setOpenRaw(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Warn before a reload or tab close would lose unsaved goal/topic edits.
  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ""; };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  const saveProfile = async (data: { goal: string; interests: string[] }) => {
    if (saving) return false;
    setSaving(true);
    setSaveError(false);
    try {
      await mutation.mutateAsync({ data });
    } catch {
      setSaveError(true); // draft stays intact for retry
      setSaving(false);
      return false;
    }
    // The write succeeded: clear the draft and advance. A refresh hiccup is not a save failure.
    setDraft(null);
    setSaving(false);
    update({ status: state.status === "completed" ? "completed" : "dismissed", step: 2 });
    try { await invalidate(); } catch { /* refetch will retry on next view */ }
    return true;
  };

  return {
    ws, state, update, open, openTour, closeTour, draft, setDraft, dirty, saving, saveError, setSaveError, saveProfile,
    desktopLauncher, mobileLauncher, restoreFocus,
  };
}
export type TourController = ReturnType<typeof useOnboardingTour>;

export function TourLauncher({ tour, compact = false, mobile = false }: { tour: TourController; compact?: boolean; mobile?: boolean }) {
  const label = tour.state.status === "completed" ? "Quick tour" : tour.state.step > 0 ? "Resume tour" : "Get started";
  return (
    <Button ref={mobile ? tour.mobileLauncher : tour.desktopLauncher} variant="secondary" size="sm" onClick={tour.openTour} aria-label={label} title={compact ? label : undefined}
      data-testid={mobile ? "button-open-tour-mobile" : "button-open-tour"} icon={<Compass className="h-4 w-4" />}>
      <span className={cn(compact && "sr-only", mobile && "sr-only sm:not-sr-only")}>{label}</span>
    </Button>
  );
}

export function OnboardingDialog({ tour }: { tour: TourController }) {
  const [, navigate] = useLocation();
  const { state, update, open, closeTour, setDraft, dirty, saving } = tour;
  const step = state.step;
  const [pending, setPending] = useState<Pending>(null);

  const go = (n: number) => { if (saving) return; setPending(null); update({ status: state.status === "completed" ? "completed" : "dismissed", step: Math.max(0, Math.min(TOUR_STEPS - 1, n)) }); };
  const finish = () => {
    if (saving) return;
    setPending(null);
    update({ status: "completed", step: 0 });
    closeTour();
  };
  const leaveTo = (href: string, complete: boolean) => {
    if (saving) return;
    setPending(null);
    if (complete) update({ status: "completed", step: 0 });
    if (closeTour({ restore: false })) navigate(href);
  };
  const requestClose = () => {
    if (saving) return;
    setPending(null);
    closeTour(); // dirty drafts are kept for this session; clean ones are dropped
  };

  const onNext = () => {
    if (saving) return;
    if (step === 1 && dirty) return setPending({ kind: "next" });
    if (step === TOUR_STEPS - 1) return finish();
    go(step + 1);
  };
  const onSkipTour = () => {
    if (saving) return;
    if (dirty) return setPending({ kind: "skip" });
    requestClose();
  };
  const onNav = (href: string, complete: boolean) => {
    if (saving) return;
    if (dirty) return setPending({ kind: "nav", href, complete });
    leaveTo(href, complete);
  };
  const confirmDiscard = () => {
    const p = pending;
    setDraft(null);
    tour.setSaveError(false);
    setPending(null);
    if (!p) return;
    if (p.kind === "next") go(step + 1);
    else if (p.kind === "skip") requestClose();
    else leaveTo(p.href, p.complete);
  };
  const block = (e: Event) => { if (saving) e.preventDefault(); };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) requestClose(); }}>
      <DialogContent className="flex max-w-xl flex-col gap-0 overflow-hidden p-0" data-testid="dialog-onboarding" aria-busy={saving}
        onEscapeKeyDown={block} onPointerDownOutside={block} onInteractOutside={block} onCloseAutoFocus={(e) => { e.preventDefault(); tour.restoreFocus(); }}>
        <DialogHeader className="shrink-0 border-b border-line px-6 pb-4 pt-6 text-left">
          <div className="flex items-center gap-2"><div className="type-label text-pop-ink" data-testid="text-tour-step">Step {step + 1} of {TOUR_STEPS}</div><Sticker tone="grape" tilt={3}>Your space</Sticker></div>
          <DialogTitle className="pr-8">{STEP_TITLES[step]}</DialogTitle>
          <DialogDescription className="text-ink-muted">A short tour of how Afterglow turns shared events into thoughtful outreach. Fictional demo data only.</DialogDescription>
          <Progress value={((step + 1) / TOUR_STEPS) * 100} aria-label={`Tour progress, step ${step + 1} of ${TOUR_STEPS}`} className="mt-2 h-1.5" />
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          <div key={step}>
            {step === 0 && <WelcomeStep />}
            {step === 1 && <ProfileStep tour={tour} />}
            {step === 2 && <IntegrationsStep onOpen={() => onNav("/integrations", false)} />}
            {step === 3 && <FollowUpsStep onGo={() => onNav("/follow-ups", true)} />}
          </div>
          {pending && (
            <div role="alert" className="mt-4 rounded-md border border-danger bg-glass p-3 text-sm animate-in fade-in-0 slide-in-from-bottom-2 ease-standard motion-reduce:animate-none" data-testid="panel-confirm-discard">
              <p className="font-semibold">Discard your unsaved goal and topics?</p>
              <p className="mt-1 text-ink-muted">Your saved profile stays exactly as it is.</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button size="sm" variant="secondary" onClick={confirmDiscard} data-testid="button-confirm-discard">Discard edits</Button>
                <Button size="sm" variant="ghost" onClick={() => setPending(null)} data-testid="button-keep-editing">Keep editing</Button>
              </div>
            </div>
          )}
        </div>

        <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-line bg-bg-raised px-6 py-4">
          <Button variant="ghost" size="sm" onClick={onSkipTour} disabled={saving} data-testid="button-skip-tour">Skip tour</Button>
          <div className="flex flex-wrap gap-2">
            {step > 0 && <Button variant="ghost" size="sm" onClick={() => go(step - 1)} disabled={saving} data-testid="button-tour-back" icon={<ArrowLeft className="h-4 w-4" />}>Back</Button>}
            <Button size="sm" variant={step === 1 ? "secondary" : "primary"} onClick={onNext} disabled={saving} data-testid="button-tour-next" icon={step === TOUR_STEPS - 1 ? undefined : <ArrowRight className="h-4 w-4" />}>
              {step === TOUR_STEPS - 1 ? "Finish tour" : step === 1 ? (dirty ? "Continue without saving" : "Skip step") : "Next"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Row({ icon, title, children, i = 0 }: { icon: ReactNode; title: string; children: ReactNode; i?: number }) {
  return (
    <Rise as="li" i={i}><GlassCard compact className="flex gap-3">
      <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-glass-strong text-pop-ink" aria-hidden="true">{icon}</span>
      <div className="min-w-0"><div className="font-semibold">{title}</div><div className="text-sm text-ink-muted">{children}</div></div>
    </GlassCard></Rise>
  );
}

function WelcomeStep() {
  return (
    <div className="space-y-4">
      <StepHero tone="pop" kicker="After the lights come up" flourish="Keep the glow going.">A personal space for the people you shared a room with.</StepHero>
      <p className="text-sm">Afterglow is a personal CRM built around events you attended. It is not a sales pipeline or a calendar manager: it helps you remember who you shared a room with and reach out thoughtfully.</p>
      <ul className="space-y-2">
        <Row icon={<CalendarDays className="h-4 w-4" />} title="Events" i={1}>Context gathered from your sources: what happened and where you crossed paths with people. Being at the same event is not the same as meeting.</Row>
        <Row icon={<Users className="h-4 w-4" />} title="People" i={2}>A table of relationship history: met or not, notes, status and next action.</Row>
        <Row icon={<Send className="h-4 w-4" />} title="Follow-ups" i={3}>Warm suggestions ranked by your goals, open promises and due dates.</Row>
      </ul>
      <Rise i={4}><ConnectionLadder /></Rise>
    </div>
  );
}


function ProfileStep({ tour }: { tour: TourController }) {
  const { ws, draft, setDraft, saving, saveError, saveProfile } = tour;
  const [touched, setTouched] = useState(false);
  const [note, setNote] = useState("");
  const saved = ws.data?.preferences;

  // Seed the draft from saved preferences once; reopening or stepping never overwrites a live draft.
  useEffect(() => {
    if (!draft && saved) setDraft({ goal: saved.goal, interests: saved.interests, entry: "" });
  }, [draft, saved, setDraft]);

  if (ws.isLoading) return <div className="space-y-3" aria-busy="true" aria-label="Loading profile"><Skeleton className="h-24 w-full rounded-lg" /><Skeleton className="h-10 w-2/3 rounded-full" /></div>;
  if (ws.isError || !saved) return (
    <div role="alert" className="space-y-3 text-sm">
      <p>Couldn't load your saved goal and topics. Nothing was changed.</p>
      <Button size="sm" variant="secondary" onClick={() => ws.refetch()} data-testid="button-tour-retry-profile" icon={<RotateCw className="h-4 w-4" />}>Try again</Button>
    </div>
  );
  const d = draft ?? { goal: saved.goal, interests: saved.interests, entry: "" };
  const set = (patch: Partial<ProfileDraft>) => { if (!saving) setDraft({ ...d, ...patch }); };
  const check = validateProfile(d);
  const errs: { goalError?: string; topicError?: string } = check.ok ? {} : check;
  const changed = draftDiffers(d, saved);

  const add = () => {
    const v = d.entry.trim();
    if (!v) return;
    if (v.length > MAX_TOPIC_LEN) { setNote(`Topics can be up to ${MAX_TOPIC_LEN} characters. Shorten it to add.`); return; }
    if (d.interests.some((i) => i.toLowerCase() === v.toLowerCase())) { setNote(`"${v}" is already a topic.`); set({ entry: "" }); return; }
    if (d.interests.length >= MAX_TOPICS) { setNote(`You have ${MAX_TOPICS} topics. Remove one before adding more.`); return; }
    setNote("");
    set({ interests: [...d.interests, v], entry: "" });
  };
  const onKey = (e: KeyboardEvent) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); add(); } };
  const save = () => {
    setTouched(true);
    if (!check.ok || saving) return;
    setNote("");
    void saveProfile({ goal: check.goal, interests: check.interests });
  };

  return (
    <div className="space-y-4">
      <StepHero tone="zap" kicker="Your compass" flourish="What lights you up?">Suggestions lean toward these words.</StepHero>
      <p className="text-sm text-ink-muted">Profile here means what you hope to find at events, not an account. There is no sign-in, and Afterglow never asks for your name or email. Use fictional words only.</p>
      <TextField multiline rows={3} maxLength={500} label="What you're looking for" value={d.goal} onChange={(e) => set({ goal: e.target.value })} disabled={saving}
        onBlur={() => setTouched(true)} data-testid="input-tour-goal" error={touched ? errs.goalError : undefined} hint="For example: meet founders working on community pricing." />
      <div className="space-y-2">
        <div className="type-label">Topics you care about · {d.interests.length}/{MAX_TOPICS}</div>
        {d.interests.length > 0 && (
          <ul className="flex flex-wrap gap-2" aria-label="Topics">
            {d.interests.map((i) => (
              <li key={i} className="inline-flex items-center gap-1 rounded-full border border-line bg-glass-strong py-1 pl-3 pr-1 text-sm font-semibold animate-in fade-in-0 zoom-in-95 ease-standard motion-reduce:animate-none">
                {i}
                <Button variant="ghost" size="sm" disabled={saving} onClick={() => set({ interests: d.interests.filter((x) => x !== i) })} aria-label={`Remove ${i}`} data-testid={`button-tour-remove-interest-${i}`} icon={<X className="h-3 w-3" />} />
              </li>
            ))}
          </ul>
        )}
        <div className="flex items-end gap-2">
          <TextField className="min-w-0 flex-1" aria-label="Add a topic" value={d.entry} onChange={(e) => set({ entry: e.target.value })} onKeyDown={onKey} disabled={saving}
            placeholder="Community pricing" hint="Press Enter or comma to add. A typed topic is also included when you save."
            error={touched ? errs.topicError : undefined} data-testid="input-tour-interest" />
          <Button variant="secondary" className="mb-6" onClick={add} disabled={saving} aria-label="Add topic" data-testid="button-tour-add-interest" icon={<Plus className="h-4 w-4" />}>Add</Button>
        </div>
        {note && <p className="text-xs" aria-live="polite" data-testid="text-tour-interest-note">{note}</p>}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={save} loading={saving} disabled={saving || !changed} data-testid="button-tour-save-profile" icon={<Save className="h-4 w-4" />}>
          {saving ? "Saving" : "Save and continue"}
        </Button>
        <span className="text-xs text-ink-muted" aria-live="polite">{saving ? "Saving your goal and topics." : changed ? "Unsaved. Nothing is saved until you choose Save." : "Matches your saved profile."}</span>
      </div>
      {saveError && !saving && (
        <div role="alert" className="flex flex-wrap items-center gap-2 rounded-md border border-danger px-3 py-2 text-sm text-danger" data-testid="text-tour-save-error">
          Couldn't save. Your edits are still here and nothing was changed.
          <Button size="sm" variant="secondary" onClick={save} data-testid="button-tour-retry-save">Retry</Button>
        </div>
      )}
    </div>
  );
}

function IntegrationsStep({ onOpen }: { onOpen: () => void }) {
  return (
    <div className="space-y-4">
      <StepHero tone="sky" kicker="Simulation only" flourish="Bring the context in.">Nothing here touches a real account.</StepHero>
      <p className="text-sm">Integrations bring event context into Afterglow. In this demo, nothing connects to a real account and no sign-in is requested.</p>
      <div>
        <div className="mb-2 flex items-center gap-2"><span className="type-label text-pop-ink">Works today</span><Sticker tone="zap" tilt={-2}>Simulated</Sticker></div>
        <ul className="space-y-2">
          <Row icon={<Sparkles className="h-4 w-4" />} title="Luma (simulation)" i={1}>Bundled fictional events and guests. Never contacts Luma.</Row>
          <Row icon={<FileSpreadsheet className="h-4 w-4" />} title="CSV sample" i={2}>Import the bundled synthetic file. Other files are rejected.</Row>
        </ul>
      </div>
      <div>
        <div className="type-label mb-2 text-ink-muted">Planned, not available</div>
        <ul className="flex flex-wrap gap-2 text-sm text-ink-muted">
          <li className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-line px-3 py-1"><SiGooglecalendar className="h-3.5 w-3.5" aria-hidden="true" />Google Calendar</li>
          <li className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-line px-3 py-1"><Ticket className="h-3.5 w-3.5" aria-hidden="true" />Eventbrite</li>
          <li className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-line px-3 py-1"><SiPinterest className="h-3.5 w-3.5" aria-hidden="true" />Pinterest</li>
        </ul>
      </div>
      <p className="text-xs text-ink-muted">Importing is always your choice: you preview first, then confirm. You can pick up where you left off with Resume tour in navigation.</p>
      <Button variant="secondary" size="sm" onClick={onOpen} data-testid="button-tour-open-integrations" icon={<Plug className="h-4 w-4" />}>Open Integrations</Button>
    </div>
  );
}

function FollowUpsStep({ onGo }: { onGo: () => void }) {
  const steps = [
    ["Shared attendance is not a meeting", "Confirmed co-attendance means you were in the same event. Mark someone as met only when you actually spoke."],
    ["Review the note", "Check what you talked about and any promise you made."],
    ["Draft from a template", "Start from the suggested draft, then edit and copy it yourself. Afterglow never sends messages."],
    ["Track the outcome", "Mark contacted or replied, and set the next action and date."],
  ];
  return (
    <div className="space-y-4">
      <StepHero tone="sun" kicker="Thoughtful, not automated" flourish="Reach out like a person.">You write, you send, you decide.</StepHero>
      <ol className="space-y-2">
        {steps.map(([t, b], i) => (
          <Rise as="li" i={i + 1} key={t}><GlassCard compact className="flex gap-3">
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-pop text-xs font-bold text-on-bright" aria-hidden="true">{i + 1}</span>
            <div><div className="font-semibold">{t}</div><div className="text-sm text-ink-muted">{b}</div></div>
          </GlassCard></Rise>
        ))}
      </ol>
      <Rise i={5}><DraftPreview /></Rise>
      <p className="text-sm text-ink-muted">People keeps each relationship's history; Events keeps the context of where you crossed paths.</p>
      <Button size="sm" onClick={onGo} data-testid="button-tour-go-follow-ups" icon={<Send className="h-4 w-4" />}>Go to Follow-ups</Button>
    </div>
  );
}
