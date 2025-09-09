#!/usr/bin/env node

/**
 * Script pour configurer le cron job automatique des divisions
 * 
 * Ce script peut être exécuté pour configurer un cron job qui s'exécute
 * automatiquement chaque lundi à 00:00 pour traiter les divisions
 */

const cron = require('node-cron');
const https = require('https');
const http = require('http');

// Configuration
const CRON_SECRET_TOKEN = process.env.CRON_SECRET_TOKEN || 'admin-trigger-local-2024';
const API_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const ENDPOINT = '/api/admin/rankings/auto-process';

console.log('🏆 Configuration du système automatique de divisions');
console.log(`📍 URL: ${API_URL}${ENDPOINT}`);
console.log(`🔐 Token: ${CRON_SECRET_TOKEN ? 'Configuré' : 'Non configuré'}`);

// Fonction pour appeler l'API
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
        'User-Agent': 'Divisions-Auto-Processor/1.0'
      }
    };

    const req = client.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (res.statusCode === 200) {
            console.log('✅ Processus automatique exécuté avec succès:', response.message);
            resolve(response);
          } else {
            console.error('❌ Erreur lors du processus automatique:', response.error);
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

// Configuration du cron job (chaque lundi à 00:00)
const cronSchedule = '0 0 * * 1'; // Lundi à 00:00

console.log('⏰ Configuration du cron job...');
console.log(`📅 Planification: ${cronSchedule} (chaque lundi à 00:00)`);

// Démarrer le cron job
const task = cron.schedule(cronSchedule, async () => {
  console.log('🚀 Déclenchement automatique du processus hebdomadaire...');
  console.log('📅 Date:', new Date().toISOString());
  
  try {
    await callAutoProcessAPI();
  } catch (error) {
    console.error('❌ Échec du processus automatique:', error.message);
  }
}, {
  scheduled: true,
  timezone: "Europe/Paris"
});

console.log('✅ Cron job configuré avec succès !');
console.log('🔄 Le système traitera automatiquement les divisions chaque lundi à 00:00');

// Test manuel (optionnel)
if (process.argv.includes('--test')) {
  console.log('🧪 Test manuel du processus...');
  callAutoProcessAPI()
    .then(() => {
      console.log('✅ Test réussi !');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Test échoué:', error.message);
      process.exit(1);
    });
}

// Garder le processus en vie
process.on('SIGINT', () => {
  console.log('🛑 Arrêt du cron job...');
  task.stop();
  process.exit(0);
});

console.log('💡 Pour tester manuellement, utilisez: node scripts/setup-cron.js --test');
console.log('💡 Pour arrêter, appuyez sur Ctrl+C');
