"use server";

import { getEnv } from "@/lib/get-env";
import { Resend } from "resend";

interface DiagramInviteParams {
  username: string;
  url: string;
  role: string;
}

interface TeamInviteParams {
  username: string;
  team: string;
  role: string;
}

/**
 * Send diagram invite email
 * @param to - Recipient email address
 * @param params - Invite parameters (username, url, role)
 * @returns Success or error object
 */
export async function sendDiagramInvite(
  to: string,
  params: DiagramInviteParams
) {
  const resendApiKey = getEnv("RESEND_API_KEY");
  const resend = new Resend(resendApiKey);

  try {
    if (!to) {
      return { error: "Email is required" };
    }

    if (!params.username || !params.url || !params.role) {
      return { error: "All parameters (username, url, role) are required" };
    }

    // Send email using diagram-invite template
    await resend.emails.send({
      to: to,
      template: {
        id: "diagram-invite",
        variables: {
          username: params.username,
          url: params.url,
          role: params.role,
        },
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Error sending diagram invite email:", error);
    return { error: "Failed to send diagram invite email" };
  }
}

/**
 * Send team invite email
 * @param to - Recipient email address
 * @param params - Invite parameters (username, team, role)
 * @returns Success or error object
 */
export async function sendTeamInvite(to: string, params: TeamInviteParams) {
  const resendApiKey = getEnv("RESEND_API_KEY");
  const resend = new Resend(resendApiKey);

  try {
    if (!to) {
      return { error: "Email is required" };
    }

    if (!params.username || !params.team || !params.role) {
      return { error: "All parameters (username, team, role) are required" };
    }

    // Send email using team-invite template
    await resend.emails.send({
      to: to,
      template: {
        id: "team-invite",
        variables: {
          username: params.username,
          team: params.team,
          role: params.role,
        },
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Error sending team invite email:", error);
    return { error: "Failed to send team invite email" };
  }
}
