require('dotenv').config();
const mongoose = require('mongoose');

// Définir le schéma User exactement comme dans le modèle
const UserSchema = new mongoose.Schema({
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

const TestUser = mongoose.model('TestUser', UserSchema);

async function testUserModel() {
  try {
    console.log('🔌 Connexion à MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connecté à MongoDB');
    
    // Test 1: Création d'un utilisateur valide
    console.log('\n🧪 Test 1: Création d\'un utilisateur valide');
    
    const testUser = new TestUser({
      email: 'test@example.com',
      passwordHash: 'hash123',
      name: 'Test User',
      customId: 'testuser123',
      image: 'https://avatar-placeholder.iran.liara.run/api/?name=testuser123&size=200&background=random&color=fff'
    });
    
    console.log('📝 Utilisateur à créer:', {
      email: testUser.email,
      name: testUser.name,
      customId: testUser.customId,
      image: testUser.image,
      role: testUser.role,
      points: testUser.points
    });
    
    await testUser.save();
    console.log('✅ Utilisateur créé avec succès !');
    console.log('🆔 ID généré:', testUser._id);
    console.log('📅 Créé le:', testUser.createdAt);
    
    // Test 2: Vérifier que l'utilisateur existe
    console.log('\n🔍 Test 2: Vérification de l\'utilisateur créé');
    const foundUser = await TestUser.findOne({ email: 'test@example.com' });
    console.log('✅ Utilisateur trouvé:', {
      id: foundUser._id,
      email: foundUser.email,
      customId: foundUser.customId,
      image: foundUser.image
    });
    
    // Test 3: Vérifier les index
    console.log('\n🔍 Test 3: Vérification des index');
    const indexes = await TestUser.collection.indexes();
    console.log('📊 Index créés:', indexes.map(idx => ({
      name: idx.name,
      key: idx.key,
      unique: idx.unique
    })));
    
    // Nettoyer
    console.log('\n🧹 Nettoyage...');
    await TestUser.deleteOne({ email: 'test@example.com' });
    console.log('✅ Utilisateur de test supprimé');
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
    
    // Afficher plus de détails sur l'erreur
    if (error.name === 'ValidationError') {
      console.log('\n🔍 Détails de validation:');
      Object.keys(error.errors).forEach(key => {
        console.log(`- ${key}: ${error.errors[key].message}`);
      });
    }
    
    if (error.code === 11000) {
      console.log('\n🔍 Erreur de doublon (code 11000):');
      console.log('Champ en doublon:', Object.keys(error.keyPattern));
    }
    
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Déconnecté de MongoDB');
  }
}

// Exécuter le test
testUserModel().catch(console.error);
