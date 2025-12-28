"use server";

import { prisma } from "../../../lib/prisma";

async function createUser(
  name: string,
  email: string,
  password: string,
  emailVerified?: Date
) {
  return await prisma.user.create({
    data: {
      name: name,
      email: email,
      password: password,
      emailVerified: emailVerified,
    },
  });
}

export { createUser };
