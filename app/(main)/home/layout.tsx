import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Home | Knovion",
  description: "Home page of Knovion",
};

export default async function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
