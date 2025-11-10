"use client";

import { useRef, useState, useEffect, useCallback } from "react";

interface SelectionBox {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

export function useItemSelection() {
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionBox, setSelectionBox] = useState<SelectionBox | null>(null);
  const selectionRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const startPosRef = useRef<{ x: number; y: number } | null>(null);
  const hasMovedRef = useRef(false);

  const checkIntersection = useCallback(
    (box: SelectionBox, element: HTMLElement): boolean => {
      const rect = element.getBoundingClientRect();
      const containerRect = selectionRef.current?.getBoundingClientRect();
      if (!containerRect) return false;

      const elementLeft = rect.left - containerRect.left;
      const elementTop = rect.top - containerRect.top;
      const elementRight = elementLeft + rect.width;
      const elementBottom = elementTop + rect.height;

      const boxLeft = Math.min(box.startX, box.endX);
      const boxTop = Math.min(box.startY, box.endY);
      const boxRight = Math.max(box.startX, box.endX);
      const boxBottom = Math.max(box.startY, box.endY);

      return !(
        elementRight < boxLeft ||
        elementLeft > boxRight ||
        elementBottom < boxTop ||
        elementTop > boxBottom
      );
    },
    []
  );

  const handleCardClick = useCallback(
    (diagramId: string, e: React.MouseEvent) => {
      // Prevent event from bubbling to container
      e.stopPropagation();

      // If Ctrl/Cmd is held, toggle selection
      if (e.ctrlKey || e.metaKey) {
        setSelectedItems((prev) => {
          const newSelected = new Set(prev);
          if (newSelected.has(diagramId)) {
            newSelected.delete(diagramId);
          } else {
            newSelected.add(diagramId);
          }
          return newSelected;
        });
      } else {
        // Otherwise, select only this card
        setSelectedItems(new Set([diagramId]));
      }
    },
    []
  );

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only left mouse button
    if ((e.target as HTMLElement).closest("button")) return; // Don't start selection on buttons
    if ((e.target as HTMLElement).closest("a")) return; // Don't start selection on links
    if ((e.target as HTMLElement).closest('[role="menuitem"]')) return; // Don't start on context menu items
    // Don't start selection if clicking on a card
    if ((e.target as HTMLElement).closest('[data-slot="card"]')) return;

    const rect = selectionRef.current?.getBoundingClientRect();
    if (!rect) return;

    // Prevent default drag behavior
    e.preventDefault();
    e.stopPropagation();

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    startPosRef.current = { x, y };
    hasMovedRef.current = false;
    setIsSelecting(true);

    // Clear selection if not holding Ctrl/Cmd
    if (!e.ctrlKey && !e.metaKey) {
      setSelectedItems(new Set());
    }
  }, []);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isSelecting || !startPosRef.current || !selectionRef.current) return;

      // Prevent default drag behavior
      e.preventDefault();
      e.stopPropagation();

      const rect = selectionRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Check if mouse has moved enough to consider it a drag
      const distance = Math.sqrt(
        Math.pow(x - startPosRef.current.x, 2) +
          Math.pow(y - startPosRef.current.y, 2)
      );

      if (distance > 5) {
        // Minimum 5px movement to start selection
        hasMovedRef.current = true;
      }

      if (!hasMovedRef.current) return;

      const currentBox = {
        startX: startPosRef.current.x,
        startY: startPosRef.current.y,
        endX: x,
        endY: y,
      };

      setSelectionBox(currentBox);

      // Update selected items based on intersection
      const newSelected = new Set<string>();
      cardRefs.current.forEach((element, diagramId) => {
        const intersects = checkIntersection(currentBox, element);
        if (intersects) {
          newSelected.add(diagramId);
        }
      });

      // If Ctrl/Cmd is held, merge with existing selection
      if (e.ctrlKey || e.metaKey) {
        selectedItems.forEach((id) => newSelected.add(id));
      }

      setSelectedItems(newSelected);
    },
    [isSelecting, selectedItems, checkIntersection]
  );

  const handleMouseUp = useCallback(() => {
    // If user didn't drag, clear selection (unless Ctrl/Cmd was held)
    if (!hasMovedRef.current && !selectedItems.size) {
      setSelectedItems(new Set());
    }
    setIsSelecting(false);
    setSelectionBox(null);
    startPosRef.current = null;
    hasMovedRef.current = false;
  }, [selectedItems]);

  useEffect(() => {
    if (isSelecting) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isSelecting, handleMouseMove, handleMouseUp]);

  const setCardRef = useCallback(
    (diagramId: string, element: HTMLDivElement | null) => {
      if (element) {
        cardRefs.current.set(diagramId, element);
      } else {
        cardRefs.current.delete(diagramId);
      }
    },
    []
  );

  return {
    selectedItems,
    isSelecting,
    selectionBox,
    selectionRef,
    handleCardClick,
    handleMouseDown,
    setCardRef,
  };
}
