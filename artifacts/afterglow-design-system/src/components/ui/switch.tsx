import * as React from "react"
import * as SwitchPrimitives from "@radix-ui/react-switch"

import { cn } from "../../lib/utils"

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitives.Root
    className={cn(
      "peer inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full border border-line transition-colors duration-220 focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-focus disabled:cursor-not-allowed disabled:opacity-45 data-[state=checked]:border-transparent data-[state=checked]:bg-zap data-[state=unchecked]:bg-glass-strong",
      className
    )}
    {...props}
    ref={ref}
  >
    <SwitchPrimitives.Thumb
      className={cn(
        "pointer-events-none block h-5 w-5 rounded-full shadow-sm ring-0 transition-transform duration-220 ease-bounce data-[state=checked]:translate-x-6 data-[state=checked]:bg-on-bright data-[state=unchecked]:translate-x-1 data-[state=unchecked]:bg-ink"
      )}
    />
  </SwitchPrimitives.Root>
))
Switch.displayName = SwitchPrimitives.Root.displayName

export { Switch }
