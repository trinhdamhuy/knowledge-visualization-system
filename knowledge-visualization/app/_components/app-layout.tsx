"use client";

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/app/_components/app-sidebar";
import { Header } from "@/app/_components/header";
import { usePathname } from "next/navigation";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const title = pathname.split("/").pop();

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <Header />
        <main className="flex flex-col gap-4 p-4">
          <div className="flex flex-col gap-4 w-full">
            <h1 className="text-4xl font-bold">
              {title ? title.charAt(0).toUpperCase() + title.slice(1) : ""}
            </h1>
            {children}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
