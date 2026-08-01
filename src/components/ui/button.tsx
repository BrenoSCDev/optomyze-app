import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * BUTTON — single source of truth for every clickable control in the CRM.
 *
 * Sizes (never override height/padding at the call site; pick a size):
 *   sm       32px · px-3 · 12px text — dense toolbars, table rows, card actions
 *   default  36px · px-4 · 14px text — the everyday button
 *   lg       40px · px-6 · 14px text — page-level primary actions, empty states
 *   icon-sm / icon / icon-lg  — square counterparts, 32 / 36 / 40px
 *
 * Hover rule: colour and elevation only. No scale, no translate, no shadow
 * "lift" — buttons stay anchored.
 *
 * Solid variants step to a *solid* hover/active colour (--primary-hover etc.)
 * rather than an alpha of the base. An alpha lets the page bleed through, and
 * because the dark-theme primary is near-white that made it go darker on
 * hover — reading as disabled rather than active. Quiet variants
 * (ghost/outline) pick up a surface tint rather than inverting to `accent`,
 * which is a near-white emphasis colour and flashed harshly in dark mode.
 *
 * Icons are sized by the button, not the call site: `[&_svg]:size-*` below
 * forces a consistent glyph size, and `gap-2` owns the icon↔text spacing —
 * so icons need no `mr-*`/`h-*` classes of their own.
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium ring-offset-background transition-colors duration-fast ease-standard focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary-hover active:bg-primary-active",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 active:bg-destructive/80",
        outline:
          "border border-input-border bg-transparent text-foreground hover:bg-surface-2 hover:border-border-strong active:bg-surface-3",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary-hover active:bg-secondary-active",
        ghost:
          "text-foreground hover:bg-surface-3 active:bg-surface-3/80",
        /** Quiet destructive — table/card row deletes, not modal confirms. */
        "ghost-destructive":
          "text-muted-foreground hover:bg-destructive/10 hover:text-destructive active:bg-destructive/15",
        link: "text-primary underline-offset-4 hover:underline",
        /** Solid CTA for the always-dark auth screens. */
        black:
          "bg-cta text-cta-foreground border border-cta-border hover:bg-cta/90 shadow-elevation-sm",
      },
      size: {
        sm: "h-8 px-3 text-xs [&_svg]:size-3.5",
        default: "h-9 px-4 text-sm [&_svg]:size-4",
        lg: "h-10 px-6 text-sm [&_svg]:size-4",
        "icon-sm": "h-8 w-8 [&_svg]:size-3.5",
        icon: "h-9 w-9 [&_svg]:size-4",
        "icon-lg": "h-10 w-10 [&_svg]:size-4",
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
  /**
   * Shows a spinner in place of any leading icon and disables the button.
   * Use this instead of hand-rolling `{busy ? <Loader2 …/> : <Icon/>}` so the
   * spinner size, placement and disabled behaviour match everywhere.
   * Ignored when `asChild` is set, since the child owns its own content.
   */
  loading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading = false, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || (loading && !asChild)}
        {...props}
      >
        {loading && !asChild ? (
          <>
            <Loader2 className="animate-spin" aria-hidden />
            {children}
          </>
        ) : (
          children
        )}
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
