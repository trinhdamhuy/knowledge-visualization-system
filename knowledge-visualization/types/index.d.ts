import { Diagram, Share, Team, TeamMember, User } from "@prisma/client";

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

type FullTeam = Team & {
  members: (TeamMember & {
    user: Pick<User, "id" | "name" | "image" | "email">;
  })[];
};

export { FullTeam, FullDiagram };
