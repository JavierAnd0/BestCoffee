import { auth } from "@/lib/auth/server";
import { env } from "@/lib/env";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const handlers = auth.handler();

export async function GET(
  request: Request,
  context: { params: Promise<{ path: string[] }> },
) {
  if (!env.neonAuthUrl) {
    return NextResponse.json(
      {
        error:
          "Neon Auth no está configurado. Define NEXT_PUBLIC_NEON_AUTH_URL o NEON_AUTH_BASE_URL en .env.local",
      },
      { status: 503 },
    );
  }
  return handlers.GET(request, context);
}

export async function POST(
  request: Request,
  context: { params: Promise<{ path: string[] }> },
) {
  if (!env.neonAuthUrl) {
    return NextResponse.json(
      {
        error:
          "Neon Auth no está configurado. Define NEXT_PUBLIC_NEON_AUTH_URL o NEON_AUTH_BASE_URL en .env.local",
      },
      { status: 503 },
    );
  }
  return handlers.POST(request, context);
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ path: string[] }> },
) {
  return handlers.PUT(request, context);
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ path: string[] }> },
) {
  return handlers.DELETE(request, context);
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ path: string[] }> },
) {
  return handlers.PATCH(request, context);
}
