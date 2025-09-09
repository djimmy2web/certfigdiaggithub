"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface VocabularyWord {
  _id: string;
  word: string;
  correctDefinition: string;
  wrongDefinitions: string[];
  difficulty: "debutant" | "intermediaire" | "expert";
  category: "adjectifs" | "noms" | "verbes" | "adverbes" | "expressions" | "locutions";
  language: string;
  examples?: string[];
  synonyms?: string[];
  antonyms?: string[];
  etymology?: string;
  createdAt: string;
  updatedAt: string;
}

interface NewWordForm {
  word: string;
  correctDefinition: string;
  wrongDefinitions: string[];
  difficulty: "debutant" | "intermediaire" | "expert";
  category: "adjectifs" | "noms" | "verbes" | "adverbes" | "expressions" | "locutions";
  language: string;
  examples: string[];
  synonyms: string[];
  antonyms: string[];
  etymology: string;
}

export default function AdminVocabularyPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [words, setWords] = useState<VocabularyWord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState<"all" | "debutant" | "intermediaire" | "expert">("all");
  const [categoryFilter, setCategoryFilter] = useState<"all" | "adjectifs" | "noms" | "verbes" | "adverbes" | "expressions" | "locutions">("all");
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState<NewWordForm>({
    word: "",
    correctDefinition: "",
    wrongDefinitions: ["", ""],
    difficulty: "intermediaire",
    category: "noms",
    language: "fr",
    examples: [""],
    synonyms: [""],
    antonyms: [""],
    etymology: ""
  });

  useEffect(() => {
    if (status === "loading") return;
    if (!session?.user || session.user.role !== "admin") {
      router.replace("/connexion");
      return;
    }

    fetchVocabularyWords();
  }, [status, session, router]);

  const fetchVocabularyWords = async () => {
    try {
      const response = await fetch("/api/vocabulary");
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Erreur lors du chargement");
      }
      
      setWords(data.words || []);
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Erreur");
    } finally {
      setLoading(false);
    }
  };

  const handleAddWord = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Valider les données
      if (!formData.word.trim() || !formData.correctDefinition.trim()) {
        alert("Le mot et la définition correcte sont obligatoires");
        return;
      }

      if (formData.wrongDefinitions.filter(d => d.trim()).length < 2) {
        alert("Il faut au moins 2 mauvaises définitions");
        return;
      }

      const response = await fetch("/api/vocabulary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          wrongDefinitions: formData.wrongDefinitions.filter(d => d.trim()),
          examples: formData.examples.filter(e => e.trim()),
          synonyms: formData.synonyms.filter(s => s.trim()),
          antonyms: formData.antonyms.filter(a => a.trim())
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de l'ajout");
      }

      // Réinitialiser le formulaire et fermer
      setFormData({
        word: "",
        correctDefinition: "",
        wrongDefinitions: ["", ""],
        difficulty: "intermediaire",
        category: "noms",
        language: "fr",
        examples: [""],
        synonyms: [""],
        antonyms: [""],
        etymology: ""
      });
      setShowAddForm(false);
      
      // Recharger la liste
      fetchVocabularyWords();
      
      alert("Mot ajouté avec succès !");
    } catch (error: unknown) {
      alert("Erreur: " + (error instanceof Error ? error.message : "Erreur inconnue"));
    }
  };

  const handleDeleteWord = async (wordId: string, wordText: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer le mot "${wordText}" ?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/vocabulary/${wordId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la suppression");
      }

      setWords(prev => prev.filter(word => word._id !== wordId));
      alert("Mot supprimé avec succès !");
    } catch (error: unknown) {
      alert("Erreur: " + (error instanceof Error ? error.message : "Erreur inconnue"));
    }
  };

  const addWrongDefinition = () => {
    if (formData.wrongDefinitions.length < 4) {
      setFormData(prev => ({
        ...prev,
        wrongDefinitions: [...prev.wrongDefinitions, ""]
      }));
    }
  };

  const removeWrongDefinition = (index: number) => {
    if (formData.wrongDefinitions.length > 2) {
      setFormData(prev => ({
        ...prev,
        wrongDefinitions: prev.wrongDefinitions.filter((_, i) => i !== index)
      }));
    }
  };

  const addArrayField = (field: 'examples' | 'synonyms' | 'antonyms') => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], ""]
    }));
  };

  const removeArrayField = (field: 'examples' | 'synonyms' | 'antonyms', index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const updateArrayField = (field: 'examples' | 'synonyms' | 'antonyms', index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item)
    }));
  };

  // Filtrer les mots
  const filteredWords = words.filter(word => {
    const matchesSearch = word.word.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         word.correctDefinition.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDifficulty = difficultyFilter === "all" || word.difficulty === difficultyFilter;
    const matchesCategory = categoryFilter === "all" || word.category === categoryFilter;
    return matchesSearch && matchesDifficulty && matchesCategory;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Erreur</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* En-tête */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Gestion du Vocabulaire
          </h1>
          <p className="text-gray-600">
            Ajoutez et gérez les mots de vocabulaire pour les QCM
          </p>
        </div>

        {/* Bouton d'ajout */}
        <div className="mb-6">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
          >
            {showAddForm ? "Annuler" : "Ajouter un mot"}
          </button>
        </div>

        {/* Formulaire d'ajout */}
        {showAddForm && (
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Ajouter un nouveau mot</h2>
            
            <form onSubmit={handleAddWord} className="space-y-6">
              {/* Informations de base */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mot *
                  </label>
                  <input
                    type="text"
                    value={formData.word}
                    onChange={(e) => setFormData(prev => ({ ...prev, word: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Catégorie *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as "adjectifs" | "noms" | "verbes" | "adverbes" | "expressions" | "locutions" }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="noms">Noms</option>
                    <option value="adjectifs">Adjectifs</option>
                    <option value="verbes">Verbes</option>
                    <option value="adverbes">Adverbes</option>
                    <option value="expressions">Expressions</option>
                    <option value="locutions">Locutions</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Difficulté *
                  </label>
                  <select
                    value={formData.difficulty}
                    onChange={(e) => setFormData(prev => ({ ...prev, difficulty: e.target.value as "debutant" | "intermediaire" | "expert" }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="debutant">Débutant</option>
                    <option value="intermediaire">Intermédiaire</option>
                    <option value="expert">Expert</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Langue
                  </label>
                  <input
                    type="text"
                    value={formData.language}
                    onChange={(e) => setFormData(prev => ({ ...prev, language: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="fr"
                  />
                </div>
              </div>

              {/* Définition correcte */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Définition correcte *
                </label>
                <textarea
                  value={formData.correctDefinition}
                  onChange={(e) => setFormData(prev => ({ ...prev, correctDefinition: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  required
                />
              </div>

              {/* Mauvaises définitions */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mauvaises définitions * (2-4)
                </label>
                {formData.wrongDefinitions.map((definition, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={definition}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        wrongDefinitions: prev.wrongDefinitions.map((d, i) => i === index ? e.target.value : d)
                      }))}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder={`Mauvaise définition ${index + 1}`}
                    />
                    {formData.wrongDefinitions.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeWrongDefinition(index)}
                        className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                      >
                        Supprimer
                      </button>
                    )}
                  </div>
                ))}
                {formData.wrongDefinitions.length < 4 && (
                  <button
                    type="button"
                    onClick={addWrongDefinition}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Ajouter une mauvaise définition
                  </button>
                )}
              </div>

              {/* Exemples */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Exemples
                </label>
                {formData.examples.map((example, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={example}
                      onChange={(e) => updateArrayField('examples', index, e.target.value)}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder={`Exemple ${index + 1}`}
                    />
                    <button
                      type="button"
                      onClick={() => removeArrayField('examples', index)}
                      className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                      Supprimer
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addArrayField('examples')}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Ajouter un exemple
                </button>
              </div>

              {/* Synonymes et antonymes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Synonymes
                  </label>
                  {formData.synonyms.map((synonym, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={synonym}
                        onChange={(e) => updateArrayField('synonyms', index, e.target.value)}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder={`Synonyme ${index + 1}`}
                      />
                      <button
                        type="button"
                        onClick={() => removeArrayField('synonyms', index)}
                        className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                      >
                        Supprimer
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addArrayField('synonyms')}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Ajouter un synonyme
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Antonymes
                  </label>
                  {formData.antonyms.map((antonym, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={antonym}
                        onChange={(e) => updateArrayField('antonyms', index, e.target.value)}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder={`Antonyme ${index + 1}`}
                      />
                      <button
                        type="button"
                        onClick={() => removeArrayField('antonyms', index)}
                        className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                      >
                        Supprimer
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addArrayField('antonyms')}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Ajouter un antonyme
                  </button>
                </div>
              </div>

              {/* Étymologie */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Étymologie
                </label>
                <textarea
                  value={formData.etymology}
                  onChange={(e) => setFormData(prev => ({ ...prev, etymology: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={2}
                  placeholder="Origine du mot..."
                />
              </div>

              {/* Boutons */}
              <div className="flex gap-4">
                <button
                  type="submit"
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                >
                  Ajouter le mot
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-semibold"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Filtres */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Recherche</label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Rechercher un mot..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Difficulté</label>
              <select
                value={difficultyFilter}
                onChange={(e) => setDifficultyFilter(e.target.value as "all" | "debutant" | "intermediaire" | "expert")}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Toutes</option>
                <option value="debutant">Débutant</option>
                <option value="intermediaire">Intermédiaire</option>
                <option value="expert">Expert</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Catégorie</label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value as "all" | "adjectifs" | "noms" | "verbes" | "adverbes" | "expressions" | "locutions")}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Toutes</option>
                <option value="noms">Noms</option>
                <option value="adjectifs">Adjectifs</option>
                <option value="verbes">Verbes</option>
                <option value="adverbes">Adverbes</option>
                <option value="expressions">Expressions</option>
                <option value="locutions">Locutions</option>
              </select>
            </div>
            
            <div className="flex items-end">
              <span className="text-sm text-gray-600">
                {filteredWords.length} mot{filteredWords.length > 1 ? 's' : ''} trouvé{filteredWords.length > 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>

        {/* Liste des mots */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mot
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Définition
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Catégorie
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Difficulté
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredWords.map((word) => (
                  <tr key={word._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{word.word}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate">
                        {word.correctDefinition}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                        {word.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        word.difficulty === 'debutant' ? 'bg-green-100 text-green-800' :
                        word.difficulty === 'intermediaire' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {word.difficulty}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleDeleteWord(word._id, word.word)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Supprimer
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
