"use client";

import { CreateButton } from "@/app/_components/buttons/create-button";
import { DiagramCard } from "@/app/_components/cards/diagram-card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Plus, Sparkles, Grid3X3, List } from "lucide-react";
import { useState } from "react";
import { MasonryLayout } from "@/app/_components/masonry-layout";
import { FullDiagram } from "@/types";

// Sample data for diagram cards
const sampleDiagrams: FullDiagram[] = [
  {
    id: "1",
    title: "Diagram1",
    imageUrl: null,
    folderId: "1",
    userId: "1",
    teamId: "1",
    createdById: "1",
    createdAt: new Date(),
    updatedAt: new Date(),
    team: {
      id: "1",
      name: "Team1",
      imageUrl: "https://placehold.co/600x400",
      createdAt: new Date(),
      updatedAt: new Date(),
      ownerId: "1",
    },
    owner: {
      id: "1",
      name: "Owner1",
      email: "owner1@example.com",
      image: "https://github.com/shadcn.png",
    },
    shares: [],
  },
  {
    id: "2",
    title: "Mô tả về sản phẩm/giải pháp",
    imageUrl: null,
    folderId: "1",
    userId: "1",
    teamId: "1",
    createdById: "1",
    createdAt: new Date(),
    updatedAt: new Date(),
    team: {
      id: "1",
      name: "Team1",
      imageUrl: "https://placehold.co/600x400",
      createdAt: new Date(),
      updatedAt: new Date(),
      ownerId: "1",
    },
    owner: {
      id: "1",
      name: "Owner1",
      email: "owner1@example.com",
      image: "https://github.com/shadcn.png",
    },
    shares: [],
  },
  {
    id: "3",
    title: "Flowchart",
    imageUrl: null,
    folderId: "1",
    userId: "1",
    teamId: "1",
    createdById: "1",
    createdAt: new Date(),
    updatedAt: new Date(),
    team: {
      id: "1",
      name: "Team1",
      imageUrl: "https://placehold.co/600x400",
      createdAt: new Date(),
      updatedAt: new Date(),
      ownerId: "1",
    },
    owner: {
      id: "1",
      name: "Owner1",
      email: "owner1@example.com",
      image: "https://github.com/shadcn.png",
    },
    shares: [],
  },
  {
    id: "4",
    title: "Technical Specification",
    imageUrl: null,
    folderId: "1",
    userId: "1",
    teamId: "1",
    createdById: "1",
    createdAt: new Date(),
    updatedAt: new Date(),
    team: {
      id: "1",
      name: "Team1",
      imageUrl: "https://placehold.co/600x400",
      createdAt: new Date(),
      updatedAt: new Date(),
      ownerId: "1",
    },
    owner: {
      id: "1",
      name: "Owner1",
      email: "owner1@example.com",
      image: "https://github.com/shadcn.png",
    },
    shares: [],
  },
  {
    id: "5",
    title: "Database Schema",
    imageUrl: null,
    folderId: "1",
    userId: "1",
    teamId: "1",
    createdById: "1",
    createdAt: new Date(),
    updatedAt: new Date(),
    team: {
      id: "1",
      name: "Team1",
      imageUrl: "https://placehold.co/600x400",
      createdAt: new Date(),
      updatedAt: new Date(),
      ownerId: "1",
    },
    owner: {
      id: "1",
      name: "Owner1",
      email: "owner1@example.com",
      image: "https://github.com/shadcn.png",
    },
    shares: [],
  },
  {
    id: "6",
    title: "User Journey Map",
    imageUrl: null,
    folderId: "1",
    userId: "1",
    teamId: "1",
    createdById: "1",
    createdAt: new Date(),
    updatedAt: new Date(),
    team: {
      id: "1",
      name: "Team1",
      imageUrl: "https://placehold.co/600x400",
      createdAt: new Date(),
      updatedAt: new Date(),
      ownerId: "1",
    },
    owner: {
      id: "1",
      name: "Owner1",
      email: "owner1@example.com",
      image: "https://github.com/shadcn.png",
    },
    shares: [],
  },
];

export default function DashboardPage() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        <CreateButton label="Create Diagram" icon={<Plus />} />
        <CreateButton label="Create Diagram with AI" icon={<Sparkles />} />
      </div>
      <Separator />

      <div className="flex flex-col w-full px-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">All Diagrams</h2>
          <div className="flex gap-2">
            <Button
              onClick={() => setViewMode("grid")}
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="icon"
            >
              <Grid3X3 />
            </Button>
            <Button
              onClick={() => setViewMode("list")}
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="icon"
            >
              <List />
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
