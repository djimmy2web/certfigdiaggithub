const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

// Modèle UserError
const UserErrorSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  quizType: {
    type: String,
    enum: ['vocabulary', 'thematic'],
    required: true
  },
  questionId: {
    type: String,
    required: true
  },
  question: {
    type: String,
    required: true,
    trim: true
  },
  userAnswer: {
    type: String,
    required: true,
    trim: true
  },
  correctAnswer: {
    type: String,
    required: true,
    trim: true
  },
  quizTitle: {
    type: String,
    trim: true
  },
  difficulty: {
    type: String,
    enum: ['debutant', 'intermediaire', 'expert'],
    required: true
  },
  category: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

const UserError = mongoose.model('UserError', UserErrorSchema);

// Modèle User (pour récupérer un utilisateur existant)
const UserSchema = new mongoose.Schema({
  email: String,
  name: String,
  role: String
});

const User = mongoose.model('User', UserSchema);

// Données d'erreurs d'exemple
const userErrors = [
  {
    userId: "507f1f77bcf86cd799439011", // ID d'exemple - sera remplacé par un vrai ID
    quizType: "vocabulary",
    questionId: "word_1",
    question: "Quel est le sens du mot 'Éphémère' ?",
    userAnswer: "Qui dure très longtemps",
    correctAnswer: "Qui ne dure qu'un jour ou très peu de temps",
    quizTitle: "Quiz de Vocabulaire",
    difficulty: "intermediaire",
    category: "adjectifs"
  },
  {
    userId: "507f1f77bcf86cd799439011",
    quizType: "vocabulary",
    questionId: "word_2",
    question: "Quel est le sens du mot 'Sibyllin' ?",
    userAnswer: "Clair et évident",
    correctAnswer: "Mystérieux, énigmatique, difficile à comprendre",
    quizTitle: "Quiz de Vocabulaire",
    difficulty: "expert",
    category: "adjectifs"
  },
  {
    userId: "507f1f77bcf86cd799439011",
    quizType: "thematic",
    questionId: "quiz_1",
    question: "Quelle est la capitale de la France ?",
    userAnswer: "Lyon",
    correctAnswer: "Paris",
    quizTitle: "Quiz Géographie",
    difficulty: "debutant",
    category: "geographie"
  },
  {
    userId: "507f1f77bcf86cd799439011",
    quizType: "thematic",
    questionId: "quiz_2",
    question: "Quel est le plus grand océan du monde ?",
    userAnswer: "Océan Atlantique",
    correctAnswer: "Océan Pacifique",
    quizTitle: "Quiz Géographie",
    difficulty: "intermediaire",
    category: "geographie"
  },
  {
    userId: "507f1f77bcf86cd799439011",
    quizType: "vocabulary",
    questionId: "word_3",
    question: "Quel est le sens du mot 'Melliflu' ?",
    userAnswer: "Amer et désagréable",
    correctAnswer: "Doux et agréable comme le miel",
    quizTitle: "Quiz de Vocabulaire",
    difficulty: "intermediaire",
    category: "adjectifs"
  }
];

async function seedUserErrors() {
  try {
    // Connexion à MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connecté à MongoDB');

    // Récupérer le premier utilisateur pour utiliser son ID
    const firstUser = await User.findOne();
    
    if (!firstUser) {
      console.log('❌ Aucun utilisateur trouvé dans la base de données');
      return;
    }

    console.log(`👤 Utilisation de l'utilisateur: ${firstUser.email}`);

    // Supprimer les erreurs existantes
    await UserError.deleteMany({});
    console.log('🗑️ Anciennes erreurs supprimées');

    // Mettre à jour les erreurs avec le vrai ID utilisateur
    const errorsWithRealUserId = userErrors.map(error => ({
      ...error,
      userId: firstUser._id
    }));

    // Insérer les nouvelles erreurs
    const result = await UserError.insertMany(errorsWithRealUserId);
    console.log(`✅ ${result.length} erreurs d'exemple ajoutées`);

    // Afficher les statistiques
    const stats = await UserError.aggregate([
      {
        $group: {
          _id: '$quizType',
          count: { $sum: 1 }
        }
      }
    ]);

    console.log('\n📊 Statistiques par type de quiz:');
    stats.forEach(stat => {
      console.log(`  ${stat._id}: ${stat.count} erreurs`);
    });

    const difficultyStats = await UserError.aggregate([
      {
        $group: {
          _id: '$difficulty',
          count: { $sum: 1 }
        }
      }
    ]);

    console.log('\n📊 Statistiques par difficulté:');
    difficultyStats.forEach(stat => {
      console.log(`  ${stat._id}: ${stat.count} erreurs`);
    });

    console.log('\n🎉 Base de données d\'erreurs initialisée avec succès !');
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Déconnecté de MongoDB');
  }
}

// Exécuter le script
seedUserErrors();
