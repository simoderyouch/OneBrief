import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { name, email, password } = body;

  if (!email || !password) {
    return Response.json({ error: "Email and password are required" }, { status: 400 });
  }

  if (password.length < 8) {
    return Response.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return Response.json({ error: "An account with this email already exists" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const trimmed = typeof name === "string" ? name.trim() : "";

  await prisma.user.create({
    data: {
      nickname: trimmed || null,
      name: trimmed || null,
      email: email.trim().toLowerCase(),
      passwordHash,
    },
  });

  return Response.json({ success: true }, { status: 201 });
}
