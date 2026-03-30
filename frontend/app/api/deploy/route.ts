import fs from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";

type NoditeConfig = {
  routes: Array<{
    id: string;
    method: "GET" | "POST";
    path: string;
    responseBody: Record<string, unknown>;
  }>;
};

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as NoditeConfig;

    if (!payload || !Array.isArray(payload.routes)) {
      return NextResponse.json(
        { success: false, message: "Invalid payload: routes must be an array." },
        { status: 400 }
      );
    }

    const sharedFilePath = path.resolve(process.cwd(), "..", "shared", "nodite.json");
    fs.writeFileSync(sharedFilePath, JSON.stringify(payload, null, 2), "utf-8");

    return NextResponse.json({
      success: true,
      message: "Deployment successful. nodite.json updated."
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, message: `Failed to deploy configuration: ${message}` },
      { status: 500 }
    );
  }
}
