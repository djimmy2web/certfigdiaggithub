import Stripe from "stripe";

const stripeSecret = process.env.STRIPE_SECRET_KEY;
if (!stripeSecret) {
  // Lancer seulement à l'utilisation pour éviter les erreurs au build
}

export function getStripe() {
  if (!stripeSecret) throw new Error("STRIPE_SECRET_KEY manquant dans .env.local");
  // Utiliser une version stable supportée par le SDK Stripe
  return new Stripe(stripeSecret, { apiVersion: "2025-07-30.basil" });
}


