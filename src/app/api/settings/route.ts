import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { encrypt } from "@/lib/crypto";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const settings = await prisma.aiSettings.findUnique({
    where: { userId: session.user.id },
  });

  if (!settings) {
    return NextResponse.json({
      provider: "openai",
      hasApiKey: false,
      model: null,
    });
  }

  return NextResponse.json({
    provider: settings.provider,
    hasApiKey: !!settings.encryptedApiKey,
    model: settings.model,
  });
}

export async function PUT(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { provider, apiKey, model } = body;

  if (!provider || typeof provider !== "string" || !["openai", "anthropic"].includes(provider)) {
    return NextResponse.json({ error: "Invalid provider" }, { status: 400 });
  }

  if (apiKey !== undefined && (typeof apiKey !== "string" || apiKey.length > 500)) {
    return NextResponse.json({ error: "Invalid API key" }, { status: 400 });
  }

  if (model !== undefined && model !== null && (typeof model !== "string" || model.length > 100)) {
    return NextResponse.json({ error: "Invalid model" }, { status: 400 });
  }

  const data: {
    provider: string;
    model: string | null;
    encryptedApiKey?: string;
  } = {
    provider,
    model: model || null,
  };

  if (apiKey) {
    data.encryptedApiKey = encrypt(apiKey);
  }

  await prisma.aiSettings.upsert({
    where: { userId: session.user.id },
    update: data,
    create: {
      ...data,
      userId: session.user.id,
    },
  });

  return NextResponse.json({ success: true });
}
