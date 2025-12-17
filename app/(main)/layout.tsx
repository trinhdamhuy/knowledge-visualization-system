import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/app/_components/app-sidebar";
import { AppHeader } from "@/app/_components/app-header";
import PageTitle from "../_components/page-title";
import { cookies } from "next/headers";
import { MainWrapper } from "./_components/main-wrapper";

async function getCookieData() {
  const cookieStore = await cookies();
  const cookieData = cookieStore.getAll();
  return new Promise((resolve) =>
    setTimeout(() => {
      resolve(cookieData);
    }, 1000)
  );
}

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieData = await getCookieData();
  const defaultOpen =
    (cookieData as unknown as Record<string, string>["sidebar_state"]) ===
    "true";

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
