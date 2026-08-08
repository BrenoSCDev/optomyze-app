import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * The icon is positioned absolutely and the text is padded past it, so the two
 * are only aligned while the padding they each assume matches. Overriding the
 * padding at a call site (`className="py-2"`) moves the text but not the icon,
 * which is why `size` exists: it moves both together.
 */
const alertVariants = cva(
  "relative w-full rounded-lg border [&>svg]:absolute [&>svg]:text-foreground",
  {
    variants: {
      variant: {
        default: "bg-background text-foreground",
        destructive:
          "border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive",
      },
      size: {
        default:
          "p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:left-4 [&>svg]:top-4",
        // Inline notices inside dense panels. Icon and text share a baseline
        // rather than the icon hanging below the first line.
        sm: "px-3 py-2 [&>svg~*]:pl-6 [&>svg]:left-3 [&>svg]:top-2.5 [&>svg]:h-3.5 [&>svg]:w-3.5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>
>(({ className, variant, size, ...props }, ref) => (
  <div
    ref={ref}
    role="alert"
    className={cn(alertVariants({ variant, size }), className)}
    {...props}
  />
))
Alert.displayName = "Alert"

const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn("mb-1 font-medium leading-none tracking-tight", className)}
    {...props}
  />
))
AlertTitle.displayName = "AlertTitle"

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm [&_p]:leading-relaxed", className)}
    {...props}
  />
))
AlertDescription.displayName = "AlertDescription"

export { Alert, AlertTitle, AlertDescription }
