const { MongoClient } = require('mongodb');
require('dotenv').config();

async function testThemeProgression() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connecté à MongoDB');
    
    const db = client.db();
    
    // Test 1: Vérifier les quiz par thème et niveau
    console.log('\n📊 Test 1: Quiz par thème et niveau');
    const quizzes = await db.collection('quizzes').find({ isPublished: true }).toArray();
    
    const quizzesByTheme = {};
    quizzes.forEach(quiz => {
      if (!quizzesByTheme[quiz.themeSlug]) {
        quizzesByTheme[quiz.themeSlug] = { debutant: [], intermediaire: [], expert: [] };
      }
      if (quiz.difficulty) {
        quizzesByTheme[quiz.themeSlug][quiz.difficulty].push({
          id: quiz._id,
          title: quiz.title,
          questionsCount: quiz.questions?.length || 0
        });
      }
    });
    
    Object.entries(quizzesByTheme).forEach(([theme, levels]) => {
      console.log(`\n🎯 Thème: ${theme}`);
      console.log(`  Débutant: ${levels.debutant.length} quiz`);
      console.log(`  Intermédiaire: ${levels.intermediaire.length} quiz`);
      console.log(`  Expert: ${levels.expert.length} quiz`);
    });
    
    // Test 2: Vérifier la collection ThemeProgress
    console.log('\n📈 Test 2: Vérification de la collection ThemeProgress');
    const themeProgressCount = await db.collection('themeprogress').countDocuments();
    console.log(`Nombre total de progressions: ${themeProgressCount}`);
    
    if (themeProgressCount > 0) {
      const sampleProgress = await db.collection('themeprogress').findOne();
      console.log('Exemple de progression:', {
        themeSlug: sampleProgress.themeSlug,
        currentLevel: sampleProgress.currentLevel,
        totalQuizzesCompleted: sampleProgress.totalQuizzesCompleted,
        totalScore: sampleProgress.totalScore
      });
    }
    
    // Test 3: Analyser la répartition des niveaux
    console.log('\n🎯 Test 3: Répartition des niveaux actuels');
    const levelDistribution = await db.collection('themeprogress').aggregate([
      { $group: { _id: '$currentLevel', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]).toArray();
    
    console.log('Répartition des niveaux:');
    levelDistribution.forEach(level => {
      console.log(`  ${level._id}: ${level.count} utilisateurs`);
    });
    
    // Test 4: Vérifier les quiz complétés
    console.log('\n✅ Test 4: Quiz complétés');
    const completedQuizzes = await db.collection('themeprogress').aggregate([
      { $unwind: '$completedQuizzes' },
      { $group: { _id: '$completedQuizzes.difficulty', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]).toArray();
    
    console.log('Quiz complétés par niveau:');
    completedQuizzes.forEach(level => {
      console.log(`  ${level._id}: ${level.count} quiz`);
    });
    
    // Test 5: Recommandations pour le système
    console.log('\n💡 Test 5: Recommandations');
    
    const themesWithoutQuizzes = Object.entries(quizzesByTheme).filter(([theme, levels]) => 
      levels.debutant.length === 0 && levels.intermediaire.length === 0 && levels.expert.length === 0
    );
    
    if (themesWithoutQuizzes.length > 0) {
      console.log('⚠️  Thèmes sans quiz:');
      themesWithoutQuizzes.forEach(([theme]) => {
        console.log(`  - ${theme}`);
      });
    }
    
    const themesWithoutBeginner = Object.entries(quizzesByTheme).filter(([theme, levels]) => 
      levels.debutant.length === 0
    );
    
    if (themesWithoutBeginner.length > 0) {
      console.log('⚠️  Thèmes sans quiz débutant:');
      themesWithoutBeginner.forEach(([theme]) => {
        console.log(`  - ${theme}`);
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
testThemeProgression().catch(console.error);
