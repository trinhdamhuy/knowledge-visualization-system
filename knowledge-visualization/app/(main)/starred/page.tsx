"use client";

import { useStarredDiagrams } from "@/hooks/use-starred";
import { ItemCard } from "@/app/_components/cards/item-card";
import { useItemSelection } from "@/app/(main)/_hooks/use-item-selection";
import { Button } from "@/components/ui/button";
import { Grid3X3, List } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { MasonryLayout } from "@/app/_components/layouts/masonry-layout";
import { SortDropdown } from "@/app/_components/buttons/sort-dropdown";

export default function StarredPage() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const {
    items,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useStarredDiagrams();
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
      <div className="flex flex-col w-full min-h-[74.5vh] px-8 relative">
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

        {isLoading ? (
          <div className="flex items-center justify-center w-full h-64">
            <p className="text-muted-foreground">Loading...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="flex items-center justify-center w-full h-64">
            <p className="text-muted-foreground">No starred diagrams found</p>
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
  );
}
