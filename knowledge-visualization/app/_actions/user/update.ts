"use server";

import { PasswordChangeErrors } from "../../../enums/errors";
import { prisma } from "../../../lib/prisma";
import { getCurrentUser } from "./get";
import { User } from "@prisma/client";
import bcrypt from "bcrypt";

async function updateUser(data: Partial<User>): Promise<User> {
  const user = await getCurrentUser();
  return await prisma.user.update({
    where: { id: user?.id },
    data: { ...data, updatedAt: new Date() },
  });
}

async function changePassword(
  email: string,
  currentPassword: string,
  newPassword: string
): Promise<{ success: boolean; error?: PasswordChangeErrors }> {
  try {
    if (!email || !currentPassword || !newPassword) {
      return {
        success: false,
        error: PasswordChangeErrors.fields_required,
      };
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.password) {
      return {
        success: false,
        error: PasswordChangeErrors.google_login_only,
      };
    }

    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password
    );
    if (!isPasswordValid) {
      return { success: false, error: PasswordChangeErrors.password_incorrect };
    }

    if (currentPassword === newPassword) {
      return {
        success: false,
        error: PasswordChangeErrors.password_same,
      };
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });
    return { success: true };
  } catch (error) {
    console.error("Password change error:", error);
    return {
      success: false,
      error: PasswordChangeErrors.password_change_error,
    };
  }
}

export { updateUser, changePassword };
