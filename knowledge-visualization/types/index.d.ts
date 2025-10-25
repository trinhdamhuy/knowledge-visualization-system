import { Diagram, Share, Team } from "@prisma/client";

type FullDiagram = Diagram & {
  team: Team;
  owner: {
    id: string;
    name: string;
    email: string;
    image: string;
  };
  shares: (Share & {
    user: {
      id: string;
      name: string;
      email: string;
      image: string;
    };
  })[];
};

export { FullDiagram };
