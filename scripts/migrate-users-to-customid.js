const { MongoClient } = require('mongodb');
require('dotenv').config();

async function migrateUsersToCustomId() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connecté à MongoDB');
    
    const db = client.db();
    
    // Récupérer tous les utilisateurs
    const users = await db.collection('users').find({}).toArray();
    console.log(`📊 ${users.length} utilisateurs trouvés`);
    
    // Générer des customIds uniques
    const customIds = new Set();
    const usersToUpdate = [];
    
    for (const user of users) {
      let customId;
      let attempts = 0;
      
      // Générer un customId unique
      do {
        customId = generateCustomId();
        attempts++;
        
        if (attempts > 50) {
          // Si on n'arrive pas à générer un ID unique, ajouter un timestamp
          const timestamp = Date.now().toString().slice(-4);
          customId = `${generateCustomId()}${timestamp}`;
          break;
        }
      } while (customIds.has(customId));
      
      customIds.add(customId);
      
      // Générer une image de profil
      const profileImage = `https://avatar-placeholder.iran.liara.run/api/?name=${encodeURIComponent(customId)}&size=200&background=random&color=fff`;
      
      usersToUpdate.push({
        userId: user._id,
        customId,
        image: profileImage
      });
      
      console.log(`🆔 ${user.email} → ${customId}`);
    }
    
    // Mettre à jour les utilisateurs
    console.log('\n🔄 Mise à jour des utilisateurs...');
    
    for (const update of usersToUpdate) {
      await db.collection('users').updateOne(
        { _id: update.userId },
        { 
          $set: { 
            customId: update.customId,
            image: update.image
          }
        }
      );
    }
    
    console.log(`✅ ${usersToUpdate.length} utilisateurs mis à jour avec succès`);
    
    // Vérifier la migration
    console.log('\n🔍 Vérification de la migration...');
    const updatedUsers = await db.collection('users').find({}).toArray();
    
    const usersWithCustomId = updatedUsers.filter(u => u.customId);
    const usersWithImage = updatedUsers.filter(u => u.image);
    
    console.log(`📊 Utilisateurs avec customId: ${usersWithCustomId.length}/${updatedUsers.length}`);
    console.log(`📊 Utilisateurs avec image: ${usersWithImage.length}/${updatedUsers.length}`);
    
    // Afficher quelques exemples
    console.log('\n🎯 Exemples de customIds générés:');
    usersWithCustomId.slice(0, 5).forEach(user => {
      console.log(`  ${user.email} → ${user.customId}`);
    });
    
    console.log('\n✅ Migration terminée avec succès !');
    
  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
  } finally {
    await client.close();
    console.log('\n🔌 Déconnecté de MongoDB');
  }
}

// Fonction pour générer un customId (copiée de user-utils.ts)
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

// Exécuter la migration
migrateUsersToCustomId().catch(console.error);
