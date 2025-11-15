"use client";

import { Item } from "@/types";
import { DiagramCard } from "./diagram-card";
import { FolderCard } from "./folder-card";
import { forwardRef } from "react";

interface ItemCardProps {
  variant: "list" | "grid";
  item: Item;
  isSelected?: boolean;
  onCardClick?: (id: string, e: React.MouseEvent) => void;
}

export const ItemCard = forwardRef<HTMLDivElement, ItemCardProps>(
  function ItemCard({ variant, item, isSelected, onCardClick }, ref) {
    if (item.type === "folder") {
      return (
        <FolderCard
          ref={ref}
          variant={variant}
          folder={item}
          isSelected={isSelected}
          onCardClick={onCardClick}
        />
      );
    }

    return (
      <DiagramCard
        ref={ref}
        variant={variant}
        diagram={item}
        isSelected={isSelected}
        onCardClick={onCardClick}
      />
    );
  }
);
