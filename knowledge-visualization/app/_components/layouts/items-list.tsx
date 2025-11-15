"use client";

import { Button } from "@/components/ui/button";
import { Copy, Grid3X3, List, Plus } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { MasonryLayout } from "./masonry-layout";
import { ItemCard } from "../cards/item-card";
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
import { CreateDiagramDialog } from "../dialogs/create-diagram-dialog";
import { useItems } from "@/hooks/use-items";
import type { DiagramSortBy, SortDirection } from "@/types";

interface ItemsListProps {
  onlyMine?: boolean; // If true, only show items owned by current user (for my-diagrams)
}

export function ItemsList({ onlyMine = false }: ItemsListProps = {}) {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [sortBy, setSortBy] = useState<DiagramSortBy>("updatedAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const { items, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } =
    useItems({ onlyMine, sortBy, sortDirection });
  const {
    selectedItems,
    isSelecting,
    selectionBox,
    selectionRef,
    handleCardClick,
    handleMouseDown,
    setCardRef,
  } = useItemSelection();

  // Infinite scroll observer
  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loadMoreRef.current || !hasNextPage || isLoading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(loadMoreRef.current);

    return () => {
      observer.disconnect();
    };
  }, [hasNextPage, isLoading, isFetchingNextPage, fetchNextPage]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-4 px-8">
        <CreateButton
          label="Create Diagram"
          icon={<Plus />}
          onClick={() => setIsCreateDialogOpen(true)}
        />
        <CreateButton
          label="Create Diagram with AI"
          icon={<Sparkles animate loop loopDelay={1000} initialOnAnimateEnd />}
        />
      </div>
      <CreateDiagramDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />

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
              <SortDropdown
                sortBy={sortBy}
                sortDirection={sortDirection}
                onSortByChange={setSortBy}
                onSortDirectionChange={setSortDirection}
              />
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

            {isLoading ? (
              <div className="flex items-center justify-center w-full h-64">
                <p className="text-muted-foreground">Loading...</p>
              </div>
            ) : items.length === 0 ? (
              <div className="flex items-center justify-center w-full h-64">
                <p className="text-muted-foreground">No items found</p>
              </div>
            ) : (
              <>
                {viewMode === "list" ? (
                  <div className="flex flex-col w-full items-center justify-center space-y-2">
                    {items.map((item) => (
                      <ItemCard
                        key={`${item.type}-${item.id}`}
                        ref={(el) => setCardRef(item.id, el)}
                        variant="list"
                        item={item}
                        isSelected={selectedItems.has(item.id)}
                        onCardClick={handleCardClick}
                      />
                    ))}
                    {/* Infinite scroll trigger */}
                    <div ref={loadMoreRef} className="h-4 w-full" />
                    {isFetchingNextPage && (
                      <div className="flex items-center justify-center w-full py-4">
                        <p className="text-sm text-muted-foreground">
                          Loading more...
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <MasonryLayout>
                    {items.map((item) => (
                      <ItemCard
                        key={`${item.type}-${item.id}`}
                        ref={(el) => setCardRef(item.id, el)}
                        variant="grid"
                        item={item}
                        isSelected={selectedItems.has(item.id)}
                        onCardClick={handleCardClick}
                      />
                    ))}
                    {/* Infinite scroll trigger */}
                    <div ref={loadMoreRef} className="h-4 w-full" />
                    {isFetchingNextPage && (
                      <div className="flex items-center justify-center w-full py-4 col-span-full">
                        <p className="text-sm text-muted-foreground">
                          Loading more...
                        </p>
                      </div>
                    )}
                  </MasonryLayout>
                )}
              </>
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
