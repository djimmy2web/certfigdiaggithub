"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Image from "next/image";

type Choice = { 
  text: string; 
  explanation?: string;
  media?: { type: "image" | "video"; url: string; filename: string };
  isCorrect?: boolean;
};

type Question = { 
  text: string; 
  explanation?: string;
  media?: { type: "image" | "video"; url: string; filename: string };
  choices: Choice[] 
};

type AttemptAnswer = {
  questionIndex: number;
  choiceIndex: number;
  isCorrect: boolean;
};

export default function QuizResultPage() {
  const { id } = useParams<{ id: string }>();
  const { data: session } = useSession();
  const router = useRouter();
  const [quiz, setQuiz] = useState<{ title: string; questions: Question[] } | null>(null);
  const [attempt, setAttempt] = useState<{ score: number; total: number; answers: AttemptAnswer[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session?.user) {
      router.push("/connexion");
      return;
    }

    (async () => {
      try {
        const [quizRes, attemptRes] = await Promise.all([
          fetch(`/api/quizzes?id=${id}`),
          fetch(`/api/quizzes/${id}/attempts/latest`)
        ]);

        const quizData = await quizRes.json();
        if (!quizRes.ok) throw new Error(quizData?.error || "Erreur");
        
        const found = (quizData.quizzes || []).find((q: { id: string }) => q.id === id) || null;
        if (!found) throw new Error("Quiz introuvable");
        
        setQuiz({ title: found.title, questions: found.questions || [] });

        const attemptData = await attemptRes.json();
        if (attemptRes.ok) {
          setAttempt(attemptData);
        }
      } catch (e: unknown) {
        setError((e as Error).message || "Erreur");
      } finally {
        setLoading(false);
      }
    })();
  }, [id, session, router]);

  if (loading) return <p>Chargement...</p>;
  if (error) return <p className="text-red-600">{error}</p>;
  if (!quiz) return <p>Quiz introuvable</p>;

  return (
    <div className="space-y-6">
      <div className="border rounded p-4 bg-blue-50">
        <h1 className="text-2xl font-semibold mb-2">{quiz.title}</h1>
        {attempt && (
          <p className="text-lg">
            Score: <span className="font-bold">{attempt.score}</span> / <span className="font-bold">{attempt.total}</span>
            <span className="ml-2 text-sm text-gray-600">
              ({Math.round((attempt.score / attempt.total) * 100)}%)
            </span>
          </p>
        )}
      </div>

      <div className="space-y-6">
        {quiz.questions.map((q, qi) => {
          const userAnswer = attempt?.answers.find(a => a.questionIndex === qi);
          // const correctChoice = q.choices.findIndex(c => c.isCorrect);
          
          return (
            <div key={qi} className="border rounded p-4 space-y-4">
              <div className="space-y-3">
                <div className="font-medium">{qi + 1}. {q.text}</div>
                
                {q.media && (
                  <div className="border rounded p-3 bg-gray-50">
                    {q.media.type === "image" ? (
                      <Image
                        src={q.media.url}
                        alt="Média de la question"
                        width={400}
                        height={256}
                        className="max-w-full h-auto max-h-64 object-contain rounded"
                      />
                    ) : (
                      <video
                        src={q.media.url}
                        controls
                        className="max-w-full h-auto max-h-64 rounded"
                      >
                        Votre navigateur ne supporte pas la lecture de vidéos.
                      </video>
                    )}
                  </div>
                )}

                {q.explanation && (
                  <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded">
                    <strong>Contexte :</strong> {q.explanation}
                  </div>
                )}
              </div>

              <div className="space-y-3">
                {q.choices.map((c, ci) => {
                  const isUserAnswer = userAnswer?.choiceIndex === ci;
                  const isCorrect = c.isCorrect;
                  const isWrongAnswer = isUserAnswer && !isCorrect;
                  
                  let bgColor = "bg-white";
                  let borderColor = "border-gray-200";
                  
                  if (isCorrect) {
                    bgColor = "bg-green-50";
                    borderColor = "border-green-300";
                  } else if (isWrongAnswer) {
                    bgColor = "bg-red-50";
                    borderColor = "border-red-300";
                  }

                  return (
                    <div key={ci} className={`p-3 border rounded ${bgColor} ${borderColor}`}>
                      <div className="flex items-start gap-3">
                        <div className="flex items-center gap-2 mt-1">
                          {isCorrect && (
                            <span className="text-green-600 text-lg">✓</span>
                          )}
                          {isWrongAnswer && (
                            <span className="text-red-600 text-lg">✗</span>
                          )}
                          {isUserAnswer && (
                            <span className="text-sm font-medium">
                              {isCorrect ? "Votre réponse (correcte)" : "Votre réponse"}
                            </span>
                          )}
                          {isCorrect && !isUserAnswer && (
                            <span className="text-sm font-medium text-green-600">Réponse correcte</span>
                          )}
                        </div>
                        <div className="flex-1 space-y-2">
                          <span className="block">{c.text}</span>
                          
                          {c.media && (
                            <div className="border rounded p-2 bg-white">
                              {c.media.type === "image" ? (
                                <Image
                                  src={c.media.url}
                                  alt="Média du choix"
                                  width={200}
                                  height={128}
                                  className="max-w-full h-auto max-h-32 object-contain rounded"
                                />
                              ) : (
                                <video
                                  src={c.media.url}
                                  controls
                                  className="max-w-full h-auto max-h-32 rounded"
                                >
                                  Votre navigateur ne supporte pas la lecture de vidéos.
                                </video>
                              )}
                            </div>
                          )}

                          {c.explanation && (
                            <div className="text-sm text-gray-700 bg-white p-2 rounded border">
                              <strong>Explication :</strong> {c.explanation}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex gap-4">
        <button 
          onClick={() => router.push(`/reviser/${id}`)} 
          className="bg-blue-600 text-white rounded px-4 py-2 hover:bg-blue-700"
        >
          Recommencer le quiz
        </button>
        <button 
          onClick={() => router.push("/reviser")} 
          className="bg-gray-600 text-white rounded px-4 py-2 hover:bg-gray-700"
        >
          Retour aux quiz
        </button>
      </div>
    </div>
  );
}
