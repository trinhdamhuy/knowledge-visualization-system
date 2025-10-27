"use client";

import { Button } from "@/components/ui/button";
import { Grid3X3, List } from "lucide-react";
import { useState } from "react";
import { MasonryLayout } from "./masonry-layout";
import { DiagramCard } from "../cards/diagram-card";
import { FullDiagram } from "@/types";
import { Separator } from "@/components/ui/separator";
import { SortDropdown } from "../buttons/sort-dropdown";

export function ItemsLayout({
  diagrams,
  children,
}: {
  diagrams: FullDiagram[];
  children?: React.ReactNode;
}) {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">{children}</div>

      <Separator />

      <div className="flex flex-col w-full px-4">
        <div className="flex items-center justify-between mb-4">
          <SortDropdown />
          <div className="flex gap-2">
            <Button
              onClick={() => setViewMode("grid")}
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="icon"
            >
              <Grid3X3 />
            </Button>
            <Button
              onClick={() => setViewMode("list")}
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="icon"
            >
              <List />
            </Button>
          </div>
        </div>

        {viewMode === "list" ? (
          <div className="flex flex-col w-full items-center justify-center space-y-2">
            {diagrams.map((diagram) => (
              <DiagramCard key={diagram.id} variant="list" diagram={diagram} />
            ))}
          </div>
        ) : (
          <MasonryLayout>
            {diagrams.map((diagram) => (
              <DiagramCard key={diagram.id} variant="grid" diagram={diagram} />
            ))}
          </MasonryLayout>
        )}
      </div>
    </div>
  );
}
