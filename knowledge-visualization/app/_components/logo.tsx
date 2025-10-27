import { AuroraText } from "@/components/ui/aurora-text";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({ text, className }: { text: string; className: string }) {
  return (
    <Link
      href="/dashboard"
      className={cn(
        "text-2xl font-bold inline-block text-center cursor-pointer",
        className
      )}
    >
      <AuroraText>{text}</AuroraText>
    </Link>
  );
}
