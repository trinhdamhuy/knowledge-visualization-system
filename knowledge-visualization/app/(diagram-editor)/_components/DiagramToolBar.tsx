"use client";
import { Toolbar, ToolbarGroup } from "@/components/ui/toolbar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useCallback } from "react";
import { useDiagramStore } from "../_store/use-diagram-store";
import { DiagramMode } from "@/enums/modes";
import { Button } from "@/components/ui/button";
import { MousePointer2 } from "lucide-react";

export function DiagramToolBar() {
  const { setActiveMode, activeMode } = useDiagramStore();

  const handleSelect = useCallback(() => {
    setActiveMode(DiagramMode.Select);
  }, [setActiveMode]);

  const TOOLBAR_ITEMS = [
    {
      label: "Select",
      Icon: MousePointer2,
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
              <Button
                data-slot="toolbar-item"
                variant={item.active ? "default" : "ghost"}
                size="icon"
                onClick={item.onClick}
              >
                <item.Icon />
              </Button>
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
