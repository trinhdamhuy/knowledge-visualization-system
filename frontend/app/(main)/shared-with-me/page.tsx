"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useSharedDiagrams } from "@/hooks/use-shared";
import { ItemCard } from "@/app/_components/cards/item-card";
import { useItemSelection } from "@/app/(main)/_hooks/use-item-selection";
import { Button } from "@/components/ui/button";
import { Grid3X3, List } from "lucide-react";
import { MasonryLayout } from "@/app/_components/layouts/masonry-layout";
import { SortDropdown } from "@/app/_components/buttons/sort-dropdown";
import { RenameDiagramDialog } from "@/app/_components/dialogs/rename-diagram-dialog";
import { DeleteDiagramDialog } from "@/app/_components/dialogs/delete-diagram-dialog";
import { ShareDialog } from "@/app/_components/dialogs/share-dialog";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { UnifiedContextMenu } from "@/app/_components/context-menus/unified-context-menu";
import type { Item } from "@/types";
import type { DiagramSortBy, SortDirection } from "@/types/diagram";

export default function SharedWithMePage() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState<DiagramSortBy | "sharedAt">("updatedAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [renameDialog, setRenameDialog] = useState<{
    open: boolean;
    item: Item | null;
  }>({ open: false, item: null });
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    item: Item | null;
  }>({ open: false, item: null });
  const [shareDialog, setShareDialog] = useState<{
    open: boolean;
    item: Item | null;
  }>({ open: false, item: null });

  const { items, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } =
    useSharedDiagrams({
      sortBy: sortBy === "sharedAt" ? "sharedAt" : sortBy,
      sortDirection,
    });
  const { selectedItems, handleCardClick, handleCardRightClick, setCardRef } =
    useItemSelection();

  // Filter selected items to only include diagrams (not folders)
  const selectedDiagramIds = useMemo(() => {
    return Array.from(selectedItems).filter((itemId) => {
      const item = items.find((i) => i.id === itemId);
      return item?.type === "diagram";
    });
  }, [selectedItems, items]);

  // Get selected items array
  const selectedItemsArray = useMemo(() => {
    return Array.from(selectedItems)
      .map((itemId) => items.find((i) => i.id === itemId))
      .filter((item): item is Item => item !== undefined);
  }, [selectedItems, items]);

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

  const handleRename = (item: Item) => {
    setRenameDialog({ open: true, item });
  };

  const handleDelete = (item: Item) => {
    setDeleteDialog({ open: true, item });
  };

  const handleShare = (item: Item) => {
    setShareDialog({ open: true, item });
  };

  const sortByOptions = [
    { label: "Name", value: "name" },
    { label: "Date created", value: "createdAt" },
    { label: "Date updated", value: "updatedAt" },
    { label: "Date shared", value: "sharedAt" },
  ];

  return (
    <>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col w-full min-h-[74.5vh] px-8 relative">
          <div className="flex items-center justify-between mb-4">
            <SortDropdown
              sortBy={sortBy}
              sortDirection={sortDirection}
              onSortByChange={(value) =>
                setSortBy(value as DiagramSortBy | "sharedAt")
              }
              onSortDirectionChange={(value) =>
                setSortDirection(value as SortDirection)
              }
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
              <p className="text-muted-foreground">No shared diagrams found</p>
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

                    return (
                      <ContextMenu key={`${item.type}-${item.id}`}>
                        <ContextMenuTrigger asChild>{card}</ContextMenuTrigger>
                        <ContextMenuContent className="w-52">
                          <UnifiedContextMenu
                            selectedDiagramIds={selectedDiagramIds}
                            selectedItems={selectedItemsArray}
                            onRename={handleRename}
                            onDeleteItem={handleDelete}
                            onShare={handleShare}
                          />
                        </ContextMenuContent>
                      </ContextMenu>
                    );
                  })}
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

                    return (
                      <ContextMenu key={`${item.type}-${item.id}`}>
                        <ContextMenuTrigger asChild>{card}</ContextMenuTrigger>
                        <ContextMenuContent className="w-52">
                          <UnifiedContextMenu
                            selectedDiagramIds={selectedDiagramIds}
                            selectedItems={selectedItemsArray}
                            onRename={handleRename}
                            onDeleteItem={handleDelete}
                            onShare={handleShare}
                          />
                        </ContextMenuContent>
                      </ContextMenu>
                    );
                  })}
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
        </div>
      </div>

      {renameDialog.item && (
        <RenameDiagramDialog
          open={renameDialog.open}
          onOpenChange={(open) =>
            setRenameDialog({ open, item: open ? renameDialog.item : null })
          }
          diagramId={renameDialog.item.id}
          currentTitle={renameDialog.item.name}
        />
      )}
      {deleteDialog.item && (
        <DeleteDiagramDialog
          open={deleteDialog.open}
          onOpenChange={(open) =>
            setDeleteDialog({ open, item: open ? deleteDialog.item : null })
          }
          diagramId={deleteDialog.item.id}
          diagramTitle={deleteDialog.item.name}
        />
      )}
      {shareDialog.item && (
        <ShareDialog
          open={shareDialog.open}
          onOpenChange={(open) =>
            setShareDialog({ open, item: open ? shareDialog.item : null })
          }
          diagramId={shareDialog.item.id}
        />
      )}
    </>
  );
}
