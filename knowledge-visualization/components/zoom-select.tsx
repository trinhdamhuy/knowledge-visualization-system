"use client";

import { useCallback } from "react";
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
  const { zoomTo, fitView } = useReactFlow();

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
    const zoomIncrement = 50;

    for (
      let i = Math.ceil(minZoom * 100);
      i <= Math.floor(maxZoom * 100);
      i += zoomIncrement
    ) {
      levels.push((i / 100).toString());
    }

    return levels;
  });

  return (
    <Select onValueChange={handleZoomChange}>
      <SelectTrigger
        size="sm"
        className="w-24 border-none bg-transparent dark:bg-transparent"
      >
        <SelectValue placeholder="Zoom" />
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
