import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "../../lib/utils"

const badgeVariants = cva(
  // Afterglow: pill chips, label type. Neon fills always carry on-bright text.
  "whitespace-nowrap inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-focus",
  {
    variants: {
      variant: {
        default: "border-transparent bg-pop text-on-bright",
        secondary: "border-line bg-glass-strong text-ink",
        destructive: "border-transparent bg-destructive text-destructive-foreground",
        outline: "border-line text-ink",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
