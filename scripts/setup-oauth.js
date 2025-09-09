const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Générer une clé secrète sécurisée pour NextAuth
function generateSecret() {
  return crypto.randomBytes(32).toString('hex');
}

// Créer ou mettre à jour le fichier .env.local
function setupEnvironment() {
  const envPath = path.join(process.cwd(), '.env.local');
  const secret = generateSecret();
  
  const envContent = `# NextAuth
NEXTAUTH_SECRET=${secret}
NEXTAUTH_URL=http://localhost:3000

# MongoDB (remplacez par votre URI MongoDB)
MONGODB_URI=mongodb://localhost:27017/certifdiag

# Google OAuth (à configurer)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Facebook OAuth (à configurer)
FACEBOOK_CLIENT_ID=your-facebook-client-id
FACEBOOK_CLIENT_SECRET=your-facebook-client-secret

# Stripe (si utilisé)
STRIPE_SECRET_KEY=your-stripe-secret-key
STRIPE_PUBLISHABLE_KEY=your-stripe-publishable-key
STRIPE_WEBHOOK_SECRET=your-stripe-webhook-secret
`;

  try {
    fs.writeFileSync(envPath, envContent);
    console.log('✅ Fichier .env.local créé avec succès');
    console.log(`🔑 Clé secrète NextAuth générée: ${secret}`);
    console.log('\n📋 Prochaines étapes:');
    console.log('1. Configurez vos variables OAuth (Google et Facebook)');
    console.log('2. Mettez à jour MONGODB_URI avec votre URI MongoDB');
    console.log('3. Redémarrez votre serveur de développement');
    console.log('4. Testez les connexions OAuth');
  } catch (error) {
    console.error('❌ Erreur lors de la création du fichier .env.local:', error.message);
  }
}

// Instructions pour configurer OAuth
function showOAuthInstructions() {
  console.log('\n🔧 Instructions pour configurer OAuth:');
  console.log('\n📱 Google OAuth:');
  console.log('1. Allez sur https://console.cloud.google.com/');
  console.log('2. Créez un projet ou sélectionnez un existant');
  console.log('3. Activez l\'API Google+ API');
  console.log('4. Créez des identifiants OAuth 2.0');
  console.log('5. Ajoutez les URIs de redirection:');
  console.log('   - http://localhost:3000/api/auth/callback/google');
  console.log('6. Copiez Client ID et Client Secret dans .env.local');
  
  console.log('\n📘 Facebook OAuth:');
  console.log('1. Allez sur https://developers.facebook.com/');
  console.log('2. Créez une application');
  console.log('3. Ajoutez Facebook Login');
  console.log('4. Configurez les URIs de redirection:');
  console.log('   - http://localhost:3000/api/auth/callback/facebook');
  console.log('5. Copiez App ID et App Secret dans .env.local');
}

// Nettoyer les cookies du navigateur (instructions)
function showCookieCleanup() {
  console.log('\n🧹 Pour nettoyer les sessions existantes:');
  console.log('1. Ouvrez les outils de développement (F12)');
  console.log('2. Allez dans Application/Storage > Cookies');
  console.log('3. Supprimez tous les cookies de votre domaine');
  console.log('4. Ou utilisez un mode navigation privée');
  console.log('5. Redémarrez votre serveur de développement');
}

function main() {
  console.log('🚀 Configuration OAuth pour CertifDiag');
  console.log('=====================================\n');
  
  setupEnvironment();
  showOAuthInstructions();
  showCookieCleanup();
  
  console.log('\n✅ Configuration terminée !');
}

if (require.main === module) {
  main();
}

module.exports = { setupEnvironment, generateSecret };
