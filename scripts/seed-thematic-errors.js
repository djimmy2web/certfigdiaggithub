const { MongoClient } = require('mongodb');
require('dotenv').config();

async function seedThematicErrors() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connecté à MongoDB');
    
    const db = client.db();
    
    // Vérifier qu'il y a des quiz et des utilisateurs
    const quizCount = await db.collection('quizzes').countDocuments();
    const userCount = await db.collection('users').countDocuments();
    
    if (quizCount === 0) {
      console.log('❌ Aucun quiz trouvé. Créez d\'abord des quiz thématiques.');
      return;
    }
    
    if (userCount === 0) {
      console.log('❌ Aucun utilisateur trouvé. Créez d\'abord des utilisateurs.');
      return;
    }
    
    console.log(`📊 Quiz disponibles: ${quizCount}`);
    console.log(`👥 Utilisateurs disponibles: ${userCount}`);
    
    // Récupérer un utilisateur de test
    const testUser = await db.collection('users').findOne();
    if (!testUser) {
      console.log('❌ Aucun utilisateur de test trouvé');
      return;
    }
    
    console.log(`👤 Utilisateur de test: ${testUser.email || testUser.name || testUser._id}`);
    
    // Récupérer quelques quiz thématiques
    const quizzes = await db.collection('quizzes').find({ isPublished: true }).limit(5).toArray();
    
    if (quizzes.length === 0) {
      console.log('❌ Aucun quiz publié trouvé');
      return;
    }
    
    console.log(`🎯 Quiz thématiques trouvés: ${quizzes.length}`);
    
    // Créer des erreurs de test pour les quiz thématiques
    const thematicErrors = [];
    
    for (const quiz of quizzes) {
      if (quiz.questions && quiz.questions.length > 0) {
        const question = quiz.questions[0];
        
        if (question.choices && question.choices.length >= 2) {
          // Trouver la réponse correcte
          const correctChoice = question.choices.find(choice => choice.isCorrect);
          const wrongChoices = question.choices.filter(choice => !choice.isCorrect);
          
          if (correctChoice && wrongChoices.length > 0) {
            // Créer une erreur en choisissant une mauvaise réponse
            const wrongChoice = wrongChoices[Math.floor(Math.random() * wrongChoices.length)];
            
            const error = {
              userId: testUser._id,
              quizType: 'thematic',
              questionId: quiz._id,
              question: question.text,
              userAnswer: wrongChoice.text,
              correctAnswer: correctChoice.text,
              quizTitle: quiz.title,
              difficulty: quiz.difficulty || 'intermediaire',
              category: quiz.themeSlug || 'general',
              createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000) // Erreur des 7 derniers jours
            };
            
            thematicErrors.push(error);
          }
        }
      }
    }
    
    if (thematicErrors.length === 0) {
      console.log('❌ Impossible de créer des erreurs thématiques (structure des questions invalide)');
      return;
    }
    
    console.log(`📝 Création de ${thematicErrors.length} erreurs thématiques...`);
    
    // Insérer les erreurs
    const result = await db.collection('usererrors').insertMany(thematicErrors);
    
    console.log(`✅ ${result.insertedCount} erreurs thématiques créées avec succès`);
    
    // Afficher un exemple
    console.log('\n📋 Exemple d\'erreur créée:');
    console.log({
      quizType: thematicErrors[0].quizType,
      quizTitle: thematicErrors[0].quizTitle,
      question: thematicErrors[0].question.substring(0, 50) + '...',
      userAnswer: thematicErrors[0].userAnswer,
      correctAnswer: thematicErrors[0].correctAnswer,
      difficulty: thematicErrors[0].difficulty,
      category: thematicErrors[0].category
    });
    
    // Vérifier le total des erreurs
    const totalErrors = await db.collection('usererrors').countDocuments();
    const thematicErrorsCount = await db.collection('usererrors').countDocuments({ quizType: 'thematic' });
    const vocabularyErrorsCount = await db.collection('usererrors').countDocuments({ quizType: 'vocabulary' });
    
    console.log('\n📊 Résumé des erreurs:');
    console.log(`  Total: ${totalErrors}`);
    console.log(`  Thématiques: ${thematicErrorsCount}`);
    console.log(`  Vocabulaire: ${vocabularyErrorsCount}`);
    
    console.log('\n🎉 Script terminé avec succès !');
    console.log('💡 Vous pouvez maintenant tester les APIs:');
    console.log('   - GET /api/user-errors/recent-quiz');
    console.log('   - GET /api/user-errors/recent');
    console.log('   - GET /api/user-errors/stats');
    
  } catch (error) {
    console.error('❌ Erreur lors de la création des erreurs thématiques:', error);
  } finally {
    await client.close();
    console.log('\n🔌 Déconnecté de MongoDB');
  }
}

// Exécuter le script
seedThematicErrors().catch(console.error);
