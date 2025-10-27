"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import Link from "next/link";
import {
  AudioWaveform,
  Clock,
  Command,
  FileText,
  GalleryVerticalEnd,
  LayoutDashboard,
  Share,
  Star,
  Trash,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { Logo } from "./logo";
import { TeamSwitcher } from "./team-switcher";

const teams = [
  {
    name: "Acme Inc",
    logo: GalleryVerticalEnd,
    plan: "Enterprise",
  },
  {
    name: "Acme Corp.",
    logo: AudioWaveform,
    plan: "Startup",
  },
  {
    name: "Evil Corp.",
    logo: Command,
    plan: "Free",
  },
];

export function AppSidebar() {
  const pathname = usePathname();

  const sidebarItems = [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      label: "My Diagrams",
      href: "/my-diagrams",
      icon: FileText,
    },
    {
      label: "Shared with me",
      href: "/shared-with-me",
      icon: Share,
    },
    {
      label: "Recent",
      href: "/recent",
      icon: Clock,
    },
    {
      label: "Starred",
      href: "/starred",
      icon: Star,
    },
    {
      label: "Trash",
      href: "/trash",
      icon: Trash,
    },
  ];

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <Logo className="group-data-[collapsible=icon]:hidden" text="Knovion" />
        <Logo
          className="hidden group-data-[collapsible=icon]:inline-block"
          text="K"
        />
      </SidebarHeader>
      <SidebarSeparator className="max-w-[90%] mx-auto my-2" />
      <SidebarContent>
        <SidebarGroup className="gap-1">
          <TeamSwitcher teams={teams} />
          {sidebarItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                size="lg"
                className="group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:justify-center px-4"
                isActive={pathname === item.href}
                asChild
              >
                <Link href={item.href}>
                  <item.icon />
                  <span className="group-data-[collapsible=icon]:hidden">
                    {item.label}
                  </span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
