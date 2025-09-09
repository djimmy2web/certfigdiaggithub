const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

// Modèles (simplifiés pour la migration)
const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, index: true },
  passwordHash: { type: String }, // Plus requis pour permettre les connexions OAuth
  name: { type: String },
  username: { type: String, unique: true, sparse: true },
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

const AccountSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  type: { type: String, required: true },
  provider: { type: String, required: true },
  providerAccountId: { type: String, required: true },
  refresh_token: { type: String },
  access_token: { type: String },
  expires_at: { type: Number },
  token_type: { type: String },
  scope: { type: String },
  id_token: { type: String },
  session_state: { type: String },
}, { timestamps: true });

const SessionSchema = new mongoose.Schema({
  sessionToken: { type: String, required: true, unique: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  expires: { type: Date, required: true },
}, { timestamps: true });

const VerificationTokenSchema = new mongoose.Schema({
  identifier: { type: String, required: true },
  token: { type: String, required: true },
  expires: { type: Date, required: true },
}, { timestamps: true });

// Index pour les comptes OAuth
AccountSchema.index({ provider: 1, providerAccountId: 1 }, { unique: true });
VerificationTokenSchema.index({ identifier: 1, token: 1 }, { unique: true });

const User = mongoose.models.User || mongoose.model('User', UserSchema);
const Account = mongoose.models.Account || mongoose.model('Account', AccountSchema);
const Session = mongoose.models.Session || mongoose.model('Session', SessionSchema);
const VerificationToken = mongoose.models.VerificationToken || mongoose.model('VerificationToken', VerificationTokenSchema);

async function migrateDatabase() {
  try {
    console.log('🔗 Connexion à MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connecté à MongoDB');

    console.log('🔄 Début de la migration...');

    // Vérifier si les collections existent déjà
    const collections = await mongoose.connection.db.listCollections().toArray();
    const collectionNames = collections.map(col => col.name);

    // Créer les nouvelles collections si elles n'existent pas
    if (!collectionNames.includes('accounts')) {
      console.log('📝 Création de la collection accounts...');
      await mongoose.connection.db.createCollection('accounts');
    }

    if (!collectionNames.includes('sessions')) {
      console.log('📝 Création de la collection sessions...');
      await mongoose.connection.db.createCollection('sessions');
    }

    if (!collectionNames.includes('verificationtokens')) {
      console.log('📝 Création de la collection verificationtokens...');
      await mongoose.connection.db.createCollection('verificationtokens');
    }

    // Mettre à jour les utilisateurs existants pour s'assurer qu'ils ont un rôle
    console.log('👥 Mise à jour des utilisateurs existants...');
    const updateResult = await User.updateMany(
      { role: { $exists: false } },
      { $set: { role: "user" } }
    );
    console.log(`✅ ${updateResult.modifiedCount} utilisateurs mis à jour`);

    // Vérifier que tous les utilisateurs ont un rôle
    const usersWithoutRole = await User.countDocuments({ role: { $exists: false } });
    if (usersWithoutRole > 0) {
      console.log(`⚠️  ${usersWithoutRole} utilisateurs n'ont toujours pas de rôle`);
    } else {
      console.log('✅ Tous les utilisateurs ont un rôle');
    }

    // Compter les documents dans chaque collection
    const userCount = await User.countDocuments();
    const accountCount = await Account.countDocuments();
    const sessionCount = await Session.countDocuments();
    const verificationTokenCount = await VerificationToken.countDocuments();

    console.log('\n📊 Statistiques de la base de données :');
    console.log(`- Utilisateurs : ${userCount}`);
    console.log(`- Comptes OAuth : ${accountCount}`);
    console.log(`- Sessions : ${sessionCount}`);
    console.log(`- Tokens de vérification : ${verificationTokenCount}`);

    console.log('\n✅ Migration terminée avec succès !');
    console.log('\n📋 Prochaines étapes :');
    console.log('1. Configurez vos variables d\'environnement OAuth dans .env.local');
    console.log('2. Redémarrez votre serveur de développement');
    console.log('3. Testez les connexions OAuth');

  } catch (error) {
    console.error('❌ Erreur lors de la migration :', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Déconnecté de MongoDB');
  }
}

// Exécuter la migration si le script est appelé directement
if (require.main === module) {
  migrateDatabase();
}

module.exports = { migrateDatabase };
