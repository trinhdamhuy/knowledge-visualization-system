"use client";

import { CreateButton } from "@/app/_components/buttons/create-button";
import { ItemsLayout } from "@/app/_components/layouts/items-layout";
import { FullDiagram } from "@/types";
import { Plus, Sparkles } from "lucide-react";

const sampleDiagrams: FullDiagram[] = [
  {
    id: "1",
    title: "Diagram1",
    imageUrl: null,
    folderId: "1",
    ownerId: "1",
    teamId: "1",
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

export default function MyDiagramsPage() {
  return (
    <ItemsLayout diagrams={sampleDiagrams}>
      <CreateButton label="Create Diagram" icon={<Plus />} />
      <CreateButton label="Create Diagram with AI" icon={<Sparkles />} />
    </ItemsLayout>
  );
}
