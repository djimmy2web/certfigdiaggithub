#!/usr/bin/env node

/**
 * Script pour forcer le recalcul des classements
 * Usage: node scripts/force-recalculate.js
 */

const mongoose = require('mongoose');

// Configuration MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/certifdiag';

// Modèle WeeklyRanking simplifié
const WeeklyRankingSchema = new mongoose.Schema({
  weekStart: { type: Date, required: true },
  weekEnd: { type: Date, required: true },
  divisionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Division', required: true },
  rankings: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    username: { type: String, required: true },
    points: { type: Number, required: true, default: 0 },
    rank: { type: Number, required: true },
    previousRank: { type: Number, required: false },
    status: { type: String, enum: ['promoted', 'relegated', 'stayed', 'new'], required: true, default: 'new' }
  }],
  isProcessed: { type: Boolean, default: false }
});

const WeeklyRanking = mongoose.models.WeeklyRanking || mongoose.model('WeeklyRanking', WeeklyRankingSchema);

async function forceRecalculate() {
  try {
    console.log('🔗 Connexion à MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connecté à MongoDB');

    // Calculer la semaine actuelle (lundi)
    const now = new Date();
    const monday = new Date(now);
    monday.setDate(now.getDate() - now.getDay() + 1); // Lundi de cette semaine
    monday.setHours(0, 0, 0, 0);

    const startDate = monday;
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 6);

    console.log(`🗑️ Suppression des classements existants pour la semaine du ${startDate.toLocaleDateString('fr-FR')}...`);
    
    // Supprimer les classements existants pour cette semaine
    const deleteResult = await WeeklyRanking.deleteMany({ weekStart: startDate });
    console.log(`✅ ${deleteResult.deletedCount} classements supprimés`);

    console.log('🔄 Déclenchement du processus automatique...');
    
    // Appeler l'API pour recalculer
    const https = require('https');
    const http = require('http');
    
    const CRON_SECRET_TOKEN = process.env.CRON_SECRET_TOKEN || 'admin-trigger-local-2024';
    const API_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const ENDPOINT = '/api/admin/rankings/auto-process';

    function callAutoProcessAPI() {
      return new Promise((resolve, reject) => {
        const url = new URL(ENDPOINT, API_URL);
        const isHttps = url.protocol === 'https:';
        const client = isHttps ? https : http;
        
        const options = {
          hostname: url.hostname,
          port: url.port || (isHttps ? 443 : 3000),
          path: url.pathname,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${CRON_SECRET_TOKEN}`,
            'User-Agent': 'Force-Recalculate/1.0'
          }
        };

        console.log('🚀 Envoi de la requête de recalcul...');

        const req = client.request(options, (res) => {
          let data = '';
          
          res.on('data', (chunk) => {
            data += chunk;
          });
          
          res.on('end', () => {
            try {
              const response = JSON.parse(data);
              if (res.statusCode === 200) {
                console.log('✅ Recalcul terminé avec succès !');
                console.log('📊 Résumé:', response.summary);
                resolve(response);
              } else {
                console.error('❌ Erreur lors du recalcul:', response.error);
                reject(new Error(response.error));
              }
            } catch (error) {
              console.error('❌ Erreur de parsing de la réponse:', error);
              reject(error);
            }
          });
        });

        req.on('error', (error) => {
          console.error('❌ Erreur de connexion:', error.message);
          reject(error);
        });

        req.end();
      });
    }

    await callAutoProcessAPI();

    console.log('\n🎯 Vérification des classements...');
    
    // Vérifier les classements créés
    const rankings = await WeeklyRanking.find({ weekStart: startDate }).populate('divisionId');
    
    console.log(`📊 ${rankings.length} divisions traitées:`);
    
    for (const ranking of rankings) {
      console.log(`🏆 ${ranking.divisionId.name}: ${ranking.rankings.length} joueurs`);
      ranking.rankings.forEach((player, index) => {
        console.log(`   ${index + 1}. ${player.username} - ${player.points} points`);
      });
    }

  } catch (error) {
    console.error('❌ Erreur lors du recalcul:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Déconnecté de MongoDB');
  }
}

// Exécuter le script
forceRecalculate()
  .then(() => {
    console.log('🎉 Recalcul terminé avec succès !');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Erreur fatale:', error);
    process.exit(1);
  });
