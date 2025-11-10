"use client";

export function MainWrapper({ children }: { children: React.ReactNode }) {
  return <main className="flex flex-col gap-4 py-4">{children}</main>;
}
