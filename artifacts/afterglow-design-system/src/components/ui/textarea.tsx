import * as React from "react"

import { cn } from "../../lib/utils"

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-24 w-full resize-y px-4 py-3 text-base leading-6 glass rounded-md text-ink placeholder:text-ink-muted transition-[border-color,box-shadow] duration-220 ease-out focus-visible:border-pop focus-visible:shadow-[0_0_0_3px_var(--aura-1)] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus aria-[invalid=true]:border-danger disabled:cursor-not-allowed disabled:opacity-45",
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Textarea.displayName = "Textarea"

export { Textarea }
