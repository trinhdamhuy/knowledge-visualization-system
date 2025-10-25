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
      filled: <LayoutDashboard fill="currentColor" />,
    },
    {
      label: "My Diagrams",
      href: "/my-diagrams",
      icon: <FileText />,
      filled: <FileText fill="currentColor" />,
    },
    {
      label: "Shared with me",
      href: "/shared",
      icon: <Share />,
      filled: <Share fill="currentColor" />,
    },
    {
      label: "Recent",
      href: "/recent",
      icon: <Clock />,
      filled: <Clock fill="currentColor" />,
    },
    {
      label: "Starred",
      href: "/starred",
      icon: <Star />,
      filled: <Star fill="currentColor" />,
    },
    {
      label: "Trash",
      href: "/trash",
      icon: <Trash />,
      filled: <Trash fill="currentColor" />,
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
        <SidebarGroup>
          {sidebarItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                size="lg"
                isActive={pathname === item.href}
                asChild
              >
                <Link href={item.href}>
                  {pathname === item.href ? item.filled : item.icon}
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
