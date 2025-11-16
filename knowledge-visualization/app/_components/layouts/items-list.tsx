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
import type { DiagramSortBy, SortDirection, Item } from "@/types";
import { ReactNode } from "react";

interface ItemsListProps {
  onlyMine?: boolean; // If true, only show items owned by current user (for my-diagrams)
  items?: Item[]; // Custom items array (for trash page)
  isLoading?: boolean;
  isFetchingNextPage?: boolean;
  hasNextPage?: boolean;
  fetchNextPage?: () => void;
  sortBy?: DiagramSortBy | string;
  sortDirection?: SortDirection;
  onSortByChange?: (sortBy: DiagramSortBy | string) => void;
  onSortDirectionChange?: (sortDirection: SortDirection) => void;
  sortByOptions?: Array<{ label: string; value: DiagramSortBy | string }>;
  renderContextMenu?: (item: Item) => ReactNode;
  showCreateButtons?: boolean; // Show create buttons (default: true)
}

export function ItemsList({
  onlyMine = false,
  items: customItems,
  isLoading: customIsLoading,
  isFetchingNextPage: customIsFetchingNextPage,
  hasNextPage: customHasNextPage,
  fetchNextPage: customFetchNextPage,
  sortBy: customSortBy,
  sortDirection: customSortDirection,
  onSortByChange: customOnSortByChange,
  onSortDirectionChange: customOnSortDirectionChange,
  sortByOptions: customSortByOptions,
  renderContextMenu,
  showCreateButtons = true,
}: ItemsListProps = {}) {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [internalSortBy, setInternalSortBy] =
    useState<DiagramSortBy>("updatedAt");
  const [internalSortDirection, setInternalSortDirection] =
    useState<SortDirection>("desc");

  // Use custom items if provided, otherwise use hook
  const itemsQuery = useItems({
    onlyMine,
    sortBy: internalSortBy as DiagramSortBy,
    sortDirection: internalSortDirection,
  });

  const items = customItems ?? itemsQuery.items;
  const isLoading = customIsLoading ?? itemsQuery.isLoading;
  const isFetchingNextPage =
    customIsFetchingNextPage ?? itemsQuery.isFetchingNextPage;
  const hasNextPage = customHasNextPage ?? itemsQuery.hasNextPage;
  const fetchNextPage = customFetchNextPage ?? itemsQuery.fetchNextPage;

  const sortBy = customSortBy ?? internalSortBy;
  const sortDirection = customSortDirection ?? internalSortDirection;
  const onSortByChange =
    customOnSortByChange ??
    ((value: DiagramSortBy | string) =>
      setInternalSortBy(value as DiagramSortBy));
  const onSortDirectionChange =
    customOnSortDirectionChange ?? setInternalSortDirection;
  const {
    selectedItems,
    isSelecting,
    selectionBox,
    selectionRef,
    handleCardClick,
    handleCardRightClick,
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

  const defaultSortByOptions: Array<{
    label: string;
    value: DiagramSortBy | string;
  }> = [
    {
      label: "Name",
      value: "name",
    },
    {
      label: "Date created",
      value: "createdAt",
    },
    {
      label: "Date updated",
      value: "updatedAt",
    },
  ];

  const sortByOptions = customSortByOptions ?? defaultSortByOptions;

  return (
    <div className="flex flex-col gap-4">
      {showCreateButtons && (
        <>
          <div className="flex gap-4 px-8">
            <CreateButton
              label="Create Diagram"
              icon={<Plus />}
              onClick={() => setIsCreateDialogOpen(true)}
            />
            <CreateButton
              label="Create Diagram with AI"
              icon={
                <Sparkles animate loop loopDelay={1000} initialOnAnimateEnd />
              }
            />
          </div>
          <CreateDiagramDialog
            open={isCreateDialogOpen}
            onOpenChange={setIsCreateDialogOpen}
          />
          <Separator className="w-[95%] mx-auto" />
        </>
      )}

      <ContextMenu>
        <ContextMenuTrigger>
          <div
            ref={selectionRef}
            className="flex flex-col w-full min-h-[74.5vh] px-8 relative"
            onMouseDown={handleMouseDown}
          >
            <div className="flex items-center justify-between mb-4">
              <SortDropdown
                sortBy={sortBy}
                sortDirection={sortDirection}
                onSortByChange={onSortByChange}
                onSortDirectionChange={onSortDirectionChange}
                sortByOptions={sortByOptions}
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
                        onCardRightClick={handleCardRightClick}
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
                        onCardRightClick={handleCardRightClick}
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
        {renderContextMenu ? (
          selectedItems.size > 0 && (
            <ContextMenuContent>
              {(() => {
                const firstSelectedId = Array.from(selectedItems)[0];
                const item = items.find((i) => i.id === firstSelectedId);
                return item ? renderContextMenu(item) : null;
              })()}
            </ContextMenuContent>
          )
        ) : (
          <ContextMenuContent>
            <ContextMenuItem>
              <Copy />
              Copy
            </ContextMenuItem>
          </ContextMenuContent>
        )}
      </ContextMenu>
    </div>
  );
}
