import { auth } from "@/lib/auth";
import { getClientSummaries, upsertClientNote } from "@/lib/clients";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const clients = await getClientSummaries(session.user.id);
  return Response.json(clients);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  if (!body.clientEmail) {
    return Response.json({ error: "clientEmail required" }, { status: 400 });
  }

  const note = await upsertClientNote(session.user.id, body.clientEmail, {
    clientName: body.clientName,
    notes: body.notes,
  });

  return Response.json(note);
}
