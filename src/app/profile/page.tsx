"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

interface UserProfile {
  email: string;
  name?: string;
  customId: string;
  image: string;
  points: number;
  role: string;
  createdAt: string;
}

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Form state
  const [customId, setCustomId] = useState("");
  const [name, setName] = useState("");

  useEffect(() => {
    if (status === "loading") return;
    
    if (status === "unauthenticated") {
      router.push("/connexion");
      return;
    }

    if (session?.user) {
      fetchProfile();
    }
  }, [session, status, router]);

  const fetchProfile = async () => {
    try {
      const response = await fetch("/api/me/profile");
      const data = await response.json();
      
      if (response.ok) {
        setProfile(data.user);
        setCustomId(data.user.customId);
        setName(data.user.name || "");
      } else {
        setError(data.error || "Erreur lors du chargement du profil");
      }
    } catch {
      setError("Erreur lors du chargement du profil");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/me/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customId: customId.trim(),
          name: name.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(data.message);
        setProfile(data.user);
        // L'image de profil sera automatiquement mise à jour
        setTimeout(() => {
          window.location.reload(); // Recharger pour voir la nouvelle image
        }, 1000);
      } else {
        setError(data.error || "Erreur lors de la mise à jour");
      }
    } catch {
      setError("Erreur lors de la mise à jour du profil");
    } finally {
      setUpdating(false);
    }
  };

  const generateNewCustomId = () => {
    // Générer un ID temporaire pour la démo (en production, on utiliserait l'API)
    const adjectives = ['tomate', 'bleu', 'vert', 'rouge', 'jaune', 'orange', 'violet', 'rose'];
    const nouns = ['chat', 'chien', 'oiseau', 'poisson', 'lion', 'tigre', 'ours', 'loup'];
    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    const num = Math.floor(Math.random() * 100);
    setCustomId(`${adj}${noun}${num}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (!profile) {
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* En-tête */}
        <div className="text-center mb-12">
          <div className="text-6xl mb-4">👤</div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Mon Profil
          </h1>
          <p className="text-xl text-gray-600">
            Gérez votre identifiant et vos informations personnelles
          </p>
          <Link 
            href="/"
            className="inline-flex items-center mt-6 text-purple-600 hover:text-purple-700 font-medium"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Retour à l&apos;accueil
          </Link>
        </div>

        {/* Messages d'erreur et de succès */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <div className="text-red-400">❌</div>
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex">
              <div className="text-green-400">✅</div>
              <div className="ml-3">
                <p className="text-sm text-green-800">{success}</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Informations actuelles */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Informations actuelles</h2>
            
            {/* Image de profil */}
            <div className="text-center mb-6">
              <div className="inline-block relative">
                <Image
                  src={profile.image}
                  alt="Image de profil"
                  width={128}
                  height={128}
                  className="w-32 h-32 rounded-full border-4 border-purple-200 shadow-lg"
                />
                <div className="absolute -bottom-2 -right-2 bg-purple-500 text-white text-xs px-2 py-1 rounded-full">
                  {profile.role}
                </div>
              </div>
            </div>

            {/* Détails du profil */}
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="font-medium text-gray-600">Email:</span>
                <span className="text-gray-900">{profile.email}</span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="font-medium text-gray-600">Nom:</span>
                <span className="text-gray-900">{profile.name || "Non renseigné"}</span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="font-medium text-gray-600">Identifiant:</span>
                <span className="text-gray-900 font-mono bg-gray-100 px-2 py-1 rounded">
                  {profile.customId}
                </span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="font-medium text-gray-600">Points:</span>
                <span className="font-bold text-purple-600">{profile.points}</span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="font-medium text-gray-600">Membre depuis:</span>
                <span className="text-gray-900">
                  {new Date(profile.createdAt).toLocaleDateString('fr-FR')}
                </span>
              </div>
            </div>
          </div>

          {/* Formulaire de modification */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Modifier mon profil</h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Nom */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Nom complet
                </label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Votre nom complet"
                />
              </div>

              {/* CustomId */}
              <div>
                <label htmlFor="customId" className="block text-sm font-medium text-gray-700 mb-2">
                  Identifiant personnalisé
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    id="customId"
                    value={customId}
                    onChange={(e) => setCustomId(e.target.value)}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono"
                    placeholder="ex: tomaterouge21"
                    maxLength={20}
                  />
                  <button
                    type="button"
                    onClick={generateNewCustomId}
                    className="px-4 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    🎲
                  </button>
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  3-20 caractères, uniquement lettres et chiffres
                </p>
              </div>

              {/* Bouton de soumission */}
              <button
                type="submit"
                disabled={updating}
                className="w-full bg-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {updating ? "Mise à jour..." : "Mettre à jour le profil"}
              </button>
            </form>

            {/* Aperçu de la nouvelle image */}
            {customId !== profile.customId && (
              <div className="mt-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
                <h3 className="text-sm font-medium text-purple-800 mb-2">
                  Aperçu de votre nouvelle image de profil
                </h3>
                <div className="text-center">
                  <Image
                    src={`https://avatar-placeholder.iran.liara.run/api/?name=${encodeURIComponent(customId)}&size=80&background=random&color=fff`}
                    alt="Aperçu"
                    width={80}
                    height={80}
                    className="w-20 h-20 rounded-full mx-auto"
                  />
                  <p className="text-xs text-purple-600 mt-2">
                    L&apos;image sera générée automatiquement
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
