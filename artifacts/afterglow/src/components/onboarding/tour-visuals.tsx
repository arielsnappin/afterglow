import type { CSSProperties, ReactNode } from "react";
import { GlassCard } from "@workspace/afterglow-design-system/components/afterglow/glass-card";
import { Sticker } from "@workspace/afterglow-design-system/components/afterglow/sticker";
import { AvatarStack } from "@workspace/afterglow-design-system/components/afterglow/avatar-stack";
import type { Tone } from "@workspace/afterglow-design-system/components/afterglow/tone";
import { cn } from "@workspace/afterglow-design-system/lib/utils";

/** Staggered entrance using DS motion tokens; fully disabled for reduced motion. */
export function Rise({ i = 0, className, children, as: As = "div" }: { i?: number; className?: string; children: ReactNode; as?: "div" | "li" }) {
  const style: CSSProperties = { animationDelay: `calc(var(--motion-duration-fast) * ${i})`, animationDuration: "var(--motion-duration-slow)" };
  return (
    <As style={style} className={cn("animate-in fade-in-0 slide-in-from-bottom-2 fill-mode-both ease-standard motion-reduce:animate-none", className)}>
      {children}
    </As>
  );
}

/** Dashed frame + sticker marks content as a fictional illustration, never a real record. */
export function ExampleFrame({ label = "Fictional example", children, className }: { label?: string; children: ReactNode; className?: string }) {
  return (
    <figure className={cn("relative rounded-lg border border-dashed border-line p-4 pt-5", className)} aria-label={label}>
      <Sticker tone="sky" tilt={-3} className="absolute -top-3 left-4">{label}</Sticker>
      {children}
    </figure>
  );
}

export function StepHero({ kicker, flourish, tone, children }: { kicker: string; flourish: string; tone: Tone; children?: ReactNode }) {
  return (
    <Rise>
      <GlassCard tone={tone} slab className="relative overflow-hidden">
        <div className="type-caption uppercase">{kicker}</div>
        <div className="type-flourish mt-1">{flourish}</div>
        {children && <div className="mt-2 type-label">{children}</div>}
      </GlassCard>
    </Rise>
  );
}

/** Three distinct relationship states, shown on a fictional event. */
export function ConnectionLadder() {
  const rungs: { tone: Tone; tag: string; title: string; body: string }[] = [
    { tone: "grape", tag: "Registered", title: "Signed up", body: "A guest list entry. Says nothing about who showed up." },
    { tone: "sun", tag: "Attended", title: "Same room", body: "Confirmed co-attendance. Still not a meeting." },
    { tone: "pop", tag: "Met", title: "You spoke", body: "Only you mark this, when a conversation actually happened." },
  ];
  return (
    <ExampleFrame>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="type-label">Riverside Builders Night</div>
          <div className="type-caption text-ink-muted">Made-up event, made-up guests</div>
        </div>
        <AvatarStack size="sm" people={[{ name: "Ada Quill" }, { name: "Remy Vale" }, { name: "Juno Park" }, { name: "Odile Ash" }]} total={18} caption="18 attended" />
      </div>
      <ol className="mt-4 grid gap-2 sm:grid-cols-3">
        {rungs.map((r, i) => (
          <Rise as="li" i={i + 1} key={r.tag}>
            <GlassCard compact className="h-full">
              <Sticker tone={r.tone} tilt={i % 2 ? 3 : -3}>{r.tag}</Sticker>
              <div className="mt-2 font-semibold">{r.title}</div>
              <div className="text-sm text-ink-muted">{r.body}</div>
            </GlassCard>
          </Rise>
        ))}
      </ol>
    </ExampleFrame>
  );
}

/** Mock suggestion card. Draft only, clearly never sent. */
export function DraftPreview() {
  return (
    <ExampleFrame label="Fictional draft">
      <div className="flex items-center gap-3">
        <AvatarStack size="sm" people={[{ name: "Remy Vale", tone: "zap" }]} />
        <div className="min-w-0">
          <div className="type-label">Remy Vale</div>
          <div className="type-caption text-ink-muted">Met at Riverside Builders Night. Promised a pricing article.</div>
        </div>
      </div>
      <p className="mt-3 rounded-md border border-line bg-glass p-3 text-sm italic text-ink-muted">
        "Great talking about community pricing on Thursday. Here's the article I mentioned..."
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Sticker tone="sun" tilt={-2}>Draft</Sticker>
        <span className="type-caption text-ink-muted">Not sent. You copy and send it yourself.</span>
      </div>
    </ExampleFrame>
  );
}
