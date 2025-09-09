import mongoose, { Schema, Model } from "mongoose";

export interface ISession {
  sessionToken: string;
  userId: mongoose.Types.ObjectId;
  expires: Date;
}

export type ISessionMethods = object;

export type SessionModel = Model<ISession, object, ISessionMethods>;

const SessionSchema = new Schema<ISession, SessionModel, ISessionMethods>(
  {
    sessionToken: { type: String, required: true, unique: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    expires: { type: Date, required: true },
  },
  { timestamps: true }
);

export const Session =
  (mongoose.models.Session as SessionModel) ||
  mongoose.model<ISession, SessionModel>("Session", SessionSchema);
