const { MongoClient } = require('mongodb');
require('dotenv').config();

async function testErrorAPIs() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connecté à MongoDB');
    
    const db = client.db();
    
    // Test 1: Vérifier la collection UserError
    console.log('\n📊 Test 1: Vérification de la collection UserError');
    const userErrorCount = await db.collection('usererrors').countDocuments();
    console.log(`Nombre total d'erreurs utilisateur: ${userErrorCount}`);
    
    if (userErrorCount > 0) {
      const sampleError = await db.collection('usererrors').findOne();
      console.log('Exemple d\'erreur:', {
        quizType: sampleError.quizType,
        questionId: sampleError.questionId,
        difficulty: sampleError.difficulty,
        category: sampleError.category
      });
    }
    
    // Test 2: Vérifier la collection VocabularyWord
    console.log('\n📚 Test 2: Vérification de la collection VocabularyWord');
    const vocabCount = await db.collection('vocabularywords').countDocuments();
    console.log(`Nombre total de mots de vocabulaire: ${vocabCount}`);
    
    if (vocabCount > 0) {
      const sampleWord = await db.collection('vocabularywords').findOne();
      console.log('Exemple de mot:', {
        word: sampleWord.word,
        difficulty: sampleWord.difficulty,
        category: sampleWord.category
      });
    }
    
    // Test 3: Vérifier la collection Quiz
    console.log('\n🎯 Test 3: Vérification de la collection Quiz');
    const quizCount = await db.collection('quizzes').countDocuments();
    console.log(`Nombre total de quiz: ${quizCount}`);
    
    if (quizCount > 0) {
      const sampleQuiz = await db.collection('quizzes').findOne();
      console.log('Exemple de quiz:', {
        title: sampleQuiz.title,
        themeSlug: sampleQuiz.themeSlug,
        difficulty: sampleQuiz.difficulty,
        questionsCount: sampleQuiz.questions?.length || 0
      });
    }
    
    // Test 4: Analyser les erreurs par type
    console.log('\n🔍 Test 4: Analyse des erreurs par type');
    const errorTypes = await db.collection('usererrors').aggregate([
      { $group: { _id: '$quizType', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]).toArray();
    
    console.log('Répartition des erreurs par type:');
    errorTypes.forEach(type => {
      console.log(`  ${type._id || 'Non défini'}: ${type.count}`);
    });
    
    // Test 5: Analyser les erreurs par difficulté
    console.log('\n📈 Test 5: Analyse des erreurs par difficulté');
    const errorDifficulties = await db.collection('usererrors').aggregate([
      { $group: { _id: '$difficulty', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]).toArray();
    
    console.log('Répartition des erreurs par difficulté:');
    errorDifficulties.forEach(diff => {
      console.log(`  ${diff._id || 'Non défini'}: ${diff.count}`);
    });
    
    // Test 6: Vérifier les erreurs récentes (7 derniers jours)
    console.log('\n⏰ Test 6: Erreurs des 7 derniers jours');
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentErrors = await db.collection('usererrors').countDocuments({
      createdAt: { $gte: sevenDaysAgo }
    });
    console.log(`Erreurs des 7 derniers jours: ${recentErrors}`);
    
    // Test 7: Vérifier la cohérence des données
    console.log('\n🔗 Test 7: Cohérence des données');
    const errorsWithMissingData = await db.collection('usererrors').find({
      $or: [
        { quizType: { $exists: false } },
        { questionId: { $exists: false } },
        { difficulty: { $exists: false } }
      ]
    }).count();
    
    console.log(`Erreurs avec données manquantes: ${errorsWithMissingData}`);
    
    // Résumé
    console.log('\n📋 Résumé des tests:');
    console.log(`✅ Collection UserError: ${userErrorCount} erreurs`);
    console.log(`✅ Collection VocabularyWord: ${vocabCount} mots`);
    console.log(`✅ Collection Quiz: ${quizCount} quiz`);
    console.log(`✅ Erreurs récentes (7j): ${recentErrors}`);
    console.log(`⚠️  Données manquantes: ${errorsWithMissingData}`);
    
    if (userErrorCount === 0) {
      console.log('\n💡 Recommandation: Créez quelques erreurs de test pour tester les APIs');
    }
    
  } catch (error) {
    console.error('❌ Erreur lors des tests:', error);
  } finally {
    await client.close();
    console.log('\n🔌 Déconnecté de MongoDB');
  }
}

// Exécuter les tests
testErrorAPIs().catch(console.error);
