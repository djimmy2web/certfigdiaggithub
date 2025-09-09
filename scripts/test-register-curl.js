// Script de test simple pour l'API d'inscription
// Utilise fetch qui est disponible dans Node.js 18+

async function testRegisterAPI() {
  try {
    console.log('🧪 Test de l\'API d\'inscription...');
    
    const testData = {
      email: 'test@example.com',
      password: 'password123', // 11 caractères - valide
      name: 'Test User'
    };
    
    console.log('📤 Données envoyées:', testData);
    
    const response = await fetch('http://localhost:3001/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
    });
    
    console.log('📥 Statut de la réponse:', response.status);
    
    const data = await response.text();
    console.log('📥 Corps de la réponse:', data);
    
    if (response.ok) {
      console.log('✅ Inscription réussie !');
    } else {
      console.log('❌ Erreur lors de l\'inscription');
    }
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
  }
}

// Exécuter le test
testRegisterAPI().catch(console.error);
