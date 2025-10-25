"use server";

import { prisma } from "../../../lib/prisma";
import { redirect } from "next/navigation";
import { getCurrentUser } from "./get";

async function deleteUser() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/");
  }
  await prisma.user.delete({ where: { id: user.id } });
  redirect("/");
}

export { deleteUser };
