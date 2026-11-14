import type { ReactNode } from 'react';
import { ArrowLeft, CalendarDays, MapPin, Share2 } from 'lucide-react';
import { GlassCard } from '../components/afterglow/glass-card';
import { Button } from '../components/afterglow/button';
import { TextField } from '../components/afterglow/text-field';
import { Sticker } from '../components/afterglow/sticker';
import { Guidelines } from './parts';

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <GlassCard as="section" className="space-y-3">
      <h3>{title}</h3>
      {children}
    </GlassCard>
  );
}

const VOICE_PAIRS = [
  { prefer: "You're in 🎉", avoid: 'Your response has been recorded.' },
  { prefer: "Who's coming?", avoid: 'View attendee list' },
  { prefer: 'Send the invite', avoid: 'Please submit your response' },
  { prefer: 'That number looks short.', avoid: 'Invalid input!!!' },
];

export function VoicePage() {
  return (
    <div className="space-y-6">
      <Panel title="Write like a friend texting">
        <p>Short, casual, sentence case. Verbs on buttons, ideally first person: “I'm going”, “Count me in”, “Share invite”.</p>
        <div className="grid gap-2">
          {VOICE_PAIRS.map((p) => (
            <div key={p.prefer} className="grid gap-2 text-sm sm:grid-cols-2">
              <span className="rounded-md bg-zap p-3 font-semibold text-on-bright">{p.prefer}</span>
              <span className="rounded-md border border-line p-3 text-ink-muted line-through">{p.avoid}</span>
            </div>
          ))}
        </div>
      </Panel>
      <Guidelines
        items={[
          { kind: 'do', text: 'Use emoji as punctuation: at most one per line, always beside a text label.' },
          { kind: 'do', text: 'Use a flourish (Instrument Serif italic) for one or two words inside a display line.' },
          { kind: 'dont', text: 'No ALL CAPS paragraphs, corporate phrasing, or exclamation-mark pileups.' },
          { kind: 'dont', text: 'Never ship an emoji-only label or button.' },
        ]}
      />
    </div>
  );
}

export function IconographyPage() {
  return (
    <div className="space-y-6">
      <Panel title="Emoji do the expressive work">
        <p>There is no bespoke icon set. For utility icons (back, share, calendar, location) use a rounded 2px-stroke line set such as Lucide, drawn in currentColor.</p>
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" icon={<ArrowLeft className="h-4 w-4" />}>Back</Button>
          <Button variant="secondary" icon={<CalendarDays className="h-4 w-4" />}>Add to calendar</Button>
          <Button variant="secondary" icon={<MapPin className="h-4 w-4" />}>Directions</Button>
          <Button variant="zap" icon={<Share2 className="h-4 w-4" />}>Share invite</Button>
        </div>
      </Panel>
    </div>
  );
}

export function HierarchyPage() {
  return (
    <div className="space-y-6">
      <Panel title="The cover is the palette">
        <p>The hero of a screen is a solid neon block. Everything around it is glass. One block is clearly the biggest.</p>
        <div className="grid gap-3 md:grid-cols-3">
          <GlassCard tone="pop" slab className="md:col-span-2 md:row-span-2"><h3>Big pop block</h3><p>The poster, the stat, the “you're in” moment.</p></GlassCard>
          <GlassCard tone="zap" compact><p>Zap satellite</p></GlassCard>
          <GlassCard tone="sun" compact><p>Sun satellite</p></GlassCard>
        </div>
      </Panel>
      <Guidelines
        items={[
          { kind: 'do', text: 'One pop primary button per view; at most two neon buttons side by side.' },
          { kind: 'do', text: 'Screens get space-6 side margins, cards space-6 padding, sections space-8 apart.' },
          { kind: 'dont', text: "Don't nest glass inside glass more than once; use glass-strong or bg-raised for the inner layer." },
        ]}
      />
    </div>
  );
}

export function InteractionStatesPage() {
  return (
    <div className="space-y-6">
      <Panel title="States">
        <div className="flex flex-wrap items-center gap-3">
          <Button>Rest</Button>
          <Button disabled>Disabled</Button>
          <Button loading>Loading</Button>
          <Sticker tone="sun">Selected</Sticker>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <TextField label="Event name" placeholder="Rooftop szn" hint="Tab here to see the 3px focus ring." />
          <TextField label="Phone" defaultValue="555" error="That number looks short." />
        </div>
      </Panel>
      <Guidelines
        items={[
          { kind: 'do', text: 'Keyboard focus: 3px solid focus color (zap at night, pop-ink by day) with a 3px offset.' },
          { kind: 'do', text: 'Disabled is 45% opacity with no lift, glow, or press.' },
          { kind: 'dont', text: 'Never rely on color alone: selected RSVP options also scale and set aria-checked.' },
        ]}
      />
    </div>
  );
}

export function MotionPage() {
  return (
    <div className="space-y-6">
      <Panel title="Motion that bounces">
        <ul className="list-disc space-y-1 pl-5 text-sm">
          <li><strong>--ag-ease-bounce</strong> cubic-bezier(.34,1.56,.64,1) for presses, selection, stickers landing.</li>
          <li><strong>--ag-ease-out</strong> cubic-bezier(.22,1,.36,1) for sheets and fades.</li>
          <li>120ms on press (scale .96), 220ms on select (scale 1.04 + emoji wiggle), 360ms on enter.</li>
          <li>Reduced motion: drop the scale and wiggle, keep the color change.</li>
        </ul>
        <div className="flex gap-3"><Button>Press me</Button><Button variant="secondary">And me</Button></div>
      </Panel>
    </div>
  );
}

export function ProvenancePage() {
  return (
    <div className="space-y-6">
      <Panel title="Source">
        <p>This system is the user-uploaded Afterglow design system (tokens.json, README, component bundle and family READMEs), retained verbatim in docs/references/uploaded-system/. It supersedes the earlier proposal entirely.</p>
        <p>The seven source families (Button, RsvpPicker, GlassCard, EventCard, AvatarStack, Sticker, TextField) are reauthored as typed React modules in src/components/afterglow; the uploaded global bundle is never executed. The shadcn modules in src/components/ui are compatibility controls themed from the same tokens.</p>
      </Panel>
    </div>
  );
}
