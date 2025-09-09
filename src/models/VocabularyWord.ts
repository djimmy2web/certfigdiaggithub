import mongoose, { Schema, Document } from 'mongoose';

export interface IVocabularyWord extends Document {
  word: string;
  correctDefinition: string;
  wrongDefinitions: string[];
  difficulty: "debutant" | "intermediaire" | "expert";
  category: string;
  language: string;
  examples?: string[];
  synonyms?: string[];
  antonyms?: string[];
  etymology?: string;
  createdAt: Date;
  updatedAt: Date;
}

const VocabularyWordSchema = new Schema<IVocabularyWord>({
  word: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  correctDefinition: {
    type: String,
    required: true,
    trim: true
  },
  wrongDefinitions: {
    type: [String],
    required: true,
    validate: {
      validator: function(v: string[]) {
        return v.length >= 2 && v.length <= 4; // Au moins 2 mauvaises réponses, max 4
      },
      message: 'Il faut au moins 2 mauvaises définitions et maximum 4'
    }
  },
  difficulty: {
    type: String,
    enum: ['debutant', 'intermediaire', 'expert'],
    required: true,
    default: 'intermediaire'
  },
  category: {
    type: String,
    required: true,
    enum: ['adjectifs', 'noms', 'verbes', 'adverbes', 'expressions', 'locutions'],
    default: 'noms'
  },
  language: {
    type: String,
    required: true,
    default: 'fr'
  },
  examples: {
    type: [String],
    default: []
  },
  synonyms: {
    type: [String],
    default: []
  },
  antonyms: {
    type: [String],
    default: []
  },
  etymology: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Index pour améliorer les performances
VocabularyWordSchema.index({ word: 1 });
VocabularyWordSchema.index({ difficulty: 1 });
VocabularyWordSchema.index({ category: 1 });
VocabularyWordSchema.index({ language: 1 });

export const VocabularyWord = mongoose.models.VocabularyWord || mongoose.model<IVocabularyWord>('VocabularyWord', VocabularyWordSchema);
