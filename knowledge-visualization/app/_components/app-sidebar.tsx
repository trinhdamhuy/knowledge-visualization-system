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
import { AuroraText } from "@/components/ui/aurora-text";
import {
  Clock,
  FileText,
  LayoutDashboard,
  Share,
  Star,
  Trash,
} from "lucide-react";
import { usePathname } from "next/navigation";

export function AppSidebar() {
  const pathname = usePathname();

  const sidebarItems = [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: <LayoutDashboard />,
    },
    {
      label: "My Diagrams",
      href: "/my-diagrams",
      icon: <FileText />,
    },
    {
      label: "Shared with me",
      href: "/shared-with-me",
      icon: <Share />,
    },
    {
      label: "Recent",
      href: "/recent",
      icon: <Clock />,
    },
    {
      label: "Starred",
      href: "/starred",
      icon: <Star />,
    },
    {
      label: "Trash",
      href: "/trash",
      icon: <Trash />,
    },
  ];

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <Link
          href="/dashboard"
          className="text-2xl font-bold inline-block group-data-[collapsible=icon]:hidden text-center cursor-pointer"
        >
          <AuroraText>Knovion</AuroraText>
        </Link>
        <Link
          href="/dashboard"
          className="text-2xl font-bold hidden group-data-[collapsible=icon]:inline-block text-center cursor-pointer"
        >
          <AuroraText>K</AuroraText>
        </Link>
      </SidebarHeader>
      <SidebarSeparator className="max-w-[90%] mx-auto" />
      <SidebarContent>
        <SidebarGroup className="gap-1">
          {sidebarItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                size="lg"
                className="rounded-2xl px-4"
                isActive={pathname === item.href}
                asChild
              >
                <Link href={item.href}>
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
