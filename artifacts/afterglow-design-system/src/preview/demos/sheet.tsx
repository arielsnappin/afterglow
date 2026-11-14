import { Button } from '../../components/ui/button';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '../../components/ui/sheet';

export function SheetDemo() {
  return (
    <div className="flex flex-wrap gap-3 rounded-xl border bg-card p-6">
      {(['right', 'left', 'top', 'bottom'] as const).map((side) => <Sheet key={side}>
        <SheetTrigger asChild>
          <Button variant="outline">Open {side} sheet</Button>
        </SheetTrigger>
        <SheetContent side={side}>
          <SheetHeader>
            <SheetTitle>A little context</SheetTitle>
            <SheetDescription>
              A {side}-aligned sheet keeps the conversation close.
            </SheetDescription>
          </SheetHeader>
          <div className="my-6 rounded-md border p-4 text-sm text-muted-foreground">
            You met Mara at Harbor Makers Night and talked about ceramics.
          </div>
          <SheetFooter>
            <SheetClose asChild>
              <Button>Close preview</Button>
            </SheetClose>
          </SheetFooter>
        </SheetContent>
      </Sheet>)}
    </div>
  );
}
