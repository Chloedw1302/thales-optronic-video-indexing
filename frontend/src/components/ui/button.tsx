import * as React from "react"
import { cn } from "@/lib/utils"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    const variantClasses = {
      default: 'bg-transparent text-[#007185] border border-[#007185] hover:bg-[#007185] hover:text-white',
      destructive: 'bg-transparent text-[#D12F19] border border-[#D12F19] hover:bg-[#D12F19] hover:text-white',
      outline: 'border border-[#DDDDDD] hover:bg-[#DADBDB] hover:border-[#007185] text-[#111111] hover:text-[#007185]',
      secondary: 'bg-[#F0F2F2] text-[#111111] hover:bg-[#DADBDB] border border-[#DDDDDD]',
      ghost: 'hover:bg-[#DADBDB] text-[#111111] hover:text-[#007185]',
      link: 'text-[#007185] hover:text-[#008397] underline-offset-4 hover:underline',
    }

    const sizeClasses = {
      default: 'h-10 px-4 py-2',
      sm: 'h-8 px-3 text-sm',
      lg: 'h-12 px-6 text-base',
      icon: 'h-10 w-10',
    }

    return (
      <button
        className={cn(
          'inline-flex items-center justify-center whitespace-nowrap rounded-sm text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
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
