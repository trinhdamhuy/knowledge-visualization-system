import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import Link from "next/link";
import { AuroraText } from "@/components/ui/aurora-text";
import { Clock, FileText, LayoutDashboard, Share, Trash } from "lucide-react";

const sidebarItems = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: <LayoutDashboard />,
  },
  {
    label: "My diagrams",
    href: "/my-diagrams",
    icon: <FileText />,
  },
  {
    label: "Shared with me",
    href: "/shared",
    icon: <Share />,
  },
  {
    label: "Recent",
    href: "/recent",
    icon: <Clock />,
  },
  { label: "Trash", href: "/trash", icon: <Trash /> },
];

export function AppSidebar() {
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
      <SidebarContent>
        <SidebarGroup>
          {sidebarItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton asChild>
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
