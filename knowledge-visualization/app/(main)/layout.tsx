import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/app/_components/app-sidebar";
import { AppHeader } from "@/app/_components/app-header";
import PageTitle from "../_components/page-title";
import { cookies } from "next/headers";
import { MainWrapper } from "./_components/main-wrapper";

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
        <MainWrapper>
          <PageTitle />
          {children}
        </MainWrapper>
      </SidebarInset>
    </SidebarProvider>
  );
}
