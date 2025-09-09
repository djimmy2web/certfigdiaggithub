import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { requireSession } from "@/lib/auth-helpers";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";

export async function POST() {
  const session = await requireSession();
  await connectToDatabase();
  const stripe = getStripe();
  const user = await User.findById(session.user!.id);
  const customerId = user?.subscription?.stripeCustomerId;
  if (!customerId) return NextResponse.json({ error: "Aucun client Stripe" }, { status: 400 });
  const portal = await stripe.billingPortal.sessions.create({ customer: customerId, return_url: `${process.env.NEXTAUTH_URL}/tarifs` });
  return NextResponse.json({ url: portal.url });
}