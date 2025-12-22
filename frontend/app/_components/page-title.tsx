"use client";

import { usePathname } from "next/navigation";

export default function PageTitle() {
  const pathname = usePathname();
  const title = pathname.split("/").pop();

  return (
    <h1 className="text-4xl font-bold px-8">
      {title
        ? (() => {
            const replaced = title.replace(/-/g, " ");
            return replaced.charAt(0).toUpperCase() + replaced.slice(1);
          })()
        : ""}
    </h1>
  );
}
