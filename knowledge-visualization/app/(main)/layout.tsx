import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/app/_components/app-sidebar";
import { AppHeader } from "@/app/_components/app-header";
import PageTitle from "../_components/page-title";
import { cookies } from "next/headers";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get("sidebar_state")?.value === "true";

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <AppSidebar />
      <SidebarInset>
        <AppHeader />
        <main className="flex flex-col gap-4 py-4 px-8">
          <div className="flex flex-col gap-4 w-full">
            <PageTitle />
            {children}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
