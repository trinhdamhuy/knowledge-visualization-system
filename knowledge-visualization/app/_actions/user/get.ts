"use server";

import { auth } from "@/auth";
import { prisma } from "../../../lib/prisma";
import { User } from "@prisma/client";

const UserExceptPasswordQuery = {
  id: true,
  name: true,
  email: true,
  emailVerified: true,
  image: true,
  language: true,
  createdAt: true,
  updatedAt: true,
};

async function getUserByEmail(
  email: string
): Promise<Omit<User, "password"> | null> {
  try {
    return await prisma.user.findFirst({
      where: {
        email: email,
      },
      select: UserExceptPasswordQuery,
    });
  } catch {
    return null;
  }
}

async function getUserById(id: string): Promise<Omit<User, "password"> | null> {
  try {
    return await prisma.user.findFirst({
      where: {
        id: id,
      },
      select: UserExceptPasswordQuery,
    });
  } catch {
    return null;
  }
}

async function getCurrentUser(): Promise<User | null> {
  const data = await auth();
  return data?.user as User | null;
}

export { getUserByEmail, getUserById, getCurrentUser };
