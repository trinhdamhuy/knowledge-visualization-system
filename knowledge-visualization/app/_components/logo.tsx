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
      <AuroraText colors={["#142850", "#27496D", "#0C7B93", "#00A8CC"]}>
        {text}
      </AuroraText>
    </Link>
  );
}
