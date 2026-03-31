import fs from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";

type DeployRoute = {
  id: string;
  method: "GET" | "POST";
  path: string;
  responseBody: Record<string, unknown>;
  responseBodyTemplate?: string;
  requestType?: string;
};

type NoditeConfig = {
  routes: DeployRoute[];
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

    // Transform routes to remove template metadata (keep responseBody only)
    const cleanedPayload: NoditeConfig = {
      routes: payload.routes.map((route) => ({
        id: route.id,
        method: route.method,
        path: route.path,
        responseBody: route.responseBody
      }))
    };

    const sharedFilePath = path.resolve(process.cwd(), "..", "shared", "nodite.json");
    fs.writeFileSync(sharedFilePath, JSON.stringify(cleanedPayload, null, 2), "utf-8");

    return NextResponse.json({
      success: true,
      message: "Deployment successful. APIs are now live at http://localhost:4000"
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, message: `Failed to deploy configuration: ${message}` },
      { status: 500 }
    );
  }
}
