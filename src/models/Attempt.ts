import mongoose, { Schema, Model, Types } from "mongoose";

export interface IAttemptAnswer {
  questionIndex: number;
  choiceIndex: number;
  isCorrect: boolean;
}

export interface IAttempt {
  userId: Types.ObjectId;
  quizId: Types.ObjectId;
  score: number; // 0..questions.length
  answers: IAttemptAnswer[];
  createdAt: Date;
}

export type AttemptModel = Model<IAttempt>;

const AttemptAnswerSchema = new Schema<IAttemptAnswer>(
  {
    questionIndex: { type: Number, required: true },
    choiceIndex: { type: Number, required: true },
    isCorrect: { type: Boolean, required: true },
  },
  { _id: false }
);

const AttemptSchema = new Schema<IAttempt, AttemptModel>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  quizId: { type: Schema.Types.ObjectId, ref: "Quiz", required: true, index: true },
  score: { type: Number, required: true },
  answers: { type: [AttemptAnswerSchema], default: [] },
  createdAt: { type: Date, default: Date.now },
});

AttemptSchema.index({ userId: 1, quizId: 1, createdAt: -1 });

export const Attempt = (mongoose.models.Attempt as AttemptModel) || mongoose.model<IAttempt, AttemptModel>("Attempt", AttemptSchema);


