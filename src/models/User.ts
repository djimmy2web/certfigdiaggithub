import mongoose, { Schema, Model } from "mongoose";

export interface IUser {
  email: string;
  passwordHash?: string; // Optionnel pour les connexions OAuth
  name?: string;
  customId: string; // Identifiant personnalisé unique (ex: tomaterouge21)
  points?: number;
  role: "user" | "admin";
  image?: string; // URL de l'image de profil
  emailVerified?: Date;
  subscription?: {
    plan: "free" | "pro" | "premium";
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
    currentPeriodEnd?: Date;
    status?: "active" | "trialing" | "past_due" | "canceled" | "incomplete" | "unpaid";
  };
  createdAt: Date;
  updatedAt: Date;
}

export type IUserMethods = object;

export type UserModel = Model<IUser, object, IUserMethods>;

const UserSchema = new Schema<IUser, UserModel, IUserMethods>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, index: true },
    passwordHash: { type: String }, // Plus requis pour permettre les connexions OAuth
    name: { type: String },
    customId: { type: String, required: true, unique: true, index: true },
    points: { type: Number, default: 0, index: true },
    role: { type: String, enum: ["user", "admin"], default: "user", index: true },
    image: { type: String },
    emailVerified: { type: Date },
    subscription: {
      plan: { type: String, enum: ["free", "pro", "premium"], default: "free" },
      stripeCustomerId: { type: String },
      stripeSubscriptionId: { type: String },
      currentPeriodEnd: { type: Date },
      status: { type: String },
    },
  },
  { timestamps: true }
);

export const User =
  (mongoose.models.User as UserModel) ||
  mongoose.model<IUser, UserModel>("User", UserSchema);


