import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard | Knovion",
  description: "Dashboard page of Knovion",
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
