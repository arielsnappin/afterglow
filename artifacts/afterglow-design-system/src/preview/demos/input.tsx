import { Input } from '../../components/ui/input';
import { Stack } from '../parts';

export function InputDemo() {
  return (
    <div className="max-w-md space-y-6 rounded-xl border bg-card p-6">
      <Stack label="Types">
        <Input aria-label="Name" placeholder="Name" />
        <Input aria-label="Email" type="email" placeholder="name@example.com" />
        <Input aria-label="Choose a file" type="file" />
      </Stack>
      <Stack label="States">
        <Input aria-label="Read-only example" defaultValue="Read only" readOnly />
        <Input aria-label="Disabled example" placeholder="Disabled" disabled />
        <Input aria-label="Invalid example" placeholder="Invalid" aria-invalid="true" />
      </Stack>
    </div>
  );
}
