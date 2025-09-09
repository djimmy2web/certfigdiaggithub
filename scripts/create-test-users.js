#!/usr/bin/env node

/**
 * Script pour créer des utilisateurs de test dans toutes les divisions
 * Usage: node scripts/create-test-users.js
 */

const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

// Configuration MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/certifdiag';

// Modèle User simplifié
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

const User = mongoose.models.User || mongoose.model('User', UserSchema);

// Configuration des utilisateurs de test
const testUsers = [
  // Division Bronze (10-149 points)
  {
    email: 'bronze1@test.com',
    password: 'password123',
    name: 'Bronze Champion',
    customId: 'bronze_champion',
    points: 145,
    division: 'Bronze'
  },
  {
    email: 'bronze2@test.com',
    password: 'password123',
    name: 'Bronze Fighter',
    customId: 'bronze_fighter',
    points: 120,
    division: 'Bronze'
  },
  {
    email: 'bronze3@test.com',
    password: 'password123',
    name: 'Bronze Warrior',
    customId: 'bronze_warrior',
    points: 95,
    division: 'Bronze'
  },
  {
    email: 'bronze4@test.com',
    password: 'password123',
    name: 'Bronze Rookie',
    customId: 'bronze_rookie',
    points: 65,
    division: 'Bronze'
  },
  {
    email: 'bronze5@test.com',
    password: 'password123',
    name: 'Bronze Newbie',
    customId: 'bronze_newbie',
    points: 35,
    division: 'Bronze'
  },
  {
    email: 'bronze6@test.com',
    password: 'password123',
    name: 'Bronze Starter',
    customId: 'bronze_starter',
    points: 15,
    division: 'Bronze'
  },

  // Division Argent (150-499 points)
  {
    email: 'argent1@test.com',
    password: 'password123',
    name: 'Argent Master',
    customId: 'argent_master',
    points: 480,
    division: 'Argent'
  },
  {
    email: 'argent2@test.com',
    password: 'password123',
    name: 'Argent Elite',
    customId: 'argent_elite',
    points: 420,
    division: 'Argent'
  },
  {
    email: 'argent3@test.com',
    password: 'password123',
    name: 'Argent Pro',
    customId: 'argent_pro',
    points: 350,
    division: 'Argent'
  },
  {
    email: 'argent4@test.com',
    password: 'password123',
    name: 'Argent Expert',
    customId: 'argent_expert',
    points: 280,
    division: 'Argent'
  },
  {
    email: 'argent5@test.com',
    password: 'password123',
    name: 'Argent Skilled',
    customId: 'argent_skilled',
    points: 200,
    division: 'Argent'
  },
  {
    email: 'argent6@test.com',
    password: 'password123',
    name: 'Argent Rising',
    customId: 'argent_rising',
    points: 160,
    division: 'Argent'
  },

  // Division Or (500-999 points)
  {
    email: 'or1@test.com',
    password: 'password123',
    name: 'Or Legend',
    customId: 'or_legend',
    points: 950,
    division: 'Or'
  },
  {
    email: 'or2@test.com',
    password: 'password123',
    name: 'Or Champion',
    customId: 'or_champion',
    points: 850,
    division: 'Or'
  },
  {
    email: 'or3@test.com',
    password: 'password123',
    name: 'Or Master',
    customId: 'or_master',
    points: 750,
    division: 'Or'
  },
  {
    email: 'or4@test.com',
    password: 'password123',
    name: 'Or Elite',
    customId: 'or_elite',
    points: 650,
    division: 'Or'
  },
  {
    email: 'or5@test.com',
    password: 'password123',
    name: 'Or Pro',
    customId: 'or_pro',
    points: 580,
    division: 'Or'
  },
  {
    email: 'or6@test.com',
    password: 'password123',
    name: 'Or Rising',
    customId: 'or_rising',
    points: 520,
    division: 'Or'
  },

  // Division Saphir (1000+ points)
  {
    email: 'saphir1@test.com',
    password: 'password123',
    name: 'Saphir God',
    customId: 'saphir_god',
    points: 2500,
    division: 'Saphir'
  },
  {
    email: 'saphir2@test.com',
    password: 'password123',
    name: 'Saphir Legend',
    customId: 'saphir_legend',
    points: 2100,
    division: 'Saphir'
  },
  {
    email: 'saphir3@test.com',
    password: 'password123',
    name: 'Saphir Master',
    customId: 'saphir_master',
    points: 1800,
    division: 'Saphir'
  },
  {
    email: 'saphir4@test.com',
    password: 'password123',
    name: 'Saphir Elite',
    customId: 'saphir_elite',
    points: 1500,
    division: 'Saphir'
  },
  {
    email: 'saphir5@test.com',
    password: 'password123',
    name: 'Saphir Pro',
    customId: 'saphir_pro',
    points: 1250,
    division: 'Saphir'
  },
  {
    email: 'saphir6@test.com',
    password: 'password123',
    name: 'Saphir Rising',
    customId: 'saphir_rising',
    points: 1100,
    division: 'Saphir'
  }
];

async function createTestUsers() {
  try {
    console.log('🔗 Connexion à MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connecté à MongoDB');

    // Nettoyer les utilisateurs avec customId null pour éviter les conflits
    console.log('🧹 Nettoyage des utilisateurs avec customId null...');
    await User.deleteMany({ customId: null });
    console.log('✅ Nettoyage terminé');

    console.log('👥 Création des utilisateurs de test...\n');

    for (const userData of testUsers) {
      console.log(`🔍 Traitement de ${userData.division}...`);
      
      // Vérifier si l'utilisateur existe déjà
      const existingUser = await User.findOne({ 
        $or: [
          { email: userData.email },
          { customId: userData.customId }
        ]
      });

      if (existingUser) {
        console.log(`⚠️ Utilisateur ${userData.division} existe déjà, mise à jour...`);
        
        await User.findByIdAndUpdate(existingUser._id, {
          points: userData.points,
          updatedAt: new Date()
        });
        
        console.log(`✅ ${userData.division} mis à jour - ${userData.points} points`);
      } else {
        console.log(`👤 Création de ${userData.division}...`);
        
        // Hasher le mot de passe
        const passwordHash = await bcrypt.hash(userData.password, 10);
        
        // Créer l'utilisateur
        const newUser = new User({
          email: userData.email,
          passwordHash: passwordHash,
          name: userData.name,
          customId: userData.customId,
          points: userData.points,
          role: 'user'
        });
        
        await newUser.save();
        console.log(`✅ ${userData.division} créé - ${userData.points} points`);
      }
    }

    console.log('\n📊 Résumé des utilisateurs créés:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    for (const userData of testUsers) {
      console.log(`🏆 ${userData.division.padEnd(8)} | 📧 ${userData.email.padEnd(20)} | 🔑 ${userData.password.padEnd(12)} | 📊 ${userData.points} points`);
    }
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n🎯 Informations de connexion:');
    console.log(`📍 URL: http://localhost:3000/connexion`);
    console.log(`🔑 Mot de passe pour tous: password123`);

  } catch (error) {
    console.error('❌ Erreur lors de la création:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Déconnecté de MongoDB');
  }
}

// Exécuter le script
createTestUsers()
  .then(() => {
    console.log('🎉 Script terminé avec succès !');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Erreur fatale:', error);
    process.exit(1);
  });
