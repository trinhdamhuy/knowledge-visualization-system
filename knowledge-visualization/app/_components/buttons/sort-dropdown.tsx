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
import { useState } from "react";
import { SlidersHorizontal } from "lucide-react";

export function SortDropdown() {
  const sortByOptions = [
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
  const [sortBy, setSortBy] =
    useState<(typeof sortByOptions)[number]["value"]>("name");

  const sortDirectionOptions = [
    {
      label: "Ascending",
      value: "asc",
    },
    {
      label: "Descending",
      value: "desc",
    },
  ];
  const [sortDirection, setSortDirection] =
    useState<(typeof sortDirectionOptions)[number]["value"]>("asc");

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
              onCheckedChange={() => setSortBy(option.value)}
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
              onCheckedChange={() => setSortDirection(option.value)}
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
