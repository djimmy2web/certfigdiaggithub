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

// Fonction pour générer un customId
function generateCustomId() {
  const adjectives = [
    'tomate', 'bleu', 'vert', 'rouge', 'jaune', 'orange', 'violet', 'rose', 'blanc', 'noir',
    'grand', 'petit', 'rapide', 'lent', 'fort', 'faible', 'intelligent', 'sage', 'fou', 'calme',
    'energique', 'tranquille', 'creatif', 'logique', 'artistique', 'scientifique', 'sportif', 'musical',
    'naturel', 'urbain', 'rural', 'cosmique', 'terrestre', 'aquatique', 'aérien', 'souterrain',
    'brillant', 'sombre', 'lumineux', 'mystérieux', 'transparent', 'opaque', 'lisse', 'rugueux',
    'chaud', 'froid', 'doux', 'dur', 'flexible', 'rigide', 'actif', 'passif'
  ];
  
  const nouns = [
    'chat', 'chien', 'oiseau', 'poisson', 'lion', 'tigre', 'ours', 'loup', 'renard', 'lapin',
    'arbre', 'fleur', 'herbe', 'montagne', 'rivière', 'océan', 'forêt', 'désert', 'plage', 'ciel',
    'étoile', 'lune', 'soleil', 'nuage', 'pluie', 'neige', 'vent', 'tempête', 'arc', 'tonnerre',
    'pierre', 'cristal', 'diamant', 'or', 'argent', 'bronze', 'fer', 'cuivre', 'zinc', 'platine',
    'livre', 'crayon', 'papier', 'tableau', 'sculpture', 'peinture', 'musique', 'danse', 'théâtre', 'cinéma',
    'voiture', 'train', 'avion', 'bateau', 'vélo', 'moto', 'bus', 'métro', 'tram', 'téléphérique'
  ];
  
  const numbers = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
  
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  
  // Générer 1-2 chiffres aléatoires
  const numDigits = Math.random() > 0.5 ? 1 : 2;
  let number = '';
  for (let i = 0; i < numDigits; i++) {
    number += numbers[Math.floor(Math.random() * numbers.length)];
  }
  
  return `${adjective}${noun}${number}`;
}

// Fonction pour générer une image de profil
function generateProfileImage(customId, size = 200) {
  return `https://avatar-placeholder.iran.liara.run/api/?name=${encodeURIComponent(customId)}&size=${size}&background=random&color=fff`;
}

async function migrateExistingUser() {
  try {
    console.log('🔌 Connexion à MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connecté à MongoDB');
    
    // Trouver l'utilisateur existant
    const existingUser = await User.findOne({ email: 'test100000000@example.com' });
    
    if (!existingUser) {
      console.log('❌ Utilisateur non trouvé');
      return;
    }
    
    console.log('👤 Utilisateur trouvé:', {
      email: existingUser.email,
      name: existingUser.name,
      customId: existingUser.customId,
      image: existingUser.image
    });
    
    // Vérifier si l'utilisateur a déjà un customId
    if (existingUser.customId) {
      console.log('✅ L\'utilisateur a déjà un customId:', existingUser.customId);
      console.log('✅ L\'utilisateur a déjà une image:', existingUser.image);
      return;
    }
    
    // Générer un customId unique
    console.log('🆔 Génération du customId...');
    let customId;
    let attempts = 0;
    
    do {
      customId = generateCustomId();
      attempts++;
      
      if (attempts > 50) {
        const timestamp = Date.now().toString().slice(-4);
        customId = `${generateCustomId()}${timestamp}`;
        break;
      }
    } while (await User.findOne({ customId }));
    
    console.log('✅ CustomId généré:', customId);
    
    // Générer une image de profil
    console.log('🖼️ Génération de l\'image de profil...');
    const profileImage = generateProfileImage(customId);
    console.log('✅ Image de profil générée:', profileImage);
    
    // Mettre à jour l'utilisateur
    console.log('💾 Mise à jour de l\'utilisateur...');
    await User.findByIdAndUpdate(existingUser._id, {
      customId,
      image: profileImage
    });
    
    console.log('✅ Utilisateur mis à jour avec succès !');
    console.log('📊 Nouvelles données:', {
      email: existingUser.email,
      customId,
      image: profileImage
    });
    
  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Déconnecté de MongoDB');
  }
}

// Exécuter la migration
migrateExistingUser().catch(console.error);
