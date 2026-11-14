import { tokens } from '../generated/tokens';
import { GlassCard } from '../components/afterglow/glass-card';
import { Button } from '../components/afterglow/button';
import { Sticker } from '../components/afterglow/sticker';
import { AvatarStack } from '../components/afterglow/avatar-stack';
import { Guidelines } from './parts';

const source = tokens.source!;

function goTo(id: string) {
  window.location.hash = new URLSearchParams({ page: id }).toString();
}

function SectionTitle({ children }: { children: string }) {
  return <h2 className="type-label mb-3 text-pop-ink">{children}</h2>;
}

const PRINCIPLES = [
  { title: 'Dopamine first', text: 'Saturated color is the point. Neutral surfaces only exist so the neon can stand out.' },
  { title: 'Glass over flat', text: 'Content floats on frosted panels. Depth comes from blur and glow, not grey borders.' },
  { title: 'Make it a moment', text: 'Key actions get a little celebration: a bounce, a sticker, an emoji.' },
  { title: 'Human, not corporate', text: 'Write like a friend texting. Sentence case, contractions, the occasional emoji.' },
  { title: 'Readable, always', text: 'Loud and still passing contrast. Neon is for fills; text on neon is always on-bright.' },
];

export function OverviewPage() {
  return (
    <div className="space-y-8">
      <section className="grid gap-3 md:grid-cols-4 md:grid-rows-2">
        <GlassCard tone="pop" slab className="flex flex-col justify-between gap-6 md:col-span-2 md:row-span-2">
          <Sticker tone="zap">Night out</Sticker>
          <div>
            <h1 className="type-display-lg md:type-display-xl">
              Rooftop szn, <span className="font-accent font-normal italic">obviously</span>.
            </h1>
            <p className="type-body-lg mt-3">A loud, warm, social design language for apps where people show up for each other.</p>
          </div>
        </GlassCard>
        <GlassCard tone="zap" className="md:col-span-2"><h3>One pop per view</h3><p>Pop marks the primary action. Zap is success.</p></GlassCard>
        <GlassCard tone="sun" compact><h3>Maybe</h3><p>Sun highlights.</p></GlassCard>
        <div className="grid gap-3">
          <GlassCard tone="sky" compact><p>Sky — decorative</p></GlassCard>
          <GlassCard tone="grape" compact><p>Grape — decorative</p></GlassCard>
        </div>
      </section>

      <section>
        <SectionTitle>Principles</SectionTitle>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {PRINCIPLES.map((p) => (
            <GlassCard key={p.title} compact><h3>{p.title}</h3><p>{p.text}</p></GlassCard>
          ))}
        </div>
      </section>

      <GlassCard>
        <h3>Start here</h3>
        <p>Import the theme once (<code>@workspace/afterglow-design-system/styles.css</code>), wrap nothing extra, and import source families from <code>components/afterglow/*</code>. The live Afterglow app consumes this package directly.</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button onClick={() => goTo('source-button')}>See the source families</Button>
          <Button variant="secondary" onClick={() => goTo('color-roles')}>Color roles</Button>
          <AvatarStack people={[{ name: 'Mika Rao' }, { name: 'Jo Park' }, { name: 'Sam Lee' }]} caption="Mika, Jo & Sam are in" />
        </div>
      </GlassCard>
    </div>
  );
}

const NEONS = new Set(['pop', 'zap', 'sun', 'sky', 'grape']);

type SourceColor = { name: string; value: string | { dark: string; light: string }; usage: string };

function Swatch({ label, value, theme }: { label: string; value: string; theme: 'dark' | 'light' }) {
  return (
    <div className={theme === 'dark' ? 'dark' : ''}>
      <div className="flex items-center gap-2 rounded-sm bg-bg p-2 text-ink">
        <span className="h-8 w-8 shrink-0 rounded-sm border border-line" style={{ background: value }} />
        <span className="text-xs"><span className="font-semibold">{label}</span> <span className="text-ink-muted">{value}</span></span>
      </div>
    </div>
  );
}

export function ColorsPage() {
  const colors = source.color.tokens as unknown as readonly SourceColor[];
  return (
    <div className="space-y-6">
      <Guidelines
        items={[
          { kind: 'do', text: 'Lead with one big pop block; support with zap and sun; use sky and grape as smaller satellites.' },
          { kind: 'do', text: 'Put on-bright text and icons on every neon fill. Use pop-ink when pink must be text or a link.' },
          { kind: 'do', text: 'Use zap for Going/success, sun for Maybe/highlight, danger for errors only.' },
          { kind: 'dont', text: 'Never put white text on neon, blend neons in gradients, or line up equal-sized color tiles like a swatch table.' },
          { kind: 'dont', text: 'Do not glow everything: glow-pop sits under the primary action only.' },
        ]}
      />
      <div className="grid gap-3 md:grid-cols-2">
        {colors.map((c) => (
          <GlassCard key={c.name} compact className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-display text-lg font-bold">{c.name}</span>
              {NEONS.has(c.name) ? <span className="rounded-full border border-line px-2 text-xs text-ink-muted">fill only</span> : null}
            </div>
            <p className="text-sm">{c.usage}</p>
            {typeof c.value === 'string' ? (
              <Swatch label="Both" value={c.value} theme="dark" />
            ) : (
              <div className="grid gap-2 sm:grid-cols-2">
                <Swatch label="Night out" value={c.value.dark} theme="dark" />
                <Swatch label="Day party" value={c.value.light} theme="light" />
              </div>
            )}
          </GlassCard>
        ))}
      </div>
      <GlassCard compact>
        <h3>Compatibility roles</h3>
        <p>Standard shadcn roles alias the source: background = bg, foreground = ink, card/popover = bg-raised, primary = pop on on-bright, secondary/accent = glass-strong, muted = glass, border/input = line, ring = focus, destructive = danger, charts = the five neons.</p>
      </GlassCard>
    </div>
  );
}

type TypeStyle = { name: string; fontSize: string; lineHeight: string; fontWeight: number; sample: string; usage: string };

export function FontsPage() {
  const groups = source.type.groups as unknown as readonly { name: string; family: string; styles: readonly TypeStyle[] }[];
  return (
    <div className="space-y-6">
      <GlassCard>
        <SectionTitle>Families</SectionTitle>
        <div className="space-y-3">
          {Object.entries(source.type.families).map(([k, v]) => (
            <div key={k}>
              <p className={k === 'display' ? 'font-display text-3xl font-extrabold tracking-tight' : k === 'accent' ? 'font-accent text-3xl italic' : 'text-xl'}>{k}</p>
              <p className="text-xs">{v}</p>
            </div>
          ))}
        </div>
      </GlassCard>
      {groups.map((g) => (
        <GlassCard key={g.name}>
          <SectionTitle>{g.name}</SectionTitle>
          <div className="space-y-5">
            {g.styles.map((s) => (
              <div key={s.name} className="border-t border-line pt-4 first:border-0 first:pt-0">
                <div className={`type-${s.name}`}>{s.sample}</div>
                <p className="mt-1 text-xs">type-{s.name} · {s.fontSize}/{s.lineHeight} · {s.fontWeight} — {s.usage}</p>
              </div>
            ))}
          </div>
        </GlassCard>
      ))}
    </div>
  );
}

export function LayoutPage() {
  return (
    <div className="space-y-6">
      <GlassCard>
        <SectionTitle>Spacing (4px base)</SectionTitle>
        <div className="space-y-2">
          {source.spacing.tokens.map((t) => (
            <div key={t.name} className="flex items-center gap-3 text-sm">
              <span className="w-20 font-semibold">{t.name}</span>
              <span className="h-3 rounded-full bg-pop" style={{ width: t.value }} />
              <span className="text-ink-muted">{t.value} — {t.usage}</span>
            </div>
          ))}
        </div>
      </GlassCard>
      <GlassCard>
        <SectionTitle>Radius</SectionTitle>
        <p className="mb-4">Anything tappable is a pill. Cards use radius-lg, posters radius-xl. Tailwind rounded-sm/md/lg/xl/full map to these.</p>
        <div className="flex flex-wrap gap-4">
          {source.radius.tokens.map((t) => (
            <div key={t.name} className="text-center text-xs">
              <div className="mb-2 h-16 w-24 border border-line bg-glass-strong" style={{ borderRadius: t.value }} />
              {t.name} · {t.value}
            </div>
          ))}
        </div>
      </GlassCard>
      <GlassCard>
        <SectionTitle>Depth and blur</SectionTitle>
        <div className="flex flex-wrap gap-6">
          <Button>glow-pop</Button>
          <Button variant="zap">glow-zap</Button>
          <div className="rounded-lg bg-bg-raised p-4 text-sm shadow-glass">shadow-card</div>
        </div>
        <p className="mt-4">{source.blur.tokens.map((t) => `${t.name} ${t.value}: ${t.usage}`).join(' ')}</p>
      </GlassCard>
    </div>
  );
}
