import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";

export async function POST(req: NextRequest) {
  const stripe = getStripe();
  const sig = req.headers.get("stripe-signature");
  const whSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!sig || !whSecret) return NextResponse.json({ error: "Webhook non configuré" }, { status: 500 });

  const body = await req.text();
  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, whSecret);
  } catch {
    return NextResponse.json({ error: "Signature invalide" }, { status: 400 });
  }

  await connectToDatabase();

  switch (event.type) {
    case "checkout.session.completed": {
      const s = event.data.object as { metadata?: { userId?: string; plan?: string }; customer?: string; subscription?: string };
      const userId = s.metadata?.userId;
      const plan = s.metadata?.plan;
      if (userId && plan) {
        await User.updateOne(
          { _id: userId },
          {
            $set: {
              "subscription.plan": plan,
              "subscription.stripeCustomerId": s.customer as string,
              "subscription.stripeSubscriptionId": s.subscription as string,
              "subscription.status": "active",
            },
          }
        );
      }
      break;
    }
    case "customer.subscription.updated":
    case "customer.subscription.created":
    case "customer.subscription.deleted": {
      const sub = event.data.object as unknown as { id: string; customer: string; status: string; current_period_end: number };
      const customerId = sub.customer as string;
      await User.updateOne(
        { "subscription.stripeCustomerId": customerId },
        {
          $set: {
            "subscription.stripeSubscriptionId": sub.id,
            "subscription.status": sub.status,
            "subscription.currentPeriodEnd": new Date(sub.current_period_end * 1000),
          },
        }
      );
      break;
    }
  }

  return NextResponse.json({ received: true });
}

export const config = {
  api: { bodyParser: false },
};


