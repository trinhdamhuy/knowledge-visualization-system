"use client";

import { CreateButton } from "@/app/_components/buttons/create-button";
import { DiagramCard } from "@/app/_components/cards/diagram-card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Plus, Sparkles, Grid3X3, List } from "lucide-react";
import { useState } from "react";
import { Diagram } from "@prisma/client";
import { MasonryLayout } from "@/app/_components/layouts/masonry-layout";

// Sample data for diagram cards
const sampleDiagrams: Diagram[] = [
  {
    id: "1",
    title: "Diagram1",
    imageUrl: "https://placehold.co/600x400",
    folderId: "1",
    userId: "1",
    teamId: "1",
    createdById: "1",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "2",
    title: "Mô tả về sản phẩm/giải pháp",
    imageUrl: "https://placehold.co/600x400",
    folderId: "1",
    userId: "1",
    teamId: "1",
    createdById: "1",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "3",
    title: "Flowchart.png",
    imageUrl: "https://placehold.co/600x400",
    folderId: "1",
    userId: "1",
    teamId: "1",
    createdById: "1",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "4",
    title: "Technical Specification",
    imageUrl: "https://placehold.co/600x400",
    folderId: "1",
    userId: "1",
    teamId: "1",
    createdById: "1",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "5",
    title: "Database Schema",
    imageUrl: "https://placehold.co/600x400",
    folderId: "1",
    userId: "1",
    teamId: "1",
    createdById: "1",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "6",
    title: "User Journey Map",
    imageUrl: "https://placehold.co/600x400",
    folderId: "1",
    userId: "1",
    teamId: "1",
    createdById: "1",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export default function DashboardPage() {
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        <CreateButton label="Create Diagram" icon={<Plus />} />
        <CreateButton label="Create Diagram with AI" icon={<Sparkles />} />
      </div>
      <Separator />

      <div className="flex flex-col w-full px-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Recently</h2>
          <div className="flex gap-2">
            <Button
              onClick={() => setViewMode("list")}
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="icon"
            >
              <List />
            </Button>
            <Button
              onClick={() => setViewMode("grid")}
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="icon"
            >
              <Grid3X3 />
            </Button>
          </div>
        </div>

        {viewMode === "list" ? (
          <div className="flex flex-col w-full items-center justify-center space-y-2">
            {sampleDiagrams.map((diagram) => (
              <DiagramCard key={diagram.id} variant="list" diagram={diagram} />
            ))}
          </div>
        ) : (
          <MasonryLayout>
            {sampleDiagrams.map((diagram) => (
              <DiagramCard key={diagram.id} variant="grid" diagram={diagram} />
            ))}
          </MasonryLayout>
        )}
      </div>
    </div>
  );
}
