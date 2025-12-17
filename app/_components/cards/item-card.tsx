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
  onCardRightClick?: (id: string, e: React.MouseEvent) => void;
}

export const ItemCard = forwardRef<HTMLDivElement, ItemCardProps>(
  function ItemCard(
    { variant, item, isSelected, onCardClick, onCardRightClick },
    ref
  ) {
    if (item.type === "folder") {
      return (
        <FolderCard
          ref={ref}
          variant={variant}
          folder={item}
          isSelected={isSelected}
          onCardClick={onCardClick}
          onCardRightClick={onCardRightClick}
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
        onCardRightClick={onCardRightClick}
      />
    );
  }
);
