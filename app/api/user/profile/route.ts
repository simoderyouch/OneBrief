import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function PATCH(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { nickname, whatsappDefaultCountryCode, ribAccountHolder, ribIban, ribBic, ribBankName } = body;

  if (whatsappDefaultCountryCode !== undefined) {
    const code = String(whatsappDefaultCountryCode).replace(/\D/g, "");
    if (code.length < 1 || code.length > 4) {
      return Response.json({ error: "Country code must be 1–4 digits" }, { status: 400 });
    }
    await prisma.user.update({
      where: { id: session.user.id },
      data: { whatsappDefaultCountryCode: code },
    });
  }

  if (typeof nickname !== "string") {
    if (whatsappDefaultCountryCode !== undefined) {
      const updated = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { id: true, name: true, nickname: true, email: true, whatsappDefaultCountryCode: true },
      });
      return Response.json(updated);
    }
    return Response.json({ error: "Nickname must be a string" }, { status: 400 });
  }

  const trimmed = nickname.trim();
  if (trimmed.length > 120) {
    return Response.json({ error: "Nickname must be 120 characters or less" }, { status: 400 });
  }

  const ribData: Record<string, string | null> = {};
  if (ribAccountHolder !== undefined) ribData.ribAccountHolder = String(ribAccountHolder).trim() || null;
  if (ribIban !== undefined) ribData.ribIban = String(ribIban).trim().replace(/\s/g, "") || null;
  if (ribBic !== undefined) ribData.ribBic = String(ribBic).trim().toUpperCase() || null;
  if (ribBankName !== undefined) ribData.ribBankName = String(ribBankName).trim() || null;

  const updated = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      nickname: trimmed || null,
      name: trimmed || null,
      ...ribData,
    },
    select: {
      id: true, name: true, nickname: true, email: true,
      whatsappDefaultCountryCode: true,
      ribAccountHolder: true, ribIban: true, ribBic: true, ribBankName: true,
    },
  });

  return Response.json(updated);
}
