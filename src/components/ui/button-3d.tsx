import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const button3dVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl font-bold text-base transition-all duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-5 [&_svg]:shrink-0 select-none cursor-pointer",
  {
    variants: {
      variant: {
        primary: [
          "bg-gradient-to-b from-blue-400 to-blue-600 text-white",
          "border-b-[6px] border-blue-800",
          "shadow-[0_4px_0_0_rgb(30,64,175),0_8px_16px_-4px_rgba(59,130,246,0.5)]",
          "hover:from-blue-300 hover:to-blue-500 hover:brightness-110",
          "active:translate-y-[4px] active:border-b-[2px] active:shadow-[0_0_0_0_rgb(30,64,175),0_2px_8px_-2px_rgba(59,130,246,0.3)]",
        ],
        success: [
          "bg-gradient-to-b from-emerald-400 to-emerald-600 text-white",
          "border-b-[6px] border-emerald-800",
          "shadow-[0_4px_0_0_rgb(6,95,70),0_8px_16px_-4px_rgba(16,185,129,0.5)]",
          "hover:from-emerald-300 hover:to-emerald-500 hover:brightness-110",
          "active:translate-y-[4px] active:border-b-[2px] active:shadow-[0_0_0_0_rgb(6,95,70),0_2px_8px_-2px_rgba(16,185,129,0.3)]",
        ],
        danger: [
          "bg-gradient-to-b from-red-400 to-red-600 text-white",
          "border-b-[6px] border-red-800",
          "shadow-[0_4px_0_0_rgb(153,27,27),0_8px_16px_-4px_rgba(239,68,68,0.5)]",
          "hover:from-red-300 hover:to-red-500 hover:brightness-110",
          "active:translate-y-[4px] active:border-b-[2px] active:shadow-[0_0_0_0_rgb(153,27,27),0_2px_8px_-2px_rgba(239,68,68,0.3)]",
        ],
        warning: [
          "bg-gradient-to-b from-amber-400 to-amber-600 text-white",
          "border-b-[6px] border-amber-800",
          "shadow-[0_4px_0_0_rgb(146,64,14),0_8px_16px_-4px_rgba(245,158,11,0.5)]",
          "hover:from-amber-300 hover:to-amber-500 hover:brightness-110",
          "active:translate-y-[4px] active:border-b-[2px] active:shadow-[0_0_0_0_rgb(146,64,14),0_2px_8px_-2px_rgba(245,158,11,0.3)]",
        ],
        purple: [
          "bg-gradient-to-b from-purple-400 to-purple-600 text-white",
          "border-b-[6px] border-purple-800",
          "shadow-[0_4px_0_0_rgb(107,33,168),0_8px_16px_-4px_rgba(168,85,247,0.5)]",
          "hover:from-purple-300 hover:to-purple-500 hover:brightness-110",
          "active:translate-y-[4px] active:border-b-[2px] active:shadow-[0_0_0_0_rgb(107,33,168),0_2px_8px_-2px_rgba(168,85,247,0.3)]",
        ],
        pink: [
          "bg-gradient-to-b from-pink-400 to-pink-600 text-white",
          "border-b-[6px] border-pink-800",
          "shadow-[0_4px_0_0_rgb(157,23,77),0_8px_16px_-4px_rgba(236,72,153,0.5)]",
          "hover:from-pink-300 hover:to-pink-500 hover:brightness-110",
          "active:translate-y-[4px] active:border-b-[2px] active:shadow-[0_0_0_0_rgb(157,23,77),0_2px_8px_-2px_rgba(236,72,153,0.3)]",
        ],
      },
      size: {
        sm: "h-9 px-4 text-sm rounded-lg border-b-[4px] active:border-b-[1px] active:translate-y-[3px]",
        md: "h-11 px-6 text-base",
        lg: "h-14 px-8 text-lg rounded-2xl border-b-[8px] active:border-b-[3px] active:translate-y-[5px]",
        xl: "h-16 px-10 text-xl rounded-2xl border-b-[10px] active:border-b-[4px] active:translate-y-[6px]",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export interface Button3DProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof button3dVariants> {}

const Button3D = React.forwardRef<HTMLButtonElement, Button3DProps>(
  ({ className, variant, size, children, type = "button", ...props }, ref) => {
    return (
      <button
        className={cn(button3dVariants({ variant, size, className }))}
        ref={ref}
        type={type}
        {...props}
      >
        {children}
      </button>
    );
  }
);
Button3D.displayName = "Button3D";

export { Button3D, button3dVariants };
