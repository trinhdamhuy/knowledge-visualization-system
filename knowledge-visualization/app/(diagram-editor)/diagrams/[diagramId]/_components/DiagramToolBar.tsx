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

export function DiagramToolBar() {
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
        <ToolbarItem aria-label="Bold" size="sq-lg">
          {({ isSelected }) => (
            <>{isSelected ? <BoltSolid /> : <BoltOutline />}</>
          )}
        </ToolbarItem>
        <ToolbarItem aria-label="Italic" size="sq-lg">
          {({ isSelected }) => (
            <>{isSelected ? <PencilSolid /> : <PencilOutline />}</>
          )}
        </ToolbarItem>
        <ToolbarItem aria-label="Underline" size="sq-lg">
          {({ isSelected }) => (
            <>
              {isSelected ? (
                <CursorArrowRaysSolid />
              ) : (
                <CursorArrowRaysOutline />
              )}
            </>
          )}
        </ToolbarItem>
        <ToolbarItem aria-label="Strikethrough" size="sq-lg">
          {({ isSelected }) => (
            <>{isSelected ? <NoSymbolSolid /> : <NoSymbolOutline />}</>
          )}
        </ToolbarItem>
      </ToolbarGroup>
      <ToolbarSeparator className="my-1 w-full" />
      <ToolbarGroup aria-label="Alignment" className="flex flex-col gap-1">
        <ToolbarItem aria-label="Align Left" size="sq-lg">
          {({ isSelected }) => (
            <>
              {isSelected ? <Bars3BottomLeftSolid /> : <Bars3BottomLeftIcon />}
            </>
          )}
        </ToolbarItem>
        <ToolbarItem size="sq-lg" aria-label="Align Center">
          {({ isSelected }) => (
            <>
              {isSelected ? (
                <AdjustmentsHorizontalSolid />
              ) : (
                <AdjustmentsHorizontalOutline />
              )}
            </>
          )}
        </ToolbarItem>
        <ToolbarItem size="sq-lg" aria-label="Align Right">
          {({ isSelected }) => (
            <>
              {isSelected ? (
                <Bars3BottomRightSolid />
              ) : (
                <Bars3BottomRightIcon />
              )}
            </>
          )}
        </ToolbarItem>
        <ToolbarItem size="sq-lg" aria-label="Align Justify">
          {({ isSelected }) => (
            <>{isSelected ? <Bars3Solid /> : <Bars3Icon />}</>
          )}
        </ToolbarItem>
      </ToolbarGroup>
    </Toolbar>
  );
}
