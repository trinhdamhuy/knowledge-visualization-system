"use client";

import { ItemsList } from "@/app/_components/layouts/items-list";
import { FullDiagram } from "@/types";

// Sample data for diagram cards
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
  {
    id: "2",
    title: "Diagram2",
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
  {
    id: "3",
    title: "Diagram3",
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
  {
    id: "4",
    title: "Diagram4",
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
  {
    id: "5",
    title: "Diagram5",
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
  {
    id: "6",
    title: "Diagram6",
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

export default function DashboardPage() {
  return (
    <ItemsList diagrams={sampleDiagrams}/>
  );
}
