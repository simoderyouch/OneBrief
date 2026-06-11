import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import SettingsForm from "./SettingsForm";

import { PRODUCT_NAME } from "@/lib/brand";

export const metadata = { title: `Settings — ${PRODUCT_NAME}` };

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      nickname: true,
      email: true,
      notifyFeedback: true,
      notifyUpload: true,
      notifyStatus: true,
      whatsappDefaultCountryCode: true,
      ribAccountHolder: true,
      ribIban: true,
      ribBic: true,
      ribBankName: true,
    },
  });

  if (!user) redirect("/login");

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-neutral-400 text-sm mt-1">Manage your profile and notification preferences</p>
      </div>
      <SettingsForm user={user} />
    </div>
  );
}
