import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function PATCH(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const {
    nickname,
    whatsappDefaultCountryCode,
    ribAccountHolder,
    ribIban,
    ribBic,
    ribBankName,
  } = body;

  const data: Record<string, string | null> = {};

  // Profile fields
  if (typeof nickname === "string") {
    const trimmed = nickname.trim();
    if (trimmed.length > 120) {
      return Response.json({ error: "Nickname must be 120 characters or less" }, { status: 400 });
    }
    data.nickname = trimmed || null;
    data.name = trimmed || null;
  }

  if (whatsappDefaultCountryCode !== undefined) {
    const code = String(whatsappDefaultCountryCode).replace(/\D/g, "");
    if (code.length < 1 || code.length > 4) {
      return Response.json({ error: "Country code must be 1–4 digits" }, { status: 400 });
    }
    data.whatsappDefaultCountryCode = code;
  }

  // RIB / bank details
  if (ribAccountHolder !== undefined) data.ribAccountHolder = String(ribAccountHolder).trim() || null;
  if (ribIban !== undefined) data.ribIban = String(ribIban).trim().replace(/\s/g, "") || null;
  if (ribBic !== undefined) data.ribBic = String(ribBic).trim().toUpperCase() || null;
  if (ribBankName !== undefined) data.ribBankName = String(ribBankName).trim() || null;

  if (Object.keys(data).length === 0) {
    return Response.json({ error: "Nothing to update" }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id: session.user.id },
    data,
    select: {
      id: true,
      name: true,
      nickname: true,
      email: true,
      whatsappDefaultCountryCode: true,
      ribAccountHolder: true,
      ribIban: true,
      ribBic: true,
      ribBankName: true,
    },
  });

  return Response.json(updated);
}
