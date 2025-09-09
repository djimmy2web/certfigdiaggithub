#!/usr/bin/env node

/**
 * Script pour déclencher manuellement le processus automatique des divisions
 * Usage: npm run auto-process
 */

const https = require('https');
const http = require('http');

// Configuration
const CRON_SECRET_TOKEN = process.env.CRON_SECRET_TOKEN || 'admin-trigger-local-2024';
const API_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const ENDPOINT = '/api/admin/rankings/auto-process';

console.log('🏆 Déclenchement manuel du processus automatique des divisions');
console.log(`📍 URL: ${API_URL}${ENDPOINT}`);

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

    console.log('🚀 Envoi de la requête...');

    const req = client.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (res.statusCode === 200) {
            console.log('✅ Processus automatique exécuté avec succès !');
            console.log('📊 Résumé:', response.summary);
            console.log('📅 Semaine:', new Date(response.weekStart).toLocaleDateString('fr-FR'));
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

// Exécuter le processus
callAutoProcessAPI()
  .then(() => {
    console.log('🎉 Processus terminé avec succès !');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Échec du processus:', error.message);
    process.exit(1);
  });
