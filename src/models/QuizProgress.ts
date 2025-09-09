import mongoose, { Schema, Model, Types } from "mongoose";

export interface IQuizProgress {
  userId: Types.ObjectId;
  quizId: Types.ObjectId;
  lives: number; // Nombre de vies restantes (0-5)
  currentQuestionIndex: number; // Question actuelle (0-based)
  answers: {
    questionIndex: number;
    choiceIndex: number;
    isCorrect: boolean;
    answeredAt: Date;
  }[];
  isCompleted: boolean; // Quiz terminé avec succès
  isFailed: boolean; // Plus de vies disponibles
  startedAt: Date;
  completedAt?: Date;
  lastActivityAt: Date;
}

export type QuizProgressModel = Model<IQuizProgress>;

const QuizProgressAnswerSchema = new Schema(
  {
    questionIndex: { type: Number, required: true },
    choiceIndex: { type: Number, required: true },
    isCorrect: { type: Boolean, required: true },
    answeredAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const QuizProgressSchema = new Schema<IQuizProgress, QuizProgressModel>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  quizId: { type: Schema.Types.ObjectId, ref: "Quiz", required: true, index: true },
  lives: { type: Number, required: true, default: 5, min: 0, max: 5 },
  currentQuestionIndex: { type: Number, required: true, default: 0, min: 0 },
  answers: { type: [QuizProgressAnswerSchema], default: [] },
  isCompleted: { type: Boolean, default: false },
  isFailed: { type: Boolean, default: false },
  startedAt: { type: Date, default: Date.now },
  completedAt: { type: Date },
  lastActivityAt: { type: Date, default: Date.now },
});

// Index composé pour s'assurer qu'un utilisateur ne peut avoir qu'une progression active par quiz
QuizProgressSchema.index({ userId: 1, quizId: 1 }, { unique: true });
QuizProgressSchema.index({ userId: 1, lastActivityAt: -1 });

export const QuizProgress = (mongoose.models.QuizProgress as QuizProgressModel) || 
  mongoose.model<IQuizProgress, QuizProgressModel>("QuizProgress", QuizProgressSchema);
