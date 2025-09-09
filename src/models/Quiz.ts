import mongoose, { Schema, Model, Types } from "mongoose";

export interface QuizChoice {
  text: string;
  isCorrect: boolean;
  explanation?: string; // Explication pourquoi cette réponse est correcte/incorrecte
  media?: {
    type: "image" | "video";
    url: string;
    filename: string;
  };
}

export interface QuizQuestion {
  text: string;
  choices: QuizChoice[];
  explanation?: string; // Explication générale de la question
  media?: {
    type: "image" | "video";
    url: string;
    filename: string;
  };
}

export interface IQuiz {
  title: string;
  description?: string;
  category?: string;
  themeSlug?: string;
  difficulty?: "debutant" | "intermediaire" | "expert";
  questions: QuizQuestion[];
  isPublished: boolean;
  createdBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export type QuizModel = Model<IQuiz>;

const ChoiceSchema = new Schema<QuizChoice>(
  {
    text: { type: String, required: true },
    isCorrect: { type: Boolean, required: true, default: false },
    explanation: { type: String }, // Explication pourquoi cette réponse est correcte/incorrecte
    media: {
      type: {
        type: String,
        enum: ["image", "video"],
      },
      url: String,
      filename: String,
    },
  },
  { _id: false }
);

const QuestionSchema = new Schema<QuizQuestion>(
  {
    text: { type: String, required: true },
    explanation: { type: String }, // Explication générale de la question
    media: {
      type: {
        type: String,
        enum: ["image", "video"],
      },
      url: String,
      filename: String,
    },
    choices: { type: [ChoiceSchema], required: true, validate: (v: QuizChoice[]) => v.length >= 2 },
  },
  { _id: false }
);

const QuizSchema = new Schema<IQuiz, QuizModel>(
  {
    title: { type: String, required: true },
    description: { type: String },
    category: { type: String, index: true },
    themeSlug: { type: String, index: true, lowercase: true, trim: true },
    difficulty: { type: String, enum: ["debutant", "intermediaire", "expert"], index: true, default: "debutant" },
    isPublished: { type: Boolean, default: false, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
    questions: { type: [QuestionSchema], required: true },
  },
  { timestamps: true }
);

export const Quiz = (mongoose.models.Quiz as QuizModel) || mongoose.model<IQuiz, QuizModel>("Quiz", QuizSchema);


