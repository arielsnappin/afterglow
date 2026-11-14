import { useMemo, useRef, useState } from 'react';
import { CalendarDays, Clock, MessageCircle, RotateCcw, Users } from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertDescription, AlertTitle } from '../../components/ui/alert';
import { Avatar, AvatarFallback } from '../../components/ui/avatar';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '../../components/ui/empty';
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from '../../components/ui/item';
import { Label } from '../../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '../../components/ui/sheet';
import { Skeleton } from '../../components/ui/skeleton';
import { Spinner } from '../../components/ui/spinner';
import { Switch } from '../../components/ui/switch';
import { Textarea } from '../../components/ui/textarea';
import { Toaster } from '../../components/ui/sonner';
import { ToggleGroup, ToggleGroupItem } from '../../components/ui/toggle-group';
import {
  SAMPLE_PEOPLE,
  STATUS_LABELS,
  type FollowUpStatus,
  type Person,
} from '../data';

type Filter = 'all' | 'due' | 'talking' | 'done';

const FILTERS: Array<{ value: Filter; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'due', label: 'Due soon' },
  { value: 'talking', label: 'In conversation' },
  { value: 'done', label: 'Followed through' },
];

function matches(person: Person, filter: Filter) {
  if (filter === 'all') return true;
  if (filter === 'due') return person.status !== 'done' && (person.due === 'overdue' || person.due === 'today');
  if (filter === 'talking') return person.status === 'talking' || person.status === 'reached-out';
  return person.status === 'done';
}

function DueBadge({ person }: { person: Person }) {
  if (person.status === 'done') return <Badge variant="outline">Done</Badge>;
  if (person.due === 'overdue') return <Badge variant="destructive">{person.dueLabel}</Badge>;
  if (person.due === 'today') return <Badge>{person.dueLabel}</Badge>;
  return <Badge variant="secondary">{person.dueLabel}</Badge>;
}

function SimulationNote() {
  return (
    <p className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground" data-testid="text-simulation-note">
      Local simulation with fictional people. Nothing is sent or stored.
    </p>
  );
}

