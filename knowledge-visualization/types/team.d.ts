import { Team, TeamMember, User } from "@/generated/prisma/client";

/**
 * Team with all relations populated
 */
export type FullTeam = Team & {
  members: (TeamMember & {
    user: Pick<User, "id" | "name" | "image" | "email">;
  })[];
};
