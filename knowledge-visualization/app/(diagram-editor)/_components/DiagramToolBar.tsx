"use client";
import { CursorArrowRaysIcon } from "@heroicons/react/24/outline";
import { Toolbar, ToolbarGroup, ToolbarItem } from "@/components/ui/toolbar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useCallback } from "react";
import { useDiagramStore } from "../_store/use-diagram-store";
import { DiagramMode } from "@/enums/modes";

export function DiagramToolBar() {
  const { setActiveMode, activeMode } = useDiagramStore();

  const handleSelect = useCallback(() => {
    setActiveMode(DiagramMode.Select);
  }, [setActiveMode]);

  const TOOLBAR_ITEMS = [
    {
      label: "Select",
      Icon: CursorArrowRaysIcon,
      onClick: handleSelect,
      active: activeMode === DiagramMode.Select,
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
                className={
                  item.active ? "bg-primary text-primary-foreground" : ""
                }
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
