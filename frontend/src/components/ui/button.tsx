import * as React from "react"
import { cn } from "@/lib/utils"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link' | 'gradient'
  size?: 'default' | 'sm' | 'lg' | 'icon'
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    const variantClasses = {
      default: 'bg-primary text-primary-foreground hover:bg-primary-hover shadow-glow',
      destructive: 'bg-red-600 text-white hover:bg-red-700 shadow-sm',
      outline: 'border border-border-subtle bg-transparent hover:bg-accent-hover hover:border-primary/30',
      secondary: 'bg-background-card text-foreground hover:bg-accent-hover border border-border-subtle',
      ghost: 'hover:bg-accent-hover text-foreground-muted hover:text-foreground',
      link: 'text-primary hover:text-primary-hover underline-offset-4 hover:underline',
      gradient: 'bg-gradient-to-r from-primary to-accent-pink text-white hover:from-primary-hover hover:to-accent-pink shadow-glow',
    }

    const sizeClasses = {
      default: 'h-10 px-4 py-2.5',
      sm: 'h-9 px-3 text-sm',
      lg: 'h-12 px-6 text-base',
      icon: 'h-10 w-10',
    }

    return (
      <button
        className={cn(
          'inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
