import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a78bfa] focus-visible:ring-offset-2 focus-visible:ring-offset-[#09090b] disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-[#a78bfa] text-[#09090b] border border-[#a78bfa] hover:bg-[#8b5cf6] hover:border-[#8b5cf6] hover:shadow-[0_0_24px_rgba(167,139,250,0.2)]",
        destructive:
          "bg-[#ef4444] text-white border border-[#ef4444] hover:bg-[#dc2626] hover:border-[#dc2626]",
        outline:
          "bg-transparent text-[#a78bfa] border border-[#a78bfa] hover:bg-[#a78bfa] hover:text-[#09090b] hover:shadow-[0_0_24px_rgba(167,139,250,0.2)]",
        secondary:
          "bg-transparent text-[#f5c542] border border-[#f5c542] hover:bg-[#f5c542] hover:text-[#09090b] hover:shadow-[0_0_24px_rgba(245,197,66,0.2)]",
        ghost:
          "bg-transparent text-[#a1a1aa] border border-transparent hover:bg-[#18181b] hover:text-[#fafafa] hover:border-[#27272a]",
        link: "text-[#a78bfa] underline-offset-4 hover:underline",
        gold:
          "bg-[#f5c542] text-[#09090b] border border-[#f5c542] hover:bg-[#e6b830] hover:border-[#e6b830] hover:shadow-[0_0_24px_rgba(245,197,66,0.2)]",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-9 px-4 text-xs",
        lg: "h-12 px-8 text-base",
        xl: "h-14 px-10 text-lg",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
