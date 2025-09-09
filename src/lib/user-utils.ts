// Liste d'adjectifs pour générer des identifiants créatifs
const adjectives = [
  'tomate', 'bleu', 'vert', 'rouge', 'jaune', 'orange', 'violet', 'rose', 'blanc', 'noir',
  'grand', 'petit', 'rapide', 'lent', 'fort', 'faible', 'intelligent', 'sage', 'fou', 'calme',
  'energique', 'tranquille', 'creatif', 'logique', 'artistique', 'scientifique', 'sportif', 'musical',
  'naturel', 'urbain', 'rural', 'cosmique', 'terrestre', 'aquatique', 'aérien', 'souterrain',
  'brillant', 'sombre', 'lumineux', 'mystérieux', 'transparent', 'opaque', 'lisse', 'rugueux',
  'chaud', 'froid', 'doux', 'dur', 'flexible', 'rigide', 'actif', 'passif'
];

// Liste de noms pour générer des identifiants créatifs
const nouns = [
  'chat', 'chien', 'oiseau', 'poisson', 'lion', 'tigre', 'ours', 'loup', 'renard', 'lapin',
  'arbre', 'fleur', 'herbe', 'montagne', 'rivière', 'océan', 'forêt', 'désert', 'plage', 'ciel',
  'étoile', 'lune', 'soleil', 'nuage', 'pluie', 'neige', 'vent', 'tempête', 'arc', 'tonnerre',
  'pierre', 'cristal', 'diamant', 'or', 'argent', 'bronze', 'fer', 'cuivre', 'zinc', 'platine',
  'livre', 'crayon', 'papier', 'tableau', 'sculpture', 'peinture', 'musique', 'danse', 'théâtre', 'cinéma',
  'voiture', 'train', 'avion', 'bateau', 'vélo', 'moto', 'bus', 'métro', 'tram', 'téléphérique'
];

// Liste de nombres pour ajouter à la fin
const numbers = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

/**
 * Génère un identifiant aléatoire unique du type "tomaterouge21"
 */
export function generateCustomId(): string {
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

/**
 * Génère une image de profil avec un service d'avatar fiable
 */
export function generateProfileImage(customId: string, size: number = 200): string {
  // Utiliser l'API DiceBear qui est plus fiable et stable
  // Utiliser le style "avataaars" qui génère des avatars colorés
  const seed = encodeURIComponent(customId);
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}&size=${size}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;
}

/**
 * Génère une image de profil de fallback si le service principal ne fonctionne pas
 */
export function generateFallbackProfileImage(customId: string, size: number = 200): string {
  // Service de fallback avec UI Avatars
  const name = encodeURIComponent(customId);
  return `https://ui-avatars.com/api/?name=${name}&size=${size}&background=random&color=fff&bold=true`;
}

/**
 * Vérifie si un customId est valide (lettres, chiffres, longueur appropriée)
 */
export function isValidCustomId(customId: string): boolean {
  // Doit contenir au moins 3 caractères, max 20, uniquement lettres et chiffres
  const regex = /^[a-zA-Z0-9]{3,20}$/;
  return regex.test(customId);
}

/**
 * Génère un identifiant unique en vérifiant qu'il n'existe pas déjà
 */
export async function generateUniqueCustomId(existingIds: string[]): Promise<string> {
  let attempts = 0;
  const maxAttempts = 50;
  
  while (attempts < maxAttempts) {
    const customId = generateCustomId();
    
    if (!existingIds.includes(customId)) {
      return customId;
    }
    
    attempts++;
  }
  
  // Si on n'arrive pas à générer un ID unique, ajouter un timestamp
  const timestamp = Date.now().toString().slice(-4);
  return `${generateCustomId()}${timestamp}`;
}
