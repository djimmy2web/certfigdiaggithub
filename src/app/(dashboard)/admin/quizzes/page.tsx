"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface Choice {
  media?: unknown;
  explanation?: string;
}

interface Question {
  media?: unknown;
  explanation?: string;
  choices?: Choice[];
}

interface RawQuiz {
  _id: string;
  title: string;
  description?: string;
  isPublished: boolean;
  difficulty?: "debutant" | "intermediaire" | "expert";
  questions?: Question[];
  createdAt: string;
  updatedAt: string;
}

type QuizItem = {
  id: string;
  title: string;
  description?: string;
  isPublished: boolean;
  difficulty: "debutant" | "intermediaire" | "expert";
  questionsCount: number;
  hasMedia: boolean;
  hasExplanations: boolean;
  createdAt: string;
  updatedAt: string;
};

export default function AdminQuizzesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [items, setItems] = useState<QuizItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "loading") return;
    if (!session?.user || session.user.role !== "admin") {
      router.replace("/connexion");
      return;
    }
    (async () => {
      try {
        const res = await fetch("/api/admin/quizzes");
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Erreur");
        
        const quizzes = (data.quizzes || []).map((q: RawQuiz) => {
          const questions = q.questions || [];
          const hasMedia = questions.some((question: Question) => 
            question.media || question.choices?.some((choice: Choice) => choice.media)
          );
          const hasExplanations = questions.some((question: Question) => 
            question.explanation || question.choices?.some((choice: Choice) => choice.explanation)
          );
          
          return {
            id: q._id,
            title: q.title,
            description: q.description,
            isPublished: q.isPublished,
            difficulty: q.difficulty || "debutant",
            questionsCount: questions.length,
            hasMedia,
            hasExplanations,
            createdAt: q.createdAt,
            updatedAt: q.updatedAt,
          };
        });
        
        setItems(quizzes);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Erreur");
      } finally {
        setLoading(false);
      }
    })();
  }, [status, session, router]);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "debutant": return "bg-green-100 text-green-800";
      case "intermediaire": return "bg-yellow-100 text-yellow-800";
      case "expert": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case "debutant": return "Débutant";
      case "intermediaire": return "Intermédiaire";
      case "expert": return "Expert";
      default: return difficulty;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Gestion des Quiz</h1>
        <div className="flex gap-2">
          <a
            href="/admin/quizzes/import"
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            📥 Import CSV
          </a>
          <a href="/admin/quizzes/new" className="inline-flex items-center rounded-lg bg-blue-600 text-white px-4 py-2 text-sm shadow hover:bg-blue-700">
            Nouveau quiz
          </a>
        </div>
      </div>

      {/* Statistiques */}
      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white border rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-600">{items.length}</div>
            <div className="text-sm text-gray-600">Total quiz</div>
          </div>
          <div className="bg-white border rounded-lg p-4">
            <div className="text-2xl font-bold text-green-600">
              {items.filter(q => q.isPublished).length}
            </div>
            <div className="text-sm text-gray-600">Quiz publiés</div>
          </div>
          <div className="bg-white border rounded-lg p-4">
            <div className="text-2xl font-bold text-purple-600">
              {items.filter(q => q.hasMedia).length}
            </div>
            <div className="text-sm text-gray-600">Avec médias</div>
          </div>
          <div className="bg-white border rounded-lg p-4">
            <div className="text-2xl font-bold text-orange-600">
              {items.filter(q => q.hasExplanations).length}
            </div>
            <div className="text-sm text-gray-600">Avec explications</div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-8">
          <p className="text-gray-600">Chargement...</p>
        </div>
      ) : error ? (
        <div className="text-center py-8">
          <p className="text-red-600">{error}</p>
        </div>
      ) : (
        <div className="bg-white border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quiz
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Niveau
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Questions
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fonctionnalités
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dernière modif.
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {items.map((quiz) => (
                  <tr key={quiz.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900">{quiz.title}</div>
                        {quiz.description && (
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {quiz.description}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        quiz.isPublished 
                          ? "bg-green-100 text-green-800" 
                          : "bg-gray-100 text-gray-800"
                      }`}>
                        {quiz.isPublished ? "Publié" : "Brouillon"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getDifficultyColor(quiz.difficulty)}`}>
                        {getDifficultyLabel(quiz.difficulty)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {quiz.questionsCount} question{quiz.questionsCount > 1 ? 's' : ''}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        {quiz.hasMedia && (
                          <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                            📷 Médias
                          </span>
                        )}
                        {quiz.hasExplanations && (
                          <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full">
                            💡 Explications
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatDate(quiz.updatedAt)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <a 
                          href={`/admin/quizzes/${quiz.id}/edit`}
                          className="text-sm text-blue-600 hover:text-blue-900 font-medium"
                        >
                          Éditer
                        </a>
                        <a 
                          href={`/reviser/${quiz.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-gray-600 hover:text-gray-900"
                        >
                          Prévisualiser
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}


