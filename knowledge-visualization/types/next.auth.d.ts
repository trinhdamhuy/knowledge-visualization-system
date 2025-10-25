import { DefaultSession, JWT as DefaultJWT } from "next-auth";
import { Language } from "@prisma/client";

declare module "next-auth" {
  interface User extends DefaultUser {
    emailVerified?: Date | null;
    password?: string | null;
    language: Language;
    createdAt: Date;
    updatedAt: Date;
  }

  interface Session {
    user: User & DefaultSession["user"];
  }
}

interface JWT extends DefaultJWT {
  id: string;
  name?: string | null;
  email?: string | null;
  emailVerified?: Date | null;
  image?: string | null;
  language: Language;
  createdAt: Date;
  updatedAt: Date;
}
