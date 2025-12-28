"use server";

import { Resend } from "resend";
import { prisma } from "@/lib/prisma";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendVerificationCode(email: string) {
  try {
    if (!email) {
      return { error: "Email is required" };
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
      subject: "Verify your email",
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
