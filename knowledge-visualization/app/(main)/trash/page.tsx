"use client";

import { useState, useEffect, useRef } from "react";
import { MasonryLayout } from "@/app/_components/layouts/masonry-layout";
import { TrashItemCard } from "@/app/_components/cards/trash-item-card";
import { Button } from "@/components/ui/button";
import { Grid3X3, List } from "lucide-react";
import { useTrashItems, useRestoreTrash, usePermanentDeleteTrash } from "@/hooks/use-trash";
import { toast } from "sonner";
import type { TrashItem } from "@/types/trash";

export default function TrashPage() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const {
    items,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useTrashItems();
  const { restore, isRestoring } = useRestoreTrash();
  const { permanentDelete, isDeleting } = usePermanentDeleteTrash();

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

  const handleRestore = async (item: TrashItem) => {
    try {
      const success = await restore({ item });
      if (success) {
        toast.success(
          `${item.type === "diagram" ? "Diagram" : "Folder"} restored successfully`
        );
      } else {
        toast.error("Failed to restore item");
      }
    } catch (error) {
      console.error("Error restoring item:", error);
      toast.error("An error occurred while restoring the item");
    }
  };

  const handlePermanentDelete = async (item: TrashItem) => {
    if (
      !confirm(
        `Are you sure you want to permanently delete this ${item.type}? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      const success = await permanentDelete({ item });
      if (success) {
        toast.success(
          `${item.type === "diagram" ? "Diagram" : "Folder"} permanently deleted`
        );
      } else {
        toast.error("Failed to delete item");
      }
    } catch (error) {
      console.error("Error deleting item:", error);
      toast.error("An error occurred while deleting the item");
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between px-8">
        <h1 className="text-2xl font-bold">Trash</h1>
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
          <p className="text-muted-foreground">Trash is empty</p>
        </div>
      ) : (
        <>
          {viewMode === "list" ? (
            <div className="flex flex-col w-full items-center justify-center space-y-4 px-8">
              {items.map((item) => (
                <div key={`${item.type}-${item.id}`} className="w-full max-w-4xl">
                  <TrashItemCard
                    variant="list"
                    item={item}
                    onRestore={handleRestore}
                    onPermanentDelete={handlePermanentDelete}
                    isRestoring={isRestoring}
                    isDeleting={isDeleting}
                  />
                </div>
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
                <TrashItemCard
                  key={`${item.type}-${item.id}`}
                  variant="grid"
                  item={item}
                  onRestore={handleRestore}
                  onPermanentDelete={handlePermanentDelete}
                  isRestoring={isRestoring}
                  isDeleting={isDeleting}
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
    </div>
  );
}
