const { MongoClient } = require('mongodb');
require('dotenv').config();

async function testRecentQuizAPI() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connecté à MongoDB');
    
    const db = client.db();
    
    // Test 1: Vérifier les erreurs utilisateur
    console.log('\n📊 Test 1: Vérification des erreurs utilisateur');
    const userErrors = await db.collection('usererrors').find().limit(3).toArray();
    console.log(`Nombre d'erreurs trouvées: ${userErrors.length}`);
    
    if (userErrors.length > 0) {
      console.log('Exemple d\'erreur:', {
        quizType: userErrors[0].quizType,
        questionId: userErrors[0].questionId,
        question: userErrors[0].question,
        userAnswer: userErrors[0].userAnswer,
        correctAnswer: userErrors[0].correctAnswer
      });
    }
    
    // Test 2: Vérifier les mots de vocabulaire
    console.log('\n📚 Test 2: Vérification des mots de vocabulaire');
    const vocabWords = await db.collection('vocabularywords').find().limit(3).toArray();
    console.log(`Nombre de mots trouvés: ${vocabWords.length}`);
    
    if (vocabWords.length > 0) {
      console.log('Exemple de mot:', {
        _id: vocabWords[0]._id,
        word: vocabWords[0].word,
        correctDefinition: vocabWords[0].correctDefinition
      });
    }
    
    // Test 3: Vérifier les quiz
    console.log('\n🎯 Test 3: Vérification des quiz');
    const quizzes = await db.collection('quizzes').find().limit(3).toArray();
    console.log(`Nombre de quiz trouvés: ${quizzes.length}`);
    
    if (quizzes.length > 0) {
      console.log('Exemple de quiz:', {
        _id: quizzes[0]._id,
        title: quizzes[0].title,
        questionsCount: quizzes[0].questions?.length || 0
      });
    }
    
    console.log('\n✅ Tests terminés avec succès');
    
  } catch (error) {
    console.error('❌ Erreur lors des tests:', error);
  } finally {
    await client.close();
    console.log('\n🔌 Déconnecté de MongoDB');
  }
}

// Exécuter les tests
testRecentQuizAPI().catch(console.error);
