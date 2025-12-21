"use client";

import { useCallback, useEffect, useState } from "react";
import { useReactFlow, useStore } from "@xyflow/react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "react-aria-components";

export default function ZoomSelect() {
  const { zoomTo, fitView, getZoom } = useReactFlow();
  const [currentZoom, setCurrentZoom] = useState<string>("");

  // Subscribe to zoom changes
  const zoom = useStore((state) => state.transform[2]);

  // Update current zoom display when zoom changes
  useEffect(() => {
    // Use zoom directly from store instead of getZoom() to avoid dependency issues
    const zoomPercent = Math.round(zoom * 100);
    setCurrentZoom(zoomPercent.toString());
  }, [zoom]);

  const handleZoomChange = useCallback(
    (value: string) => {
      if (value === "best-fit") {
        fitView();
      } else {
        const zoomValue = parseFloat(value);
        if (!isNaN(zoomValue)) {
          zoomTo(zoomValue);
        }
      }
    },
    [fitView, zoomTo]
  );

  const zoomLevels = useStore((state) => {
    const { minZoom, maxZoom } = state;
    const levels = [];
    const zoomIncrement = 25; // Smaller increment for more options

    for (
      let i = Math.ceil(minZoom * 100);
      i <= Math.floor(maxZoom * 100);
      i += zoomIncrement
    ) {
      levels.push((i / 100).toString());
    }

    return levels;
  });

  // Find closest zoom level for display
  const getDisplayValue = () => {
    if (!currentZoom) return "Zoom";
    const zoomFloat = parseFloat(currentZoom) / 100;

    // Check if current zoom matches a level
    const exactMatch = zoomLevels.find(
      (level) => Math.abs(parseFloat(level) - zoomFloat) < 0.01
    );

    if (exactMatch) {
      return `${(parseFloat(exactMatch) * 100).toFixed(0)}%`;
    }

    // Return current zoom percentage
    return `${parseFloat(currentZoom)}%`;
  };

  return (
    <Select
      value={
        currentZoom ? (parseFloat(currentZoom) / 100).toString() : undefined
      }
      onValueChange={handleZoomChange}
    >
      <SelectTrigger className="w-24">
        <SelectValue placeholder="Zoom">{getDisplayValue()}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="best-fit">Best Fit</SelectItem>
        <Separator className="my-1" />
        {zoomLevels.map((level) => (
          <SelectItem key={level} value={level}>
            {`${(parseFloat(level) * 100).toFixed(0)}%`}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
