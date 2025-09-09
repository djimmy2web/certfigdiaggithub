import mongoose, { Schema, Model } from "mongoose";

export interface IAccount {
  userId: mongoose.Types.ObjectId;
  type: string;
  provider: string;
  providerAccountId: string;
  refresh_token?: string;
  access_token?: string;
  expires_at?: number;
  token_type?: string;
  scope?: string;
  id_token?: string;
  session_state?: string;
}

export type IAccountMethods = object;

export type AccountModel = Model<IAccount, object, IAccountMethods>;

const AccountSchema = new Schema<IAccount, AccountModel, IAccountMethods>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, required: true },
    provider: { type: String, required: true },
    providerAccountId: { type: String, required: true },
    refresh_token: { type: String },
    access_token: { type: String },
    expires_at: { type: Number },
    token_type: { type: String },
    scope: { type: String },
    id_token: { type: String },
    session_state: { type: String },
  },
  { timestamps: true }
);

// Index composé pour les comptes OAuth
AccountSchema.index({ provider: 1, providerAccountId: 1 }, { unique: true });

export const Account =
  (mongoose.models.Account as AccountModel) ||
  mongoose.model<IAccount, AccountModel>("Account", AccountSchema);
