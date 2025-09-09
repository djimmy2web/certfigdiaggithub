import Stripe from "stripe";

type Plan = "pro" | "premium";

function getPlanSpec(plan: Plan) {
  if (plan === "pro") {
    return {
      productName: "CertifDiag Pro",
      lookupKey: "plan_pro_monthly",
      amount: 999,
      currency: "eur",
      interval: "month" as const,
    };
  }
  return {
    productName: "CertifDiag Premium",
    lookupKey: "plan_premium_monthly",
    amount: 1999,
    currency: "eur",
    interval: "month" as const,
  };
}

export async function ensurePlanPrice(stripe: Stripe, plan: Plan): Promise<string> {
  const spec = getPlanSpec(plan);

  // Tenter de retrouver un price existant par lookup_key
  const prices = await stripe.prices.list({ active: true, limit: 100 });
  const existing = prices.data.find((p) => p.lookup_key === spec.lookupKey);
  if (existing) return existing.id;

  // Créer un product + price si absent
  const product = await stripe.products.create({ name: spec.productName });
  const price = await stripe.prices.create({
    currency: spec.currency,
    unit_amount: spec.amount,
    recurring: { interval: spec.interval },
    product: product.id,
    lookup_key: spec.lookupKey,
  });
  return price.id;
}


