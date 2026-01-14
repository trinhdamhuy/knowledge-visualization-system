import { getEnv } from "@/lib/get-env";
import { auth } from "@/auth";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const BACKEND_URL = getEnv("BACKEND_URL");
  const authData = await auth();
  if (!authData?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const upstream = await fetch(`${BACKEND_URL}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type":
          request.headers.get("content-type") ?? "application/json",
      },
      body: await request.text(),
      cache: "no-store",
    });

    if (!upstream.ok) {
      return NextResponse.json(
        { error: "Backend request failed" },
        { status: upstream.status }
      );
    }

    const data = await upstream.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to proxy chat request:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
