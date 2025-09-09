import mongoose, { Schema, Model, Types } from "mongoose";

export interface IUserBadge {
  userId: Types.ObjectId;
  badgeId: Types.ObjectId;
  awardedAt: Date;
}

export type UserBadgeModel = Model<IUserBadge>;

const UserBadgeSchema = new Schema<IUserBadge, UserBadgeModel>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  badgeId: { type: Schema.Types.ObjectId, ref: "Badge", required: true, index: true },
  awardedAt: { type: Date, default: Date.now },
});

UserBadgeSchema.index({ userId: 1, badgeId: 1 }, { unique: true });

export const UserBadge = (mongoose.models.UserBadge as UserBadgeModel) || mongoose.model<IUserBadge, UserBadgeModel>("UserBadge", UserBadgeSchema);


