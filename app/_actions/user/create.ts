"use server";

import { prisma } from "../../../lib/prisma";

async function createUser(name: string, email: string, password: string) {
  return await prisma.user.create({
    data: {
      name: name,
      email: email,
      password: password,
    },
  });
}

export { createUser };
