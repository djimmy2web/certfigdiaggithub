const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

// Modèle VocabularyWord
const VocabularyWordSchema = new mongoose.Schema({
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
      validator: function(v) {
        return v.length >= 2 && v.length <= 4;
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

const VocabularyWord = mongoose.model('VocabularyWord', VocabularyWordSchema);

// Données de vocabulaire
const vocabularyWords = [
  // Niveau débutant
  {
    word: "Élégant",
    correctDefinition: "Qui a de la grâce et du bon goût",
    wrongDefinitions: [
      "Qui manque de style",
      "Qui est grossier"
    ],
    difficulty: "debutant",
    category: "adjectifs",
    examples: ["Une robe élégante", "Un homme élégant"],
    synonyms: ["raffiné", "distingué", "chic"],
    antonyms: ["grossier", "vulgaire", "mal élevé"]
  },
  {
    word: "Rapide",
    correctDefinition: "Qui se déplace ou agit avec vitesse",
    wrongDefinitions: [
      "Qui est très lent",
      "Qui s'arrête souvent"
    ],
    difficulty: "debutant",
    category: "adjectifs",
    examples: ["Un coureur rapide", "Une réponse rapide"],
    synonyms: ["vite", "prompt", "accéléré"],
    antonyms: ["lent", "tardif", "dilatoire"]
  },
  {
    word: "Maison",
    correctDefinition: "Bâtiment destiné à l'habitation",
    wrongDefinitions: [
      "Un véhicule de transport",
      "Un vêtement"
    ],
    difficulty: "debutant",
    category: "noms",
    examples: ["Une belle maison", "La maison de mes parents"],
    synonyms: ["demeure", "habitation", "logis"],
    antonyms: ["extérieur", "rue"]
  },

  // Niveau intermédiaire
  {
    word: "Éphémère",
    correctDefinition: "Qui ne dure qu'un jour ou très peu de temps",
    wrongDefinitions: [
      "Qui dure très longtemps",
      "Qui se répète souvent"
    ],
    difficulty: "intermediaire",
    category: "adjectifs",
    examples: ["Un bonheur éphémère", "Une gloire éphémère"],
    synonyms: ["fugace", "passager", "temporaire"],
    antonyms: ["durable", "permanent", "éternel"]
  },
  {
    word: "Melliflu",
    correctDefinition: "Doux et agréable comme le miel",
    wrongDefinitions: [
      "Amer et désagréable",
      "Acide et piquant"
    ],
    difficulty: "intermediaire",
    category: "adjectifs",
    examples: ["Une voix melliflue", "Des paroles melliflues"],
    synonyms: ["doux", "suave", "mielleux"],
    antonyms: ["amer", "âcre", "rude"]
  },
  {
    word: "Ubiquité",
    correctDefinition: "Présence simultanée en plusieurs lieux",
    wrongDefinitions: [
      "Absence totale",
      "Présence unique"
    ],
    difficulty: "intermediaire",
    category: "noms",
    examples: ["L'ubiquité divine", "L'ubiquité des médias"],
    synonyms: ["omniprésence", "présence universelle"],
    antonyms: ["absence", "localisation"]
  },
  {
    word: "Pragmatique",
    correctDefinition: "Qui s'attache aux faits concrets et aux résultats pratiques",
    wrongDefinitions: [
      "Qui préfère la théorie",
      "Qui ignore la réalité"
    ],
    difficulty: "intermediaire",
    category: "adjectifs",
    examples: ["Une approche pragmatique", "Un homme pragmatique"],
    synonyms: ["pratique", "réaliste", "concret"],
    antonyms: ["théorique", "abstrait", "idéaliste"]
  },

  // Niveau expert
  {
    word: "Sibyllin",
    correctDefinition: "Mystérieux, énigmatique, difficile à comprendre",
    wrongDefinitions: [
      "Clair et évident",
      "Facile à expliquer"
    ],
    difficulty: "expert",
    category: "adjectifs",
    examples: ["Des propos sibyllins", "Une réponse sibylline"],
    synonyms: ["énigmatique", "obscur", "cryptique"],
    antonyms: ["clair", "explicite", "évident"]
  },
  {
    word: "Serendipité",
    correctDefinition: "Découverte fortuite de quelque chose d'intéressant",
    wrongDefinitions: [
      "Recherche méthodique",
      "Échec prévisible"
    ],
    difficulty: "expert",
    category: "noms",
    examples: ["La découverte de la pénicilline fut une serendipité"],
    synonyms: ["découverte fortuite", "trouvaille"],
    antonyms: ["recherche systématique"]
  },
  {
    word: "Sesquipédal",
    correctDefinition: "Qui contient un pied et demi, très long (mot)",
    wrongDefinitions: [
      "Très court et concis",
      "Facile à prononcer"
    ],
    difficulty: "expert",
    category: "adjectifs",
    examples: ["Un terme sesquipédal"],
    synonyms: ["long", "prolixe", "verbeux"],
    antonyms: ["concise", "laconique", "brève"]
  },
  {
    word: "Ostensible",
    correctDefinition: "Qui est fait de manière visible et apparente",
    wrongDefinitions: [
      "Caché et discret",
      "Accidentel et involontaire"
    ],
    difficulty: "expert",
    category: "adjectifs",
    examples: ["Un mépris ostensible", "Une joie ostensible"],
    synonyms: ["apparent", "visible", "manifeste"],
    antonyms: ["caché", "discret", "secret"]
  },
  {
    word: "Laconique",
    correctDefinition: "Qui s'exprime avec peu de mots, concis",
    wrongDefinitions: [
      "Qui parle beaucoup",
      "Qui répète souvent"
    ],
    difficulty: "expert",
    category: "adjectifs",
    examples: ["Une réponse laconique", "Un style laconique"],
    synonyms: ["concis", "bref", "succinct"],
    antonyms: ["prolixe", "verbeux", "bavard"]
  },
  {
    word: "Ésotérique",
    correctDefinition: "Qui n'est accessible qu'à un petit nombre d'initiés",
    wrongDefinitions: [
      "Facile à comprendre pour tous",
      "Public et ouvert"
    ],
    difficulty: "expert",
    category: "adjectifs",
    examples: ["Un savoir ésotérique", "Des textes ésotériques"],
    synonyms: ["mystérieux", "occultiste", "hermétique"],
    antonyms: ["exotérique", "public", "accessible"]
  }
];

async function seedVocabulary() {
  try {
    // Connexion à MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connecté à MongoDB');

    // Supprimer les mots existants
    await VocabularyWord.deleteMany({});
    console.log('🗑️ Anciens mots supprimés');

    // Insérer les nouveaux mots
    const result = await VocabularyWord.insertMany(vocabularyWords);
    console.log(`✅ ${result.length} mots de vocabulaire ajoutés`);

    // Afficher les statistiques
    const stats = await VocabularyWord.aggregate([
      {
        $group: {
          _id: '$difficulty',
          count: { $sum: 1 }
        }
      }
    ]);

    console.log('\n📊 Statistiques par difficulté:');
    stats.forEach(stat => {
      console.log(`  ${stat._id}: ${stat.count} mots`);
    });

    const categoryStats = await VocabularyWord.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      }
    ]);

    console.log('\n📊 Statistiques par catégorie:');
    categoryStats.forEach(stat => {
      console.log(`  ${stat._id}: ${stat.count} mots`);
    });

    console.log('\n🎉 Base de données de vocabulaire initialisée avec succès !');
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Déconnecté de MongoDB');
  }
}

// Exécuter le script
seedVocabulary();
