import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const hydiaButtonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline: "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        // HYDIA Variants Professionnels
        primary: "bg-hydia-primary text-primary-foreground shadow-soft hover:bg-hydia-primary-dark transition-colors",
        professional: "bg-white border border-border text-foreground hover:bg-accent shadow-soft",
        success: "bg-hydia-success text-white hover:bg-hydia-success/90 shadow-soft",
        warning: "bg-hydia-warning text-white hover:bg-hydia-warning/90 shadow-soft",
        danger: "bg-hydia-danger text-white hover:bg-hydia-danger/90 shadow-soft",
        minimal: "text-hydia-primary hover:bg-hydia-primary/5 border border-hydia-primary/20 hover:border-hydia-primary/40",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        xl: "h-12 rounded-lg px-12 text-base",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface HydiaButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof hydiaButtonVariants> {
  asChild?: boolean
}

const HydiaButton = React.forwardRef<HTMLButtonElement, HydiaButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(hydiaButtonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
HydiaButton.displayName = "HydiaButton"

export { HydiaButton, hydiaButtonVariants }