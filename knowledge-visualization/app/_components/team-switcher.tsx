"use client";

import * as React from "react";
import {
  AudioWaveform,
  ChevronsUpDown,
  Command,
  FileText,
  GalleryVerticalEnd,
  Plus,
  Star,
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import Image from "next/image";
import { useTeamContext } from "@/contexts/team-context";
import { useTeam } from "@/hooks/use-team";

const defaultLogos = [
  AudioWaveform,
  Command,
  GalleryVerticalEnd,
  Star,
  FileText,
];

export function TeamSwitcher() {
  const { isMobile } = useSidebar();
  const { teams } = useTeam();
  const { activeTeam, setActiveTeam, isLoading } = useTeamContext();

  if (isLoading || !activeTeam || !teams.length) {
    return null;
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="bg-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg overflow-auto">
                {activeTeam.imageUrl ? (
                  <div>
                    <Image
                      src={activeTeam.imageUrl}
                      alt={activeTeam.name}
                      width={32}
                      height={32}
                    />
                  </div>
                ) : (
                  <>
                    {defaultLogos[activeTeam.name.length % defaultLogos.length]}
                  </>
                )}
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{activeTeam.name}</span>
                <span className="truncate text-xs">{activeTeam.plan}</span>
              </div>
              <ChevronsUpDown />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-muted-foreground text-xs">
              Teams
            </DropdownMenuLabel>
            {teams.map((team) => (
              <DropdownMenuItem
                key={team.id}
                onClick={() => setActiveTeam(team)}
                className="gap-2 p-2"
              >
                <div className="flex size-6 items-center justify-center rounded-md overflow-auto border">
                  {team.imageUrl ? (
                    <Image
                      src={team.imageUrl}
                      alt={team.name}
                      width={24}
                      height={24}
                    />
                  ) : (
                    <>{defaultLogos[team.name.length % defaultLogos.length]}</>
                  )}
                </div>
                {team.name}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2 p-2">
              <div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
                <Plus className="size-4" />
              </div>
              <div className="text-muted-foreground font-medium">Add team</div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
