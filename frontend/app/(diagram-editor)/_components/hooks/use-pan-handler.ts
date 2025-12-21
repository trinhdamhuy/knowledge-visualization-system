import { useCallback, useRef, useMemo } from "react";
import { ReactFlowInstance } from "@xyflow/react";
import { isReactFlowElement } from "../utils/intersection-utils";

interface UsePanHandlerOptions {
  reactFlowInstance: ReactFlowInstance | null;
}

interface UsePanHandlerReturn {
  handleMouseDown: (e: React.MouseEvent) => void;
  handleMouseMove: (e: MouseEvent) => void;
  handleMouseUp: (e: MouseEvent) => void;
  isPanning: () => boolean;
}

/**
 * Custom hook for handling right mouse button panning
 */
export function usePanHandler({
  reactFlowInstance,
}: UsePanHandlerOptions): UsePanHandlerReturn {
  const isPanningRef = useRef(false);
  const panStartRef = useRef<{ x: number; y: number } | null>(null);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      // Only handle right mouse button
      if (e.button !== 2 || !reactFlowInstance) return;

      // Don't pan if clicking on a node or edge
      const target = e.target as HTMLElement;
      if (isReactFlowElement(target)) {
        return;
      }

      isPanningRef.current = true;
      panStartRef.current = {
        x: e.clientX,
        y: e.clientY,
      };
    },
    [reactFlowInstance]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isPanningRef.current || !panStartRef.current || !reactFlowInstance)
        return;

      const deltaX = e.clientX - panStartRef.current.x;
      const deltaY = e.clientY - panStartRef.current.y;

      // Get current viewport
      const viewport = reactFlowInstance.getViewport();

      // Update viewport
      reactFlowInstance.setViewport({
        x: viewport.x + deltaX,
        y: viewport.y + deltaY,
        zoom: viewport.zoom,
      });

      // Update pan start position
      panStartRef.current = {
        x: e.clientX,
        y: e.clientY,
      };
    },
    [reactFlowInstance]
  );

  const handleMouseUp = useCallback((e: MouseEvent) => {
    if (e.button === 2) {
      isPanningRef.current = false;
      panStartRef.current = null;
    }
  }, []);

  const isPanning = useCallback(() => isPanningRef.current, []);

  return useMemo(
    () => ({
      handleMouseDown,
      handleMouseMove,
      handleMouseUp,
      isPanning,
    }),
    [handleMouseDown, handleMouseMove, handleMouseUp, isPanning]
  );
}
