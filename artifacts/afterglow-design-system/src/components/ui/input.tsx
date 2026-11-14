import * as React from "react"

import { cn } from "../../lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-12 w-full px-4 py-3 text-base file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground glass rounded-md text-ink placeholder:text-ink-muted transition-[border-color,box-shadow] duration-220 ease-out focus-visible:border-pop focus-visible:shadow-[0_0_0_3px_var(--aura-1)] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus aria-[invalid=true]:border-danger disabled:cursor-not-allowed disabled:opacity-45",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
