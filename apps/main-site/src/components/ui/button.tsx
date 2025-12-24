import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap text-sm font-medium uppercase tracking-nest transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        // Primary CTA - Blush Pink (REQUEST VIEWING)
        default:
          'bg-nest-pink text-black hover:bg-nest-pink-dark border border-transparent',
        // Olive green variant
        primary:
          'bg-nest-olive text-white hover:bg-nest-olive-dark border border-transparent',
        // Secondary variant - light gray
        secondary:
          'bg-nest-gray text-black hover:bg-nest-gray/80 border border-transparent',
        // Outline variant - black border
        outline:
          'border border-black bg-transparent text-black hover:bg-black hover:text-white',
        // Ghost variant
        ghost:
          'bg-transparent text-black hover:bg-nest-gray/50',
        // Link style
        link:
          'text-black underline-offset-4 hover:underline bg-transparent',
        // Destructive
        destructive:
          'bg-destructive text-destructive-foreground hover:bg-destructive/90',
      },
      size: {
        default: 'h-12 px-8 py-3',
        sm: 'h-10 px-6 py-2',
        lg: 'h-14 px-10 py-4',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild: _asChild, ...props }, ref) => {
    // asChild is destructured but not used - we don't support Slot pattern yet
    void _asChild
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
