import { useCallback, useMemo } from "react";
import { ReactFlowInstance } from "@xyflow/react";
import { isReactFlowElement } from "../utils/intersection-utils";
import { MIN_ZOOM, MAX_ZOOM } from "../utils/interaction-constants";

interface UseWheelZoomOptions {
  reactFlowInstance: ReactFlowInstance | null;
}

interface UseWheelZoomReturn {
  handleWheel: (e: React.WheelEvent) => void;
}

/**
 * Custom hook for handling wheel zoom
 */
export function useWheelZoom({
  reactFlowInstance,
}: UseWheelZoomOptions): UseWheelZoomReturn {
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (!reactFlowInstance) return;

      // Don't zoom if scrolling on a node or edge
      if (isReactFlowElement(e.target as HTMLElement)) {
        return;
      }

      // Prevent default scrolling and browser zoom
      e.preventDefault();
      e.stopPropagation();

      // Get current zoom
      const viewport = reactFlowInstance.getViewport();
      const currentZoom = viewport.zoom;

      // Determine zoom direction (positive = zoom out, negative = zoom in)
      const zoomDirection = e.deltaY > 0 ? -1 : 1;

      // Calculate new zoom with 25% increment per step
      // Zoom in: multiply by 1.25 (+25%), Zoom out: multiply by 0.75 (-25%)
      const zoomMultiplier = zoomDirection > 0 ? 1.25 : 0.75;
      let newZoom = currentZoom * zoomMultiplier;

      // Clamp to min/max zoom limits
      newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, newZoom));

      // Zoom towards mouse position
      reactFlowInstance.zoomTo(newZoom);
    },
    [reactFlowInstance]
  );

  return useMemo(() => ({ handleWheel }), [handleWheel]);
}
