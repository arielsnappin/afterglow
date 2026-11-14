import { useState, type KeyboardEvent } from "react";
import { X, Plus, Save, ArrowRight, Undo2, UserPlus } from "lucide-react";
import { useGetWorkspace, useUpdatePreferences, type Workspace } from "@workspace/api-client-react";
import { Button } from "@workspace/afterglow-design-system/components/afterglow/button";
import { TextField } from "@workspace/afterglow-design-system/components/afterglow/text-field";
import { useToast } from "@workspace/afterglow-design-system/hooks/use-toast";
import { PageHeader } from "@/components/shell";
import { Face, LoadingBlock, ErrorBlock, Empty, Panel } from "@/components/bits";
import { compareRankings, eventsById, interestsToAdd, moreLikeCandidates, useInvalidateAll, workspaceToday } from "@/lib/afterglow";

export default function SettingsPage() {
  const ws = useGetWorkspace();
  if (ws.isLoading) return <LoadingBlock rows={2} />;
  if (ws.isError || !ws.data) return <ErrorBlock onRetry={() => ws.refetch()} />;
  return <Editor ws={ws.data} />;
}

function Editor({ ws }: { ws: Workspace }) {
  const { toast } = useToast();
  const invalidate = useInvalidateAll();
  const update = useUpdatePreferences();
  const [goal, setGoal] = useState(ws.preferences.goal);
  const [interests, setInterests] = useState(ws.preferences.interests);
  const [draft, setDraft] = useState("");
  const [likeNote, setLikeNote] = useState("");
  const dirty = goal !== ws.preferences.goal || interests.join("|") !== ws.preferences.interests.join("|");
  const today = workspaceToday(ws);
  const cmp = compareRankings(ws.people, ws.preferences, { goal, interests }, today);
  const examples = moreLikeCandidates(ws.people);
  const evs = eventsById(ws.events);
  const top = cmp.after[0];

  const add = () => {
    const v = draft.trim();
    if (!v || interests.length >= 20 || interests.some((i) => i.toLowerCase() === v.toLowerCase())) return setDraft("");
    setInterests([...interests, v.slice(0, 80)]);
    setDraft("");
  };
  const onKey = (e: KeyboardEvent) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); add(); } };
  const moreLike = (id: string) => {
    const p = ws.people.find((x) => x.id === id);
    if (!p) return;
    const next = interestsToAdd(interests, p);
    if (next.length === interests.length) { setLikeNote(interests.length >= 20 ? "Your topics are full. Remove a topic before adding more." : `Your interests already include everything recorded for ${p.name}.`); return; }
    setInterests(next);
    setLikeNote(`Added ${p.name}'s recorded interests as unsaved edits. Review them, then save or undo.`);
  };
  const undo = () => { setGoal(ws.preferences.goal); setInterests(ws.preferences.interests); setLikeNote(""); };
  const save = () => update.mutate({ data: { goal: goal.trim(), interests } }, {
    onSuccess: async () => { await invalidate(); setLikeNote(""); toast({ title: "Profile saved", description: "Warm follow-ups now reflect your updated preferences." }); },
    onError: () => toast({ title: "Couldn't save", description: "Nothing was changed. Try again.", variant: "destructive" }),
  });

  return (
    <div>
      <PageHeader eyebrow="Profile" title="What do you want from events?" />
      <p className="-mt-4 mb-6 max-w-2xl text-sm text-ink-muted">Tell Afterglow what you're hoping to find. It uses these words to decide who's worth reaching out to first.</p>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <Panel className="space-y-6">
          <TextField multiline label="What you're looking for" data-testid="input-goal" rows={3} maxLength={500} value={goal} onChange={(e) => setGoal(e.target.value)}
            hint="For example: meet founders working on community pricing, or find a design mentor. Demo only, don't enter personal data."
            error={!goal.trim() ? "Add a sentence so suggestions have something to match." : undefined} />
          <div className="space-y-2">
            <div className="type-label">Topics you care about · {interests.length}/20</div>
            <ul className="flex flex-wrap gap-2" aria-label="Interests">
              {interests.map((i) => (
                <li key={i} className="inline-flex items-center gap-1 rounded-full border border-line bg-glass-strong py-1 pl-3 pr-1 text-sm font-semibold">
                  {i}
                  <Button variant="ghost" size="sm" onClick={() => setInterests(interests.filter((x) => x !== i))} aria-label={`Remove ${i}`} data-testid={`button-remove-interest-${i}`} icon={<X className="h-3 w-3" />} />
                </li>
              ))}
            </ul>
            <div className="flex items-end gap-2">
              <TextField className="min-w-0 flex-1" aria-label="Add an interest" data-testid="input-interest" value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={onKey} placeholder="Community pricing" hint="Press Enter or comma to add." />
              <Button variant="secondary" onClick={add} className="mb-6" aria-label="Add interest" data-testid="button-add-interest" icon={<Plus className="h-4 w-4" />}>Add</Button>
            </div>
          </div>

          <div className="space-y-2 border-t border-line pt-5">
            <h2 className="type-label">More people like...</h2>
            <p className="text-xs text-ink-muted">Copy the interests recorded for someone you attended with into your topics. Nothing is saved until you choose Save.</p>
            {examples.length === 0 ? <p className="text-sm italic text-ink-muted" data-testid="text-more-like-empty">No eligible people with recorded interests yet.</p> : (
              <div className="flex flex-wrap gap-2">
                {examples.map((p) => (
                  <Button key={p.id} variant="secondary" size="sm" onClick={() => moreLike(p.id)} data-testid={`button-more-like-${p.id}`} icon={<UserPlus className="h-3.5 w-3.5" />}>{p.name}</Button>
                ))}
              </div>
            )}
            {likeNote && <p className="text-xs" aria-live="polite" data-testid="text-more-like-note">{likeNote}</p>}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={save} loading={update.isPending} disabled={!dirty || !goal.trim()} data-testid="button-save-preferences" icon={<Save className="h-4 w-4" />}>{update.isPending ? "Saving" : "Save"}</Button>
            {dirty && <Button variant="ghost" onClick={undo} data-testid="button-undo-preferences" icon={<Undo2 className="h-4 w-4" />}>Undo changes</Button>}
            <span className="text-xs text-ink-muted" aria-live="polite">{dirty ? "Unsaved changes. The example on the right shows what would change." : "Saved."}</span>
          </div>
        </Panel>

        <Panel data-testid="panel-preferences-explainer">
          <h2 className="type-title">How your preferences shape follow-ups</h2>
          <ol className="mt-4 space-y-3 text-sm">
            <li className="rounded-md border border-line bg-glass p-3"><div className="type-label mb-1">1 · Your words</div>{[goal, ...interests].filter(Boolean).join(" · ").slice(0, 160) || "Add a goal to begin."}</li>
            <li className="flex justify-center text-ink-muted" aria-hidden="true"><ArrowRight className="h-4 w-4 rotate-90" /></li>
            <li className="rounded-md border border-line bg-glass p-3"><div className="type-label mb-1">2 · People you attended with</div>Only confirmed co-attendees are considered. Their recorded interests, role and bio are matched to your words, alongside open promises and due dates.</li>
            <li className="flex justify-center text-ink-muted" aria-hidden="true"><ArrowRight className="h-4 w-4 rotate-90" /></li>
            <li className="rounded-md border border-line bg-glass p-3">
              <div className="type-label mb-1">3 · Warm follow-ups</div>
              {top ? <div className="flex items-start gap-2"><Face p={top.person} size="sm" /><div><div className="font-semibold">{top.person.name}</div><div className="text-xs text-ink-muted">{top.reasons.slice(0, 2).join(" · ") || "Attended an event with you"}{top.person.sharedEventIds?.[0] && evs[top.person.sharedEventIds[0]] ? ` · ${evs[top.person.sharedEventIds[0]].title}` : ""}</div></div></div> : "No warm follow-ups yet."}
            </li>
          </ol>

          <div className="mt-6 border-t border-line pt-4" data-testid="panel-before-after">
            <h3 className="type-label mb-2">{dirty ? "Example with your unsaved edits" : "Your current order"}</h3>
            {cmp.after.length === 0 ? <Empty title="No warm follow-ups to order yet" /> : !dirty ? (
              <RankList items={cmp.after} />
            ) : !cmp.changed ? (
              <><p className="mb-2 text-sm text-ink-muted" data-testid="text-no-change">These edits don't change the order of your top follow-ups.</p><RankList items={cmp.after} /></>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                <div><div className="mb-1 text-xs font-semibold text-ink-muted">Saved now</div><RankList items={cmp.before} /></div>
                <div><div className="mb-1 text-xs font-semibold text-pop-ink">After saving</div><RankList items={cmp.after} /></div>
              </div>
            )}
          </div>
        </Panel>
      </div>
    </div>
  );
}

function RankList({ items }: { items: ReturnType<typeof compareRankings>["after"] }) {
  return (
    <ol className="space-y-2">
      {items.map((r, i) => (
        <li key={r.person.id} className="flex items-center gap-2 text-sm">
          <span className="w-4 text-xs font-bold text-ink-muted">{i + 1}</span>
          <Face p={r.person} size="sm" />
          <div className="min-w-0"><div className="truncate font-semibold">{r.person.name}</div>{r.matched.length > 0 && <div className="truncate text-xs text-pop-ink">{r.matched.slice(0, 3).join(", ")}</div>}</div>
        </li>
      ))}
    </ol>
  );
}
