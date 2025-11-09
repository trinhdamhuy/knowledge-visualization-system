"use client";

import { ItemsList } from "@/app/_components/layouts/items-list";
import { FullDiagram } from "@/types";

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
  return <ItemsList diagrams={sampleDiagrams} />;
}
