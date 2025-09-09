import mongoose, { Schema, Model, Types } from "mongoose";

export interface IBadgeCriteria {
  minScore?: number; // score minimal sur un quizz
  quizId?: Types.ObjectId | null; // optionnel: cibler un quizz précis, sinon s'applique à tous
}

export interface IBadge {
  title: string;
  description?: string;
  isActive: boolean;
  criteria: IBadgeCriteria;
  createdBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export type BadgeModel = Model<IBadge>;

const BadgeCriteriaSchema = new Schema<IBadgeCriteria>({
  minScore: { type: Number },
  quizId: { type: Schema.Types.ObjectId, ref: "Quiz", default: null },
}, { _id: false });

const BadgeSchema = new Schema<IBadge, BadgeModel>({
  title: { type: String, required: true },
  description: { type: String },
  isActive: { type: Boolean, default: true, index: true },
  criteria: { type: BadgeCriteriaSchema, required: true },
  createdBy: { type: Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });

export const Badge = (mongoose.models.Badge as BadgeModel) || mongoose.model<IBadge, BadgeModel>("Badge", BadgeSchema);


