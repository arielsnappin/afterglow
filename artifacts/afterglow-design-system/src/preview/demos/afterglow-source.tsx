import { useState } from 'react';
import { Button } from '../../components/afterglow/button';
import { GlassCard } from '../../components/afterglow/glass-card';
import { Sticker } from '../../components/afterglow/sticker';
import { AvatarStack } from '../../components/afterglow/avatar-stack';
import { TextField } from '../../components/afterglow/text-field';
import { RsvpPicker } from '../../components/afterglow/rsvp-picker';
import { EventCard } from '../../components/afterglow/event-card';
import { Row, Stack } from '../parts';

export function SourceButtonDemo() {
  return (
    <Stack>
      <Row label="Variants"><Button>I'm going 🎉</Button><Button variant="secondary">Share invite</Button><Button variant="zap">Count me in</Button><Button variant="sun">Maybe</Button><Button variant="sky">Sky</Button><Button variant="grape">Grape</Button><Button variant="ghost">Not now</Button></Row>
      <Row label="Sizes"><Button size="sm">Small</Button><Button>Medium</Button><Button size="lg">Large</Button></Row>
      <Row label="States (tab for focus)"><Button disabled>Disabled</Button><Button loading>Saving</Button></Row>
    </Stack>
  );
}

export function SourceRsvpDemo() {
  const [v, setV] = useState<string | undefined>('going');
  return (
    <Stack>
      <Row label="Selected (arrow keys move)"><RsvpPicker value={v} onChange={setV} /></Row>
      <Row label="Disabled"><RsvpPicker value="maybe" disabled /></Row>
    </Stack>
  );
}

export function SourceGlassCardDemo() {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <GlassCard><h3>Glass</h3><p>Default frosted panel.</p></GlassCard>
      <GlassCard compact><h3>Compact</h3><p>Tighter padding.</p></GlassCard>
      <GlassCard tone="pop" slab><h3>Pop slab</h3><p>The hero block.</p></GlassCard>
      <GlassCard tone="zap"><h3>Zap</h3><p>Success satellite.</p></GlassCard>
    </div>
  );
}

export function SourceEventCardDemo() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <EventCard title="Rooftop szn" date="Sat, Jun 14" time="7pm" location="Pier 9 roof" host="Mika" emoji="🔥" sticker="Tonight" going={[{ name: 'Jo Park' }, { name: 'Sam Lee' }]}>
        <Button size="sm">I'm going</Button>
      </EventCard>
      <EventCard tone="sky" title="Sunday picnic" date="Sun, Jun 15" emoji="☀️" />
    </div>
  );
}

export function SourceAvatarStackDemo() {
  return (
    <Stack>
      <AvatarStack people={[{ name: 'Mika Rao' }, { name: 'Jo Park' }, { name: 'Sam Lee' }]} caption="3 going" />
      <AvatarStack size="sm" people={[{ name: 'A B' }, { name: 'C D' }, { name: 'E F' }, { name: 'G H' }, { name: 'I J' }]} max={3} total={12} caption="12 going" />
    </Stack>
  );
}

export function SourceStickerDemo() {
  return <Row label="Tones"><Sticker tone="zap">Going</Sticker><Sticker tone="sun" tilt={6}>Maybe 🤔</Sticker><Sticker tone="pop">New</Sticker></Row>;
}

export function SourceTextFieldDemo() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <TextField label="Event name" placeholder="Rooftop szn" hint="Tab here for focus ring." />
      <TextField label="Phone" defaultValue="555" error="That number looks short." />
      <TextField label="Disabled" disabled defaultValue="Locked" />
      <TextField multiline label="Notes" rows={3} placeholder="Bring snacks" />
    </div>
  );
}
