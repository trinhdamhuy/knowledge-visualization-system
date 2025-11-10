"use client";

import {
  AdjustmentsHorizontalIcon as AdjustmentsHorizontalOutline,
  Bars3BottomLeftIcon,
  Bars3BottomRightIcon,
  Bars3Icon,
  BoltIcon as BoltOutline,
  CursorArrowRaysIcon as CursorArrowRaysOutline,
  NoSymbolIcon as NoSymbolOutline,
  PencilIcon as PencilOutline,
} from "@heroicons/react/24/outline";
import {
  AdjustmentsHorizontalIcon as AdjustmentsHorizontalSolid,
  Bars3BottomLeftIcon as Bars3BottomLeftSolid,
  Bars3BottomRightIcon as Bars3BottomRightSolid,
  Bars3Icon as Bars3Solid,
  BoltIcon as BoltSolid,
  CursorArrowRaysIcon as CursorArrowRaysSolid,
  NoSymbolIcon as NoSymbolSolid,
  PencilIcon as PencilSolid,
} from "@heroicons/react/24/solid";

import {
  Toolbar,
  ToolbarGroup,
  ToolbarItem,
  ToolbarSeparator,
} from "@/components/ui/toolbar";
import {
  Tooltip,
  TooltipTrigger,
  TooltipPanel,
} from "@/components/animate-ui/components/base/tooltip";

export function DiagramToolBar() {
  // Define toolbar items with default and selected states
  const formattingItems = [
    {
      label: "Bold",
      default: <BoltOutline />,
      selected: <BoltSolid />,
    },
    {
      label: "Italic",
      default: <PencilOutline />,
      selected: <PencilSolid />,
    },
    {
      label: "Underline",
      default: <CursorArrowRaysOutline />,
      selected: <CursorArrowRaysSolid />,
    },
    {
      label: "Strikethrough",
      default: <NoSymbolOutline />,
      selected: <NoSymbolSolid />,
    },
  ];

  const alignmentItems = [
    {
      label: "Align Left",
      default: <Bars3BottomLeftIcon />,
      selected: <Bars3BottomLeftSolid />,
    },
    {
      label: "Align Center",
      default: <AdjustmentsHorizontalOutline />,
      selected: <AdjustmentsHorizontalSolid />,
    },
    {
      label: "Align Right",
      default: <Bars3BottomRightIcon />,
      selected: <Bars3BottomRightSolid />,
    },
    {
      label: "Align Justify",
      default: <Bars3Icon />,
      selected: <Bars3Solid />,
    },
  ];

  return (
    <Toolbar
      orientation="vertical"
      aria-label="Toolbars"
      className="flex flex-col gap-1 bg-card"
    >
      <ToolbarGroup
        aria-label="Text Formatting Options"
        className="flex flex-col gap-1"
      >
        {formattingItems.map((item) => (
          <Tooltip key={item.label}>
            <TooltipTrigger asChild>
              <ToolbarItem aria-label={item.label} size="sq-lg">
                {({ isSelected }) => (
                  <>{isSelected ? item.selected : item.default}</>
                )}
              </ToolbarItem>
            </TooltipTrigger>
            <TooltipPanel side="right" sideOffset={12}>
              {item.label}
            </TooltipPanel>
          </Tooltip>
        ))}
      </ToolbarGroup>
      <ToolbarSeparator className="my-1 w-full" />
      <ToolbarGroup aria-label="Alignment" className="flex flex-col gap-1">
        {alignmentItems.map((item) => (
          <Tooltip key={item.label}>
            <TooltipTrigger asChild>
              <ToolbarItem aria-label={item.label} size="sq-lg">
                {({ isSelected }) => (
                  <>{isSelected ? item.selected : item.default}</>
                )}
              </ToolbarItem>
            </TooltipTrigger>
            <TooltipPanel side="right" sideOffset={12}>
              {item.label}
            </TooltipPanel>
          </Tooltip>
        ))}
      </ToolbarGroup>
    </Toolbar>
  );
}
