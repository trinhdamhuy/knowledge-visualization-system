"use client";

import { Button } from "@/components/ui/button";
import { Grid3X3, List } from "lucide-react";
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
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { useItemSelection } from "@/app/(main)/_hooks/use-item-selection";
import { CreateDiagramDialog } from "../dialogs/create-diagram-dialog";
import { useItems } from "@/hooks/use-items";
import type { DiagramSortBy, SortDirection, Item } from "@/types";
import { ReactNode, useMemo } from "react";
import { UnifiedContextMenu } from "../context-menus/unified-context-menu";
import { useUnifiedKeyboardShortcuts } from "@/app/(main)/_hooks/use-unified-keyboard-shortcuts";
import type { TrashItem } from "@/types/trash";

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
  renderContextMenu?: (item: Item) => ReactNode; // Deprecated: kept for backward compatibility
  showCreateButtons?: boolean; // Show create buttons (default: true)
  isTrashMode?: boolean; // If true, use trash-specific context menu and disable normal shortcuts
  renderTrashContextMenu?: (selectedItems: Item[]) => ReactNode; // Custom trash background context menu
  trashItemsMap?: Map<string, TrashItem>; // Map of trash items for keyboard shortcuts (only in trash mode)
  onRename?: (item: Item) => void; // Callback for rename action
  onDeleteItem?: (item: Item) => void; // Callback for delete single item action
  onShare?: (item: Item) => void; // Callback for share action
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
  isTrashMode = false,
  renderTrashContextMenu,
  trashItemsMap,
  onRename,
  onDeleteItem,
  onShare,
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

  // Filter selected items to only include diagrams (not folders)
  const selectedDiagramIds = useMemo(() => {
    return Array.from(selectedItems).filter((itemId) => {
      const item = items.find((i) => i.id === itemId);
      return item?.type === "diagram";
    });
  }, [selectedItems, items]);

  // Get selected items for trash mode
  const selectedItemsArray = useMemo(() => {
    return Array.from(selectedItems)
      .map((itemId) => items.find((i) => i.id === itemId))
      .filter((item): item is Item => item !== undefined);
  }, [selectedItems, items]);

  // Get selected trash items for keyboard shortcuts (only in trash mode)
  const selectedTrashItems = useMemo(() => {
    if (!isTrashMode || !trashItemsMap) return [];
    return Array.from(selectedItems)
      .map((itemId) => trashItemsMap.get(itemId))
      .filter((item): item is TrashItem => item !== undefined);
  }, [isTrashMode, trashItemsMap, selectedItems]);

  // Handle unified keyboard shortcuts
  useUnifiedKeyboardShortcuts({
    selectedDiagramIds: isTrashMode ? [] : selectedDiagramIds,
    selectedTrashItems: isTrashMode ? selectedTrashItems : [],
    isTrashMode,
    onCopy: () => {
      // Selection will remain after copy
    },
    onDelete: () => {
      // Selection will be cleared when items are removed
    },
    onRestore: () => {
      // Selection will be cleared when items are removed
    },
    enabled: true,
  });

  return (
    <div className="flex flex-col gap-4">
      {showCreateButtons && (
        <>
          <div className="flex gap-4 px-8">
            <CreateButton
              label="Create Diagram"
              icon={
                <Sparkles animate loop loopDelay={1000} initialOnAnimateEnd />
              }
              onClick={() => setIsCreateDialogOpen(true)}
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
                    {items.map((item) => {
                      const card = (
                        <ItemCard
                          key={`${item.type}-${item.id}`}
                          ref={(el) => setCardRef(item.id, el)}
                          variant="list"
                          item={item}
                          isSelected={selectedItems.has(item.id)}
                          onCardClick={handleCardClick}
                          onCardRightClick={handleCardRightClick}
                        />
                      );

                      // Wrap with ContextMenu if renderContextMenu is provided
                      if (renderContextMenu) {
                        return (
                          <ContextMenu key={`${item.type}-${item.id}`}>
                            <ContextMenuTrigger asChild>
                              {card}
                            </ContextMenuTrigger>
                            <ContextMenuContent className="w-52">
                              {renderContextMenu(item)}
                            </ContextMenuContent>
                          </ContextMenu>
                        );
                      }

                      return card;
                    })}
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
                    {items.map((item) => {
                      const card = (
                        <ItemCard
                          key={`${item.type}-${item.id}`}
                          ref={(el) => setCardRef(item.id, el)}
                          variant="grid"
                          item={item}
                          isSelected={selectedItems.has(item.id)}
                          onCardClick={handleCardClick}
                          onCardRightClick={handleCardRightClick}
                        />
                      );

                      // Wrap with ContextMenu if renderContextMenu is provided
                      if (renderContextMenu) {
                        return (
                          <ContextMenu key={`${item.type}-${item.id}`}>
                            <ContextMenuTrigger asChild>
                              {card}
                            </ContextMenuTrigger>
                            <ContextMenuContent className="w-52">
                              {renderContextMenu(item)}
                            </ContextMenuContent>
                          </ContextMenu>
                        );
                      }

                      return card;
                    })}
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
        <ContextMenuContent className="w-52">
          {isTrashMode && renderTrashContextMenu ? (
            renderTrashContextMenu(selectedItemsArray)
          ) : (
            <UnifiedContextMenu
              selectedDiagramIds={selectedDiagramIds}
              selectedItems={selectedItemsArray}
              selectedTrashItems={selectedTrashItems}
              isTrashMode={isTrashMode}
              showCreate={showCreateButtons && !isTrashMode}
              onCreate={() => setIsCreateDialogOpen(true)}
              onCopy={() => {
                // Clear selection after copy if needed
              }}
              onDelete={() => {
                // Clear selection after delete
                // The selection will be cleared automatically when items are removed
              }}
              onRestore={() => {
                // Selection will be cleared when items are removed
              }}
              onRename={onRename}
              onDeleteItem={onDeleteItem}
              onShare={onShare}
            />
          )}
        </ContextMenuContent>
      </ContextMenu>
    </div>
  );
}
