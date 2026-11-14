import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "../../lib/utils"

const buttonVariants = cva(
  // Afterglow source Button: pills, DM Sans 700, bounce on press, 3px focus ring with 3px offset.
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full border border-transparent font-sans font-bold leading-none cursor-pointer transition-[transform,background-color,box-shadow] duration-220 ease-out hover:-translate-y-px active:scale-96 active:duration-120 active:ease-bounce focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-focus disabled:pointer-events-none disabled:opacity-45 disabled:shadow-none disabled:translate-y-0 motion-reduce:transform-none [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        // pop fill, on-bright text, glow-pop. One per view.
        default: "bg-pop text-on-bright shadow-glow-pop",
        destructive: "bg-destructive text-destructive-foreground",
        // glass pill with line border (source secondary)
        outline: "glass text-ink hover:bg-glass-strong",
        secondary: "glass-strong text-ink hover:bg-glass-strong",
        ghost: "bg-transparent text-ink hover:bg-glass",
        link: "h-auto px-0 text-pop-ink underline-offset-4 hover:underline hover:translate-y-0",
      },
      size: {
        default: "h-12 px-5 text-base",
        sm: "h-9 px-4 text-sm",
        lg: "h-14 px-6 text-lg",
        icon: "h-12 w-12 text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