export function FollowUpsExample() {
  const [people, setPeople] = useState<Person[]>(SAMPLE_PEOPLE);
  const [filter, setFilter] = useState<Filter>('all');
  const [loading, setLoading] = useState(false);
  const [failNext, setFailNext] = useState(false);
  const [active, setActive] = useState<Person | null>(null);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const timer = useRef<number | undefined>(undefined);

  const visible = useMemo(() => people.filter((p) => matches(p, filter)), [people, filter]);

  const reload = () => {
    setLoading(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setLoading(false), 900);
  };

  const setStatus = (id: string, status: FollowUpStatus) => {
    setPeople((list) => list.map((p) => (p.id === id ? { ...p, status } : p)));
    const person = people.find((p) => p.id === id);
    toast(`${person?.name ?? 'Follow-up'} marked ${STATUS_LABELS[status].toLowerCase()}`);
  };

  const openOutreach = (person: Person) => {
    setActive(person);
    setDraft(`Hi ${person.name.split(' ')[0]}, it was lovely meeting you at ${person.event}. `);
    setSaveError(null);
  };

  const saveDraft = () => {
    if (!active) return;
    if (draft.trim().length < 10) {
      setSaveError('Add a few more words so the note feels personal.');
      return;
    }
    setSaving(true);
    setSaveError(null);
    window.setTimeout(() => {
      setSaving(false);
      if (failNext) {
        setFailNext(false);
        setSaveError("We couldn't save that draft. Your words are still here.");
        return;
      }
      toast.success('Draft preview complete', {
        description: `No message was sent to ${active.name}. Their status is unchanged.`,
      });
      setActive(null);
    }, 800);
  };

  return (
    <div className="space-y-4">
      <SimulationNote />
      <div className="rounded-xl border bg-card p-4 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">Follow-ups</h2>
            <p className="text-sm text-muted-foreground">People you met recently, and what you meant to say.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Switch id="fail-next" checked={failNext} onCheckedChange={setFailNext} data-testid="switch-simulate-error" />
              <Label htmlFor="fail-next" className="text-xs text-muted-foreground">Simulate save error</Label>
            </div>
            <Button variant="outline" size="sm" onClick={reload} data-testid="button-simulate-loading">
              <RotateCcw aria-hidden /> Simulate loading
            </Button>
          </div>
        </div>

        <ToggleGroup
          type="single"
          value={filter}
          onValueChange={(v) => v && setFilter(v as Filter)}
          variant="outline"
          size="sm"
          aria-label="Filter follow-ups"
          className="mt-4 flex-wrap justify-start"
        >
          {FILTERS.map((f) => (
            <ToggleGroupItem key={f.value} value={f.value} className="rounded-full px-3" data-testid={`filter-${f.value}`}>
              {f.label} ({people.filter((p) => matches(p, f.value)).length})
            </ToggleGroupItem>
          ))}
        </ToggleGroup>

        <div className="mt-4" aria-live="polite" aria-busy={loading}>
          {loading ? (
            <div className="space-y-3" role="status" aria-label="Loading follow-ups">
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex items-center gap-4 rounded-lg border p-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-3 w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : visible.length === 0 ? (
            <Empty className="border border-dashed">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Users />
                </EmptyMedia>
                <EmptyTitle>Nothing waiting here</EmptyTitle>
                <EmptyDescription>No one matches this filter. Enjoy the quiet.</EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button variant="outline" onClick={() => setFilter('all')}>Show everyone</Button>
              </EmptyContent>
            </Empty>
          ) : (
            <ItemGroup className="gap-3">
              {visible.map((person) => (
                <Item key={person.id} role="listitem" variant="outline" className="items-start bg-background" data-testid={`card-follow-up-${person.id}`}>
                  <ItemMedia>
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-accent text-accent-foreground">{person.initials}</AvatarFallback>
                    </Avatar>
                  </ItemMedia>
                  <ItemContent className="min-w-0 basis-56">
                    <div className="flex flex-wrap items-center gap-2">
                      <ItemTitle>{person.name}</ItemTitle>
                      <DueBadge person={person} />
                    </div>
                    <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><CalendarDays className="size-3" aria-hidden />{person.event}</span>
                      <span className="flex items-center gap-1"><Clock className="size-3" aria-hidden />{person.metOn}</span>
                    </p>
                    <ItemDescription className="line-clamp-none">{person.note}</ItemDescription>
                  </ItemContent>
                  <ItemActions className="w-full flex-wrap sm:w-auto">
                    <Select value={person.status} onValueChange={(v) => setStatus(person.id, v as FollowUpStatus)}>
                      <SelectTrigger className="w-full sm:w-44" aria-label={`Status for ${person.name}`} data-testid={`select-status-${person.id}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(Object.keys(STATUS_LABELS) as FollowUpStatus[]).map((s) => (
                          <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      onClick={() => openOutreach(person)}
                      disabled={person.status === 'done'}
                      className="w-full sm:w-auto"
                      data-testid={`button-write-note-${person.id}`}
                    >
                      <MessageCircle aria-hidden /> Write a note
                    </Button>
                  </ItemActions>
                </Item>
              ))}
            </ItemGroup>
          )}
        </div>
      </div>

      <Sheet open={active !== null} onOpenChange={(open) => !open && !saving && setActive(null)}>
        <SheetContent className="flex w-full flex-col gap-4 sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Note to {active?.name}</SheetTitle>
            <SheetDescription>From {active?.event}. Drafts stay on this page only.</SheetDescription>
          </SheetHeader>
          <div className="space-y-2">
            <Label htmlFor="outreach-draft">Your note</Label>
            <Textarea
              id="outreach-draft"
              rows={6}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              aria-invalid={saveError ? true : undefined}
              data-testid="input-outreach-draft"
            />
            <p className="text-xs text-muted-foreground">{draft.length} characters</p>
          </div>
          {saveError ? (
            <Alert variant="destructive">
              <AlertTitle>Not saved</AlertTitle>
              <AlertDescription>{saveError}</AlertDescription>
            </Alert>
          ) : null}
          <SimulationNote />
          <SheetFooter className="mt-auto gap-2">
            <Button variant="outline" onClick={() => setActive(null)} disabled={saving}>Cancel</Button>
            <Button onClick={saveDraft} disabled={saving} data-testid="button-save-draft">
              {saving ? <Spinner /> : null}
              {saving ? 'Saving draft' : saveError ? 'Try again' : 'Save draft'}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
      <Toaster />
    </div>
  );
}
