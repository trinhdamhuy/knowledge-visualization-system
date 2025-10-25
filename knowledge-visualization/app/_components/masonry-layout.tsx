"use client";

import React, { useState, useEffect } from "react";
import Masonry, { ResponsiveMasonry } from "react-responsive-masonry";
import { Spinner } from "@/components/ui/spinner";

export function MasonryLayout({ children }: { children: React.ReactNode }) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setTimeout(() => {
      setIsClient(true);
    }, 100);
  }, []);

  if (!isClient) {
    return (
      <div className="flex items-center justify-center">
        <Spinner className="size-6" />
      </div>
    );
  }

  return (
    <ResponsiveMasonry
      columnsCountBreakPoints={{
        350: 1,
        750: 2,
        900: 3,
        1200: 4,
        1500: 5,
        1800: 6,
        2100: 7,
        2400: 8,
        2700: 9,
        3000: 10,
        3300: 11,
        3600: 12,
        3900: 13,
        4200: 14,
        4500: 15,
        4800: 16,
        5100: 17,
        5400: 18,
        5700: 19,
        6000: 20,
      }}
    >
      <Masonry>{children}</Masonry>
    </ResponsiveMasonry>
  );
}
