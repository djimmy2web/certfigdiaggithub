import mongoose, { Schema, Model } from "mongoose";

export interface IVerificationToken {
  identifier: string;
  token: string;
  expires: Date;
}

export type IVerificationTokenMethods = object;

export type VerificationTokenModel = Model<IVerificationToken, object, IVerificationTokenMethods>;

const VerificationTokenSchema = new Schema<IVerificationToken, VerificationTokenModel, IVerificationTokenMethods>(
  {
    identifier: { type: String, required: true },
    token: { type: String, required: true },
    expires: { type: Date, required: true },
  },
  { timestamps: true }
);

// Index composé pour identifier et token
VerificationTokenSchema.index({ identifier: 1, token: 1 }, { unique: true });

export const VerificationToken =
  (mongoose.models.VerificationToken as VerificationTokenModel) ||
  mongoose.model<IVerificationToken, VerificationTokenModel>("VerificationToken", VerificationTokenSchema);
