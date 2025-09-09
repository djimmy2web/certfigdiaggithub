const { MongoClient } = require('mongodb');
require('dotenv').config();

async function testRegisterAPI() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connecté à MongoDB');
    
    const db = client.db();
    
    // Vérifier la structure de la collection users
    console.log('\n🔍 Vérification de la structure de la collection users...');
    
    // Récupérer le schéma de la collection
    const collectionInfo = await db.listCollections({ name: 'users' }).toArray();
    console.log('Collection users:', collectionInfo);
    
    // Vérifier les utilisateurs existants
    const existingUsers = await db.collection('users').find({}).toArray();
    console.log(`\n📊 Utilisateurs existants: ${existingUsers.length}`);
    
    if (existingUsers.length > 0) {
      const user = existingUsers[0];
      console.log('Structure du premier utilisateur:');
      console.log('- email:', user.email);
      console.log('- customId:', user.customId);
      console.log('- image:', user.image);
      console.log('- role:', user.role);
      console.log('- points:', user.points);
      console.log('- createdAt:', user.createdAt);
      console.log('- updatedAt:', user.updatedAt);
    }
    
    // Vérifier les index
    console.log('\n🔍 Vérification des index...');
    const indexes = await db.collection('users').indexes();
    console.log('Index existants:', indexes.map(idx => idx.name));
    
    // Tester la création d'un utilisateur avec le modèle Mongoose
    console.log('\n🧪 Test de création d\'utilisateur...');
    
    // Importer le modèle User
    const mongoose = require('mongoose');
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Définir le schéma temporairement pour le test
    const userSchema = new mongoose.Schema({
      email: { type: String, required: true, unique: true, lowercase: true, index: true },
      passwordHash: { type: String },
      name: { type: String },
      customId: { type: String, required: true, unique: true, index: true },
      points: { type: Number, default: 0, index: true },
      role: { type: String, enum: ["user", "admin"], default: "user", index: true },
      image: { type: String },
      emailVerified: { type: Date },
      subscription: {
        plan: { type: String, enum: ["free", "pro", "premium"], default: "free" },
        stripeCustomerId: { type: String },
        stripeSubscriptionId: { type: String },
        currentPeriodEnd: { type: Date },
        status: { type: String },
      },
    }, { timestamps: true });
    
    const TestUser = mongoose.model('TestUser', userSchema);
    
    try {
      // Tester avec un customId manquant
      console.log('\n❌ Test 1: Création sans customId (devrait échouer)');
      const userWithoutCustomId = new TestUser({
        email: 'test@example.com',
        passwordHash: 'hash123',
        name: 'Test User'
      });
      
      await userWithoutCustomId.save();
      console.log('❌ Erreur: L\'utilisateur a été créé sans customId');
    } catch (error) {
      console.log('✅ Correct: Erreur lors de la création sans customId');
      console.log('Erreur:', error.message);
    }
    
    try {
      // Tester avec un customId
      console.log('\n✅ Test 2: Création avec customId (devrait réussir)');
      const userWithCustomId = new TestUser({
        email: 'test2@example.com',
        passwordHash: 'hash456',
        name: 'Test User 2',
        customId: 'testuser123',
        image: 'https://avatar-placeholder.iran.liara.run/api/?name=testuser123&size=200&background=random&color=fff'
      });
      
      await userWithCustomId.save();
      console.log('✅ Succès: Utilisateur créé avec customId');
      
      // Nettoyer
      await TestUser.deleteOne({ email: 'test2@example.com' });
      console.log('🧹 Test utilisateur supprimé');
      
    } catch (error) {
      console.log('❌ Erreur lors de la création avec customId:', error.message);
    }
    
    await mongoose.disconnect();
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  } finally {
    await client.close();
    console.log('\n🔌 Déconnecté de MongoDB');
  }
}

// Exécuter le test
testRegisterAPI().catch(console.error);
