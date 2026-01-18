"use client";

import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useTheme } from "next-themes";

interface CircularProgressProps {
  value: number; // Current value
  max: number; // Maximum value
  size?: number; // Size in pixels (default: 40)
  strokeWidth?: number; // Stroke width (default: 3)
  className?: string;
  showValue?: boolean; // Show value in center (default: false, show on hover)
}

export function CircularProgress({
  value,
  max,
  size = 24,
  strokeWidth = 2.5,
  className,
  showValue = false,
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const percentage = Math.min((value / max) * 100, 100);
  const offset = circumference - (percentage / 100) * circumference;

  // Determine color based on usage percentage
  const getColor = () => {
    if (percentage >= 90) return "text-red-500";
    if (percentage >= 70) return "text-orange-500";
    return "text-primary";
  };

  const color = getColor();
  const theme = useTheme();
  const isDark = theme.resolvedTheme === "dark";

  const content = (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
        aria-hidden="true"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={isDark ? "white" : "black"}
          strokeWidth={strokeWidth}
          fill="none"
          className="text-muted opacity-20"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={cn("transition-all duration-300 ease-in-out", color)}
          style={{
            strokeDashoffset: offset,
          }}
        />
      </svg>
      {showValue && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-medium text-foreground">
            {Math.round(percentage)}%
          </span>
        </div>
      )}
    </div>
  );

  if (!showValue) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent>
          <div className="text-sm">
            <div className="font-medium">
              {value.toLocaleString()} / {max.toLocaleString()} tokens
            </div>
            <div className="text-muted-foreground text-xs mt-1">
              {Math.round(percentage)}% used this week
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    );
  }

  return content;
}
