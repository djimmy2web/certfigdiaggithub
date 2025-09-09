import mongoose, { Schema, Model, Types } from "mongoose";

export interface IProgress {
  userId: Types.ObjectId;
  quizId: Types.ObjectId;
  updatedAt: Date;
  createdAt: Date;
}

export type ProgressModel = Model<IProgress>;

const ProgressSchema = new Schema<IProgress, ProgressModel>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    quizId: { type: Schema.Types.ObjectId, ref: "Quiz", required: true, index: true },
  },
  { timestamps: true }
);

ProgressSchema.index({ userId: 1, quizId: 1 }, { unique: true });

export const Progress = (mongoose.models.Progress as ProgressModel) || mongoose.model<IProgress, ProgressModel>("Progress", ProgressSchema);


