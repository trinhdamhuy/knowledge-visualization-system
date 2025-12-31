"use server";

import { prisma } from "@/lib/prisma";
import { getEnv } from "@/lib/get-env";
import { Resend } from "resend";

export async function sendVerificationCode(email: string) {
  const { resendApiKey } = getEnv();
  const resend = new Resend(resendApiKey);
  try {
    if (!email) {
      return { error: "Email is required" };
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return { error: "Email already in use" };
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    // Save to database
    await prisma.verificationToken.deleteMany({
      where: { email },
    });

    await prisma.verificationToken.create({
      data: {
        email,
        token: otp,
        expires,
      },
    });

    // Send email
    await resend.emails.send({
      to: email,
      template: {
        id: "email-verification",
        variables: {
          otp: otp,
        },
      },
    });
    return { success: true };
  } catch (error) {
    console.error("Error sending verification code:", error);
    return { error: "Failed to send verification code" };
  }
}
