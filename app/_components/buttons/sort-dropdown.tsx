"use client";

import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import type { DiagramSortBy, SortDirection } from "@/types";

interface SortDropdownProps {
  sortBy?: DiagramSortBy | string;
  sortDirection?: SortDirection;
  onSortByChange?: (sortBy: DiagramSortBy | string) => void;
  onSortDirectionChange?: (sortDirection: SortDirection) => void;
  sortByOptions?: Array<{ label: string; value: DiagramSortBy | string }>;
}

export function SortDropdown({
  sortBy = "updatedAt",
  sortDirection = "desc",
  onSortByChange = () => {},
  onSortDirectionChange = () => {},
  sortByOptions: customSortByOptions,
}: SortDropdownProps) {
  const defaultSortByOptions: { label: string; value: DiagramSortBy }[] = [
    {
      label: "Name",
      value: "name",
    },
    {
      label: "Date created",
      value: "createdAt",
    },
    {
      label: "Date updated",
      value: "updatedAt",
    },
  ];

  const sortByOptions = customSortByOptions ?? defaultSortByOptions;

  const sortDirectionOptions: {
    label: string;
    value: SortDirection;
  }[] = [
    {
      label: "Ascending",
      value: "asc",
    },
    {
      label: "Descending",
      value: "desc",
    },
  ];

  const foldersStateOptions = [
    {
      label: "On top",
      value: "onTop",
    },
    {
      label: "Mixed with diagrams",
      value: "mixed",
    },
  ];
  const [foldersState, setFoldersState] =
    useState<(typeof foldersStateOptions)[number]["value"]>("onTop");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <SlidersHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuLabel>Sort by</DropdownMenuLabel>
        <DropdownMenuGroup>
          {sortByOptions.map((option) => (
            <DropdownMenuCheckboxItem
              key={option.value}
              checked={sortBy === option.value}
              onCheckedChange={() => onSortByChange(option.value)}
            >
              <span>{option.label}</span>
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuLabel>Sort direction</DropdownMenuLabel>
        <DropdownMenuGroup>
          {sortDirectionOptions.map((option) => (
            <DropdownMenuCheckboxItem
              key={option.value}
              checked={sortDirection === option.value}
              onCheckedChange={() => onSortDirectionChange(option.value)}
            >
              <span>{option.label}</span>
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuLabel>Folders</DropdownMenuLabel>
        {foldersStateOptions.map((option) => (
          <DropdownMenuCheckboxItem
            key={option.value}
            checked={foldersState === option.value}
            onCheckedChange={() => setFoldersState(option.value)}
          >
            <span>{option.label}</span>
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
