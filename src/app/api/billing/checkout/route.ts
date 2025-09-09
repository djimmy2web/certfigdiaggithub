import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getStripe } from "@/lib/stripe";
import { ensurePlanPrice } from "@/lib/stripeCatalog";
import { requireSession } from "@/lib/auth-helpers";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";

const BodySchema = z.object({ plan: z.enum(["free", "pro", "premium"]) });

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession();
    await connectToDatabase();
    const body = await req.json();
    const { plan } = BodySchema.parse(body);

    if (plan === "free") {
      await User.updateOne({ _id: session.user!.id }, { $set: { subscription: { plan: "free" } } });
      return NextResponse.json({ ok: true });
    }

    const stripe = getStripe();
    const user = await User.findById(session.user!.id);
    if (!user) return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });

    let customerId = user.subscription?.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: { userId: String(user._id) },
      });
      customerId = customer.id;
      // @ts-expect-error - Type assertion needed for subscription object update
      user.subscription = { ...(user.subscription || {}), stripeCustomerId: customerId, plan } as Record<string, unknown>;
      await user.save();
    }

    const priceId = await ensurePlanPrice(stripe, plan);

    const sessionCheckout = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.NEXTAUTH_URL}/tarifs?success=1`,
      cancel_url: `${process.env.NEXTAUTH_URL}/tarifs?canceled=1`,
      metadata: { userId: String(user._id), plan },
    });

    return NextResponse.json({ url: sessionCheckout.url });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const message = error.issues.map((i) => i.message).join(", ") || "Données invalides";
      return NextResponse.json({ error: message }, { status: 400 });
    }
    const status = (error && typeof error === 'object' && 'status' in error && typeof error.status === 'number') ? error.status : 500;
    const message = process.env.NODE_ENV !== "production" ? (error instanceof Error ? error.message : "Erreur serveur") : "Erreur serveur";
    return NextResponse.json({ error: message }, { status });
  }
}


