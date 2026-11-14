import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CheckCircle2, UserPlus } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '../../components/ui/alert';
import { Button } from '../../components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../../components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../../components/ui/form';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { RadioGroup, RadioGroupItem } from '../../components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { Spinner } from '../../components/ui/spinner';
import { Switch } from '../../components/ui/switch';
import { Textarea } from '../../components/ui/textarea';

const personSchema = z.object({
  name: z.string().trim().min(1, 'A name is enough to start.'),
  event: z.string().trim().min(1, 'Where did you meet?'),
  remember: z.string().max(280, 'Keep it under 280 characters.').optional(),
});
type PersonValues = z.infer<typeof personSchema>;

const outreachSchema = z.object({
  channel: z.string().min(1, 'Choose how you plan to reach out.'),
  tone: z.enum(['warm', 'brief', 'curious']),
  message: z.string().trim().min(20, 'A few more words will make it feel personal.'),
});
type OutreachValues = z.infer<typeof outreachSchema>;

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function LocalLabel() {
  return (
    <p className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
      Local simulation. Nothing is sent or stored.
    </p>
  );
}

function PersonDialog({ onAdded }: { onAdded: (name: string) => void }) {
  const [open, setOpen] = useState(false);
  const form = useForm<PersonValues>({
    resolver: zodResolver(personSchema),
    defaultValues: { name: '', event: '', remember: '' },
  });

  const submit = async (values: PersonValues) => {
    await wait(600);
    onAdded(values.name);
    form.reset();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button data-testid="button-add-person">
          <UserPlus aria-hidden /> Add someone you met
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Who did you meet?</DialogTitle>
          <DialogDescription>Capture just enough to remember them later.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(submit)} className="space-y-4" noValidate>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Ines Park" {...field} data-testid="input-person-name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="event"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Event</FormLabel>
                  <FormControl>
                    <Input placeholder="Neighborhood Garden Swap" {...field} data-testid="input-person-event" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="remember"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Something to remember</FormLabel>
                  <FormControl>
                    <Textarea rows={3} placeholder="What you talked about" {...field} />
                  </FormControl>
                  <FormDescription>Optional. Only you see this.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <LocalLabel />
            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={form.formState.isSubmitting} data-testid="button-save-person">
                {form.formState.isSubmitting ? <Spinner /> : null}
                {form.formState.isSubmitting ? 'Saving' : 'Save person'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function OutreachForm() {
  const [failNext, setFailNext] = useState(true);
  const [result, setResult] = useState<'idle' | 'error' | 'saved'>('idle');
  const form = useForm<OutreachValues>({
    resolver: zodResolver(outreachSchema),
    defaultValues: { channel: '', tone: 'warm', message: '' },
  });

  const submit = async () => {
    setResult('idle');
    await wait(800);
    if (failNext) {
      setFailNext(false);
      setResult('error');
      return;
    }
    setResult('saved');
  };

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg">Plan an outreach</CardTitle>
        <CardDescription>For Mara Lindqvist, met at Harbor Makers Night.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(submit)} className="space-y-5" noValidate>
            <FormField
              control={form.control}
              name="channel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>How will you reach out?</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger data-testid="select-channel">
                        <SelectValue placeholder="Choose a channel" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="text">Text message</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="in-person">In person</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="tone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tone</FormLabel>
                  <FormControl>
                    <RadioGroup value={field.value} onValueChange={field.onChange} className="flex flex-wrap gap-4">
                      {(['warm', 'brief', 'curious'] as const).map((tone) => (
                        <div key={tone} className="flex items-center gap-2">
                          <RadioGroupItem value={tone} id={`tone-${tone}`} />
                          <Label htmlFor={`tone-${tone}`} className="capitalize">{tone}</Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Draft</FormLabel>
                  <FormControl>
                    <Textarea rows={4} placeholder="Hi Mara, I kept thinking about the kiln schedule..." {...field} data-testid="input-outreach-message" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex items-center gap-2">
              <Switch id="outreach-fail" checked={failNext} onCheckedChange={setFailNext} />
              <Label htmlFor="outreach-fail" className="text-xs text-muted-foreground">Simulate an error on next save</Label>
            </div>
            {result === 'error' ? (
              <Alert variant="destructive">
                <AlertTitle>Draft not saved</AlertTitle>
                <AlertDescription>Your words are still here. Save again to retry.</AlertDescription>
              </Alert>
            ) : null}
            {result === 'saved' ? (
              <Alert>
                <CheckCircle2 className="size-4" />
                <AlertTitle>Draft saved locally</AlertTitle>
                <AlertDescription>Nothing was sent. Reach out whenever it feels right.</AlertDescription>
              </Alert>
            ) : null}
            <LocalLabel />
            <div className="flex flex-wrap gap-2">
              <Button type="submit" disabled={form.formState.isSubmitting} data-testid="button-save-outreach">
                {form.formState.isSubmitting ? <Spinner /> : null}
                {form.formState.isSubmitting ? 'Saving draft' : result === 'error' ? 'Try again' : 'Save draft'}
              </Button>
              <Button type="button" variant="ghost" onClick={() => { form.reset(); setResult('idle'); }}>
                Clear
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

export function PersonFormsExample() {
  const [added, setAdded] = useState<string[]>([]);
  return (
    <div className="space-y-4">
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Remember someone</CardTitle>
          <CardDescription>Opens a dialog with validation and a simulated save.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <PersonDialog onAdded={(name) => setAdded((list) => [name, ...list])} />
          {added.length > 0 ? (
            <ul className="space-y-1 text-sm" aria-live="polite" data-testid="list-added-people">
              {added.map((name, i) => (
                <li key={`${name}-${i}`} className="text-muted-foreground">
                  Added {name} to this page only.
                </li>
              ))}
            </ul>
          ) : null}
        </CardContent>
      </Card>
      <OutreachForm />
    </div>
  );
}
