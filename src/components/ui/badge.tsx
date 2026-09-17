import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[#a78bfa] focus:ring-offset-2 focus:ring-offset-[#09090b]",
  {
    variants: {
      variant: {
        default:
          "border-[#27272a] bg-[#18181b] text-[#a1a1aa] hover:bg-[#27272a]",
        primary:
          "border-[#a78bfa] bg-[#a78bfa]/10 text-[#a78bfa] hover:bg-[#a78bfa]/20",
        secondary:
          "border-[#f5c542] bg-[#f5c542]/10 text-[#f5c542] hover:bg-[#f5c542]/20",
        destructive:
          "border-[#ef4444] bg-[#ef4444]/10 text-[#ef4444] hover:bg-[#ef4444]/20",
        success:
          "border-[#22c55e] bg-[#22c55e]/10 text-[#22c55e] hover:bg-[#22c55e]/20",
        warning:
          "border-[#f59e0b] bg-[#f59e0b]/10 text-[#f59e0b] hover:bg-[#f59e0b]/20",
        outline: "border-[#27272a] bg-transparent text-[#fafafa]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
