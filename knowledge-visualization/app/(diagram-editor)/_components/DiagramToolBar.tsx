"use client";
import {
  ArrowsPointingOutIcon,
  CursorArrowRaysIcon,
  MagnifyingGlassPlusIcon,
  MagnifyingGlassMinusIcon,
  HandRaisedIcon,
  TagIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import { Toolbar, ToolbarGroup, ToolbarItem } from "@/components/ui/toolbar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useCallback } from "react";
import type { RefObject } from "react";
import type { ReactFlowInstance } from "@xyflow/react";
import { useDiagramStore } from "../_store/use-diagram-store";

export function DiagramToolBar({
  reactFlowInstance,
}: {
  reactFlowInstance: RefObject<ReactFlowInstance | null>;
}) {
  const {
    setMode,
    setFullscreen,
    setMoveActive,
    setSelectActive,
    fullscreen,
    moveActive,
    selectActive,
  } = useDiagramStore();

  const handleFullscreen = useCallback(() => {
    if (fullscreen) {
      document.exitFullscreen?.();
    } else {
      document.documentElement.requestFullscreen?.();
    }
    setFullscreen(!fullscreen);
  }, [fullscreen, setFullscreen]);

  const handleToCenter = useCallback(() => {
    reactFlowInstance.current?.fitView();
  }, [reactFlowInstance]);

  const handleZoomIn = useCallback(() => {
    reactFlowInstance.current?.zoomIn?.();
  }, [reactFlowInstance]);

  const handleZoomOut = useCallback(() => {
    reactFlowInstance.current?.zoomOut?.();
  }, [reactFlowInstance]);

  const handleResetZoom = useCallback(() => {
    reactFlowInstance.current?.fitView();
  }, [reactFlowInstance]);

  const handleMove = useCallback(() => {
    setMode("move");
    setMoveActive(true);
    setSelectActive(false);
  }, [setMode, setMoveActive, setSelectActive]);

  const handleSelect = useCallback(() => {
    setMode("select");
    setSelectActive(true);
    setMoveActive(false);
  }, [setMode, setSelectActive, setMoveActive]);

  const TOOLBAR_ITEMS = [
    {
      label: "Fullscreen",
      Icon: ArrowsPointingOutIcon,
      onClick: handleFullscreen,
      active: fullscreen,
    },
    {
      label: "To center",
      Icon: TagIcon,
      onClick: handleToCenter,
      active: false,
    },
    {
      label: "Zoom in",
      Icon: MagnifyingGlassPlusIcon,
      onClick: handleZoomIn,
      active: false,
    },
    {
      label: "Zoom out",
      Icon: MagnifyingGlassMinusIcon,
      onClick: handleZoomOut,
      active: false,
    },
    {
      label: "Reset zoom",
      Icon: MagnifyingGlassIcon,
      onClick: handleResetZoom,
      active: false,
    },
    {
      label: "Move canvas",
      Icon: HandRaisedIcon,
      onClick: handleMove,
      active: moveActive,
    },
    {
      label: "Select",
      Icon: CursorArrowRaysIcon,
      onClick: handleSelect,
      active: selectActive,
    },
  ];

  return (
    <Toolbar
      orientation="vertical"
      aria-label="Diagram tools"
      className="fixed left-4 top-1/2 -translate-y-1/2 z-40 flex flex-col gap-1 bg-card"
    >
      <ToolbarGroup className="flex flex-col gap-1">
        {TOOLBAR_ITEMS.map((item) => (
          <Tooltip key={item.label}>
            <TooltipTrigger asChild>
              <ToolbarItem
                aria-label={item.label}
                size="sq-lg"
                onClick={item.onClick}
                className={item.active ? "bg-blue-500 text-white" : ""}
              >
                <item.Icon className="h-6 w-6" />
              </ToolbarItem>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={10}>
              {item.label}
            </TooltipContent>
          </Tooltip>
        ))}
      </ToolbarGroup>
    </Toolbar>
  );
}
