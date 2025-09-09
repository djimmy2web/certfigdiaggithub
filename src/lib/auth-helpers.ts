import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function requireSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw Object.assign(new Error("Unauthorized"), { status: 401 });
  }
  return session;
}

export async function requireAdmin() {
  const session = await requireSession();
  if (session.user?.role !== "admin") {
    throw Object.assign(new Error("Forbidden"), { status: 403 });
  }
  return session;
}


