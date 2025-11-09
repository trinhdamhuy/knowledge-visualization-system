import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Diagram Editor",
  description: "Diagram Editor",
};

export default function DiagramLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
