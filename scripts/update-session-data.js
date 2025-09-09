require('dotenv').config();
const mongoose = require('mongoose');

// Définir le schéma User
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

const User = mongoose.model('User', UserSchema);

async function checkUserData() {
  try {
    console.log('🔌 Connexion à MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connecté à MongoDB');
    
    // Trouver l'utilisateur existant
    const user = await User.findOne({ email: 'test100000000@example.com' });
    
    if (!user) {
      console.log('❌ Utilisateur non trouvé');
      return;
    }
    
    console.log('👤 Données utilisateur en base:');
    console.log('📧 Email:', user.email);
    console.log('👤 Nom:', user.name);
    console.log('🆔 CustomId:', user.customId);
    console.log('🖼️ Image:', user.image);
    console.log('👑 Rôle:', user.role);
    console.log('📅 Créé le:', user.createdAt);
    console.log('🔄 Modifié le:', user.updatedAt);
    
    console.log('\n💡 Pour que les changements apparaissent dans la navigation:');
    console.log('1. Déconnectez-vous de l\'application');
    console.log('2. Reconnectez-vous avec vos identifiants');
    console.log('3. Vous devriez voir "violetchat96" et votre image de profil dans la navigation');
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Déconnecté de MongoDB');
  }
}

// Exécuter la vérification
checkUserData().catch(console.error);
