import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';

export function LabelDemo() {
  return (
    <div className="max-w-md space-y-6 rounded-xl border bg-card p-6">
      <div className="space-y-2">
        <Label htmlFor="label-name">Name</Label>
        <Input id="label-name" placeholder="Mara Lindqvist" />
        <p className="text-sm text-muted-foreground">Click the label to focus its input.</p>
      </div>
      <div className="space-y-2">
        <Input id="label-disabled" className="peer" disabled placeholder="Unavailable in this example" />
        <Label htmlFor="label-disabled">Disabled field</Label>
      </div>
      <div className="space-y-2">
        <Label htmlFor="label-required">Event <span aria-hidden>*</span></Label>
        <Input id="label-required" required aria-describedby="label-required-help" />
        <p id="label-required-help" className="text-sm text-muted-foreground">Required. Where did you meet?</p>
      </div>
    </div>
  );
}
