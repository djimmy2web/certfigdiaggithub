import mongoose, { Schema, Model } from "mongoose";

export interface ITheme {
  name: string;
  slug: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type ThemeModel = Model<ITheme>;

const ThemeSchema = new Schema<ITheme, ThemeModel>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

export const Theme = (mongoose.models.Theme as ThemeModel) || mongoose.model<ITheme, ThemeModel>("Theme", ThemeSchema);


