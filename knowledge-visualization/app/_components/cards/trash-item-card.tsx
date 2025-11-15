"use client";

import { TrashItem } from "@/types/trash";
import { DiagramCard } from "./diagram-card";
import { FolderCard } from "./folder-card";
import { Button } from "@/components/ui/button";
import { RotateCcw, Trash2 } from "lucide-react";
import { forwardRef } from "react";

// Helper function to format date
function formatDistanceToNow(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return "just now";
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes !== 1 ? "s" : ""} ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours !== 1 ? "s" : ""} ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) {
    return `${diffInDays} day${diffInDays !== 1 ? "s" : ""} ago`;
  }

  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths} month${diffInMonths !== 1 ? "s" : ""} ago`;
  }

  const diffInYears = Math.floor(diffInMonths / 12);
  return `${diffInYears} year${diffInYears !== 1 ? "s" : ""} ago`;
}

interface TrashItemCardProps {
  variant: "list" | "grid";
  item: TrashItem;
  onRestore?: (item: TrashItem) => void;
  onPermanentDelete?: (item: TrashItem) => void;
  isRestoring?: boolean;
  isDeleting?: boolean;
}

export const TrashItemCard = forwardRef<HTMLDivElement, TrashItemCardProps>(
  function TrashItemCard(
    {
      variant,
      item,
      onRestore,
      onPermanentDelete,
      isRestoring = false,
      isDeleting = false,
    },
    ref
  ) {
    const deletedAt = new Date(item.trash.deletedAt);
    const autoDeleteAt = new Date(item.trash.autoDeleteAt);
    const daysUntilAutoDelete = Math.ceil(
      (autoDeleteAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );

    const cardContent =
      item.type === "folder" ? (
        <FolderCard
          ref={ref}
          variant={variant}
          folder={item}
          isSelected={false}
        />
      ) : (
        <DiagramCard
          ref={ref}
          variant={variant}
          diagram={item}
          isSelected={false}
        />
      );

    return (
      <div className="relative group">
        {cardContent}
        <div className="absolute inset-0 bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onRestore?.(item)}
            disabled={isRestoring || isDeleting}
          >
            <RotateCcw className="size-4 mr-2" />
            Restore
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => onPermanentDelete?.(item)}
            disabled={isRestoring || isDeleting}
          >
            <Trash2 className="size-4 mr-2" />
            Delete Forever
          </Button>
        </div>
        <div className="mt-2 text-xs text-muted-foreground">
          <p>Deleted {formatDistanceToNow(deletedAt)}</p>
          {daysUntilAutoDelete > 0 ? (
            <p className="text-orange-500">
              Auto-deletes in {daysUntilAutoDelete} day
              {daysUntilAutoDelete !== 1 ? "s" : ""}
            </p>
          ) : (
            <p className="text-red-500">Will be auto-deleted soon</p>
          )}
        </div>
      </div>
    );
  }
);

