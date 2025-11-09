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
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-800 p-2">
      <Toolbar orientation="vertical" aria-label="Toolbars" className="flex flex-col gap-1">
        <ToolbarGroup aria-label="Text Formatting Options" className="flex flex-col gap-1">
          <ToolbarItem defaultSelected aria-label="Bold" size="sq-sm">
            {({ isSelected }) => (
              <>{isSelected ? <BoltSolid className="w-4 h-4" /> : <BoltOutline className="w-4 h-4" />}</>
            )}
          </ToolbarItem>
          <ToolbarItem aria-label="Italic" size="sq-sm">
            {({ isSelected }) => (
              <>{isSelected ? <PencilSolid className="w-4 h-4" /> : <PencilOutline className="w-4 h-4" />}</>
            )}
          </ToolbarItem>
          <ToolbarItem aria-label="Underline" size="sq-sm">
            {({ isSelected }) => (
              <>
                {isSelected ? (
                  <CursorArrowRaysSolid className="w-4 h-4" />
                ) : (
                  <CursorArrowRaysOutline className="w-4 h-4" />
                )}
              </>
            )}
          </ToolbarItem>
          <ToolbarItem aria-label="Strikethrough" size="sq-sm">
            {({ isSelected }) => (
              <>{isSelected ? <NoSymbolSolid className="w-4 h-4" /> : <NoSymbolOutline className="w-4 h-4" />}</>
            )}
          </ToolbarItem>
        </ToolbarGroup>
        <ToolbarSeparator className="my-1 h-px bg-gray-200 dark:bg-gray-700" />
        <ToolbarGroup aria-label="Alignment" className="flex flex-col gap-1">
          <ToolbarItem aria-label="Align Left" size="sq-sm">
            {({ isSelected }) => (
              <>
                {isSelected ? (
                  <Bars3BottomLeftSolid className="w-4 h-4" />
                ) : (
                  <Bars3BottomLeftIcon className="w-4 h-4" />
                )}
              </>
            )}
          </ToolbarItem>
          <ToolbarItem size="sq-sm" aria-label="Align Center">
            {({ isSelected }) => (
              <>
                {isSelected ? (
                  <AdjustmentsHorizontalSolid className="w-4 h-4" />
                ) : (
                  <AdjustmentsHorizontalOutline className="w-4 h-4" />
                )}
              </>
            )}
          </ToolbarItem>
          <ToolbarItem size="sq-sm" aria-label="Align Right">
            {({ isSelected }) => (
              <>
                {isSelected ? (
                  <Bars3BottomRightSolid className="w-4 h-4" />
                ) : (
                  <Bars3BottomRightIcon className="w-4 h-4" />
                )}
              </>
            )}
          </ToolbarItem>
          <ToolbarItem size="sq-sm" aria-label="Align Justify">
            {({ isSelected }) => (
              <>{isSelected ? <Bars3Solid className="w-4 h-4" /> : <Bars3Icon className="w-4 h-4" />}</>
            )}
          </ToolbarItem>
        </ToolbarGroup>
      </Toolbar>
    </div>
  );
}
