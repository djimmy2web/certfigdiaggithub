#!/usr/bin/env node

/**
 * Script pour créer des tentatives de test pour les graphiques
 * Usage: node scripts/create-test-attempts.js
 */

const mongoose = require('mongoose');

// Configuration MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/certifdiag';

// Modèle Attempt simplifié
const AttemptSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  quizId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
  score: { type: Number, required: true },
  totalQuestions: { type: Number, required: true },
  correctAnswers: { type: Number, required: true },
  timeSpent: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now }
});

const Attempt = mongoose.models.Attempt || mongoose.model('Attempt', AttemptSchema);

// Modèle QuizProgress simplifié
const QuizProgressSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  quizId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
  lives: { type: Number, required: true },
  currentQuestionIndex: { type: Number, required: true },
  answers: [{ type: Number }],
  isCompleted: { type: Boolean, default: false },
  isFailed: { type: Boolean, default: false },
  startedAt: { type: Date, default: Date.now },
  lastActivityAt: { type: Date, default: Date.now }
});

const QuizProgress = mongoose.models.QuizProgress || mongoose.model('QuizProgress', QuizProgressSchema);

async function createTestAttempts() {
  try {
    console.log('🔗 Connexion à MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connecté à MongoDB');

    // Récupérer les utilisateurs et quiz existants
    const User = mongoose.model('User');
    const Quiz = mongoose.model('Quiz');

    const users = await User.find({}).limit(5);
    const quizzes = await Quiz.find({ isPublished: true }).limit(3);

    if (users.length === 0) {
      console.log('❌ Aucun utilisateur trouvé. Créez d\'abord des utilisateurs.');
      return;
    }

    if (quizzes.length === 0) {
      console.log('❌ Aucun quiz publié trouvé. Publiez d\'abord des quiz.');
      return;
    }

    console.log(`👥 ${users.length} utilisateurs trouvés`);
    console.log(`📝 ${quizzes.length} quiz trouvés`);

    // Supprimer les anciennes tentatives de test
    console.log('🗑️ Suppression des anciennes tentatives de test...');
    await Attempt.deleteMany({});
    await QuizProgress.deleteMany({});

    // Créer des tentatives pour cette semaine
    const now = new Date();
    const monday = new Date(now);
    monday.setDate(now.getDate() - now.getDay() + 1); // Lundi de cette semaine
    monday.setHours(0, 0, 0, 0);

    console.log('📊 Création des tentatives de test pour cette semaine...');

    const attempts = [];
    const progressions = [];

    // Créer des données pour chaque jour de la semaine
    for (let day = 0; day < 7; day++) {
      const currentDate = new Date(monday);
      currentDate.setDate(monday.getDate() + day);
      
      const dayName = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'][currentDate.getDay()];
      
      // Nombre de tentatives pour ce jour (plus le weekend)
      const attemptsCount = day === 0 || day === 6 ? 8 : 15; // Plus d'activité le weekend
      const progressionsCount = day === 0 || day === 6 ? 12 : 20;

      console.log(`📅 ${dayName} (${currentDate.toLocaleDateString('fr-FR')}): ${attemptsCount} tentatives, ${progressionsCount} progressions`);

      // Créer des tentatives
      for (let i = 0; i < attemptsCount; i++) {
        const user = users[Math.floor(Math.random() * users.length)];
        const quiz = quizzes[Math.floor(Math.random() * quizzes.length)];
        const score = Math.floor(Math.random() * 40) + 60; // Score entre 60% et 100%
        const totalQuestions = Math.floor(Math.random() * 10) + 5; // 5-15 questions
        const correctAnswers = Math.floor((score / 100) * totalQuestions);
        const timeSpent = Math.floor(Math.random() * 300) + 60; // 1-6 minutes

        const attemptTime = new Date(currentDate);
        attemptTime.setHours(Math.floor(Math.random() * 12) + 8); // Entre 8h et 20h
        attemptTime.setMinutes(Math.floor(Math.random() * 60));
        attemptTime.setSeconds(Math.floor(Math.random() * 60));

        attempts.push({
          userId: user._id,
          quizId: quiz._id,
          score,
          totalQuestions,
          correctAnswers,
          timeSpent,
          createdAt: attemptTime
        });
      }

      // Créer des progressions
      for (let i = 0; i < progressionsCount; i++) {
        const user = users[Math.floor(Math.random() * users.length)];
        const quiz = quizzes[Math.floor(Math.random() * quizzes.length)];
        const isCompleted = Math.random() > 0.3; // 70% de réussite
        const isFailed = !isCompleted && Math.random() > 0.5; // 30% d'échec
        const lives = isCompleted ? Math.floor(Math.random() * 3) + 1 : 0; // 1-3 vies restantes si réussi
        const currentQuestionIndex = isCompleted ? quiz.questions?.length || 10 : Math.floor(Math.random() * 5) + 1;

        const startTime = new Date(currentDate);
        startTime.setHours(Math.floor(Math.random() * 12) + 8);
        startTime.setMinutes(Math.floor(Math.random() * 60));
        startTime.setSeconds(Math.floor(Math.random() * 60));

        const lastActivityTime = new Date(startTime);
        lastActivityTime.setMinutes(lastActivityTime.getMinutes() + Math.floor(Math.random() * 30) + 5);

        progressions.push({
          userId: user._id,
          quizId: quiz._id,
          lives,
          currentQuestionIndex,
          answers: [],
          isCompleted,
          isFailed,
          startedAt: startTime,
          lastActivityAt: lastActivityTime
        });
      }
    }

    // Insérer les tentatives
    console.log(`💾 Insertion de ${attempts.length} tentatives...`);
    await Attempt.insertMany(attempts);

    // Insérer les progressions
    console.log(`💾 Insertion de ${progressions.length} progressions...`);
    await QuizProgress.insertMany(progressions);

    console.log('\n📊 Résumé des données créées:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`🎯 Tentatives créées: ${attempts.length}`);
    console.log(`📈 Progressions créées: ${progressions.length}`);
    console.log(`👥 Utilisateurs impliqués: ${users.length}`);
    console.log(`📝 Quiz utilisés: ${quizzes.length}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // Statistiques par jour
    const daysOfWeek = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    console.log('\n📅 Répartition par jour:');
    
    for (let day = 0; day < 7; day++) {
      const currentDate = new Date(monday);
      currentDate.setDate(monday.getDate() + day);
      const dateStr = currentDate.toISOString().split('T')[0];
      
      const dayAttempts = attempts.filter(a => a.createdAt.toISOString().split('T')[0] === dateStr).length;
      const dayProgressions = progressions.filter(p => p.startedAt.toISOString().split('T')[0] === dateStr).length;
      
      console.log(`${daysOfWeek[day].padEnd(10)} | 🎯 ${dayAttempts.toString().padStart(2)} tentatives | 📈 ${dayProgressions.toString().padStart(2)} progressions`);
    }

    console.log('\n🎉 Données de test créées avec succès !');
    console.log('📍 Allez sur /admin/stats pour voir les graphiques');

  } catch (error) {
    console.error('❌ Erreur lors de la création des tentatives:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Déconnecté de MongoDB');
  }
}

// Exécuter le script
createTestAttempts()
  .then(() => {
    console.log('🎉 Script terminé avec succès !');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Erreur fatale:', error);
    process.exit(1);
  });
