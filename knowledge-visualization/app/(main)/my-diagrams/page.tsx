"use client";

import { ItemsList } from "@/app/_components/layouts/items-list";

export default function MyDiagramsPage() {
  return <ItemsList onlyMine={true} />;
}
