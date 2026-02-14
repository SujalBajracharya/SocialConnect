import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils"

// Define button style variants using class-variance-authority (cva)
// This allows for easy management of different button styles and sizes
const buttonVariants = cva(
  // Base button styles
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      // Different visual variants for the button
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90",
        destructive:
          "bg-destructive text-white shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80",
        ghost:
          "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
        link: "text-primary underline-offset-4 hover:underline",
      },
      // Different size options for the button
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
      },
    },
    // Default variant and size if not specified
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

// Button component that supports variants, sizes, and custom classes
function Button({
  className,   // Additional custom classes
  variant,     // Visual variant (default, destructive, outline, etc.)
  size,        // Size variant (default, sm, lg, icon)
  asChild = false, // If true, renders as a child component (for custom elements)
  ...props     // Other props (e.g., onClick, disabled)
}) {
  // Use Slot for custom elements, otherwise render a <button>
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      // Combine variant, size, and custom classes
      className={cn(buttonVariants({ variant, size, className }))}
      {...props} />
  );
}

// Export Button component and buttonVariants utility
export { Button, buttonVariants }
