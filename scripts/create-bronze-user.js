#!/usr/bin/env node

/**
 * Script pour créer un utilisateur en division Bronze
 * Usage: node scripts/create-bronze-user.js
 */

const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

// Configuration MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/certifdiag';

// Modèle User simplifié
const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  name: { type: String },
  username: { type: String, unique: true, sparse: true },
  points: { type: Number, default: 0, index: true },
  role: { type: String, enum: ["user", "admin"], default: "user", index: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const User = mongoose.models.User || mongoose.model('User', UserSchema);

async function createBronzeUser() {
  try {
    console.log('🔗 Connexion à MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connecté à MongoDB');

    // Configuration de l'utilisateur Bronze
    const userData = {
      email: 'bronze@example.com',
      password: 'password123',
      name: 'Joueur Bronze',
      username: 'bronze_player',
      points: 15 // Assez de points pour être en Bronze (10+ points)
    };

    console.log('🔍 Vérification si l\'utilisateur existe déjà...');
    
    // Vérifier si l'utilisateur existe déjà
    const existingUser = await User.findOne({ 
      $or: [
        { email: userData.email },
        { username: userData.username }
      ]
    });

    if (existingUser) {
      console.log('⚠️ Utilisateur existe déjà, mise à jour des points...');
      
      // Mettre à jour les points pour s'assurer qu'il est en Bronze
      await User.findByIdAndUpdate(existingUser._id, {
        points: userData.points,
        updatedAt: new Date()
      });
      
      console.log('✅ Points mis à jour pour l\'utilisateur existant');
      console.log(`📊 Points actuels: ${userData.points}`);
      console.log(`🏆 Division: Bronze (10+ points)`);
      
    } else {
      console.log('👤 Création d\'un nouvel utilisateur Bronze...');
      
      // Hasher le mot de passe
      const passwordHash = await bcrypt.hash(userData.password, 10);
      
      // Créer l'utilisateur
      const newUser = new User({
        email: userData.email,
        passwordHash: passwordHash,
        name: userData.name,
        username: userData.username,
        points: userData.points,
        role: 'user'
      });
      
      await newUser.save();
      
      console.log('✅ Utilisateur Bronze créé avec succès !');
      console.log(`📧 Email: ${userData.email}`);
      console.log(`🔑 Mot de passe: ${userData.password}`);
      console.log(`👤 Nom: ${userData.name}`);
      console.log(`📊 Points: ${userData.points}`);
      console.log(`🏆 Division: Bronze (10+ points)`);
    }

    // Vérifier la division
    console.log('\n🔍 Vérification de la division...');
    const user = await User.findOne({ email: userData.email });
    
    if (user.points >= 10 && user.points < 150) {
      console.log('✅ Utilisateur correctement placé en division Bronze !');
    } else if (user.points >= 150 && user.points < 500) {
      console.log('⚠️ Utilisateur placé en division Argent (150+ points)');
    } else if (user.points >= 500 && user.points < 1000) {
      console.log('⚠️ Utilisateur placé en division Or (500+ points)');
    } else if (user.points >= 1000) {
      console.log('⚠️ Utilisateur placé en division Saphir (1000+ points)');
    } else {
      console.log('❌ Utilisateur non classé (< 10 points)');
    }

    console.log('\n🎯 Informations de connexion:');
    console.log(`📍 URL: http://localhost:3000/connexion`);
    console.log(`📧 Email: ${userData.email}`);
    console.log(`🔑 Mot de passe: ${userData.password}`);

  } catch (error) {
    console.error('❌ Erreur lors de la création:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Déconnecté de MongoDB');
  }
}

// Exécuter le script
createBronzeUser()
  .then(() => {
    console.log('🎉 Script terminé avec succès !');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Erreur fatale:', error);
    process.exit(1);
  });
