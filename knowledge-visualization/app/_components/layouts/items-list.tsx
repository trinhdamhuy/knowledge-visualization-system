"use client";

import { Button } from "@/components/ui/button";
import { Copy, Grid3X3, List, Plus } from "lucide-react";
import { useState } from "react";
import { MasonryLayout } from "./masonry-layout";
import { DiagramCard } from "../cards/diagram-card";
import { FullDiagram } from "@/types";
import { Separator } from "@/components/ui/separator";
import { SortDropdown } from "../buttons/sort-dropdown";
import CreateButton from "../buttons/create-button";
import { Sparkles } from "@/components/animate-ui/icons/sparkles";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { useItemSelection } from "@/app/(main)/_hooks/use-item-selection";

export function ItemsList({ diagrams }: { diagrams: FullDiagram[] }) {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const {
    selectedItems,
    isSelecting,
    selectionBox,
    selectionRef,
    handleCardClick,
    handleMouseDown,
    setCardRef,
  } = useItemSelection();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-4 px-8">
        <CreateButton label="Create Diagram" icon={<Plus />} />
        <CreateButton
          label="Create Diagram with AI"
          icon={<Sparkles animate loop loopDelay={1000} initialOnAnimateEnd />}
        />
      </div>

      <Separator className="w-[95%] mx-auto" />

      <ContextMenu>
        <ContextMenuTrigger>
          <div
            ref={selectionRef}
            className="flex flex-col w-full min-h-[74.5vh] px-8 relative"
            onMouseDown={handleMouseDown}
            onDragStart={(e) => e.preventDefault()}
            style={{
              userSelect: isSelecting ? "none" : undefined,
              WebkitUserSelect: isSelecting ? "none" : undefined,
            }}
          >
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
                  <DiagramCard
                    key={diagram.id}
                    ref={(el) => setCardRef(diagram.id, el)}
                    variant="list"
                    diagram={diagram}
                    isSelected={selectedItems.has(diagram.id)}
                    onCardClick={handleCardClick}
                  />
                ))}
              </div>
            ) : (
              <MasonryLayout>
                {diagrams.map((diagram) => (
                  <DiagramCard
                    key={diagram.id}
                    ref={(el) => setCardRef(diagram.id, el)}
                    variant="grid"
                    diagram={diagram}
                    isSelected={selectedItems.has(diagram.id)}
                    onCardClick={handleCardClick}
                  />
                ))}
              </MasonryLayout>
            )}

            {/* Selection box overlay */}
            {isSelecting && selectionBox && (
              <div
                className="absolute border-2 border-blue-500 bg-blue-500/10 pointer-events-none z-50"
                style={{
                  left: `${Math.min(selectionBox.startX, selectionBox.endX)}px`,
                  top: `${Math.min(selectionBox.startY, selectionBox.endY)}px`,
                  width: `${Math.abs(
                    selectionBox.endX - selectionBox.startX
                  )}px`,
                  height: `${Math.abs(
                    selectionBox.endY - selectionBox.startY
                  )}px`,
                }}
              />
            )}
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem>
            <Copy />
            Copy
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    </div>
  );
}
