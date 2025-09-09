"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import MediaUpload from "@/components/MediaUpload";

type Choice = { 
  text: string; 
  isCorrect: boolean; 
  explanation?: string;
  media?: { type: "image" | "video"; url: string; filename: string };
};

type Question = { 
  text: string; 
  explanation?: string; 
  media?: { type: "image" | "video"; url: string; filename: string };
  choices: Choice[] 
};

interface RawChoice {
  text: string;
  isCorrect: boolean;
  explanation?: string;
  media?: { type: "image" | "video"; url: string; filename: string };
}

interface RawQuestion {
  text: string;
  explanation?: string;
  media?: { type: "image" | "video"; url: string; filename: string };
  choices?: RawChoice[];
}

export default function EditQuizPage() {
  const { id } = useParams<{ id: string }>();
  const { data: session, status } = useSession();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isPublished, setIsPublished] = useState(false);
  const [themeSlug, setThemeSlug] = useState("");
  const [difficulty, setDifficulty] = useState<
    "debutant" | "intermediaire" | "expert"
  >("debutant");
  const [themes, setThemes] = useState<
    Array<{ id: string; name: string; slug: string }>
  >([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "loading") return;
    if (!session?.user || session.user.role !== "admin") {
      router.replace("/connexion");
      return;
    }
    (async () => {
      try {
        const [themesRes, quizRes] = await Promise.all([
          fetch("/api/themes"),
          fetch(`/api/admin/quizzes/${id}`),
        ]);
        const themesData = await themesRes.json();
        if (themesRes.ok) setThemes(themesData.themes || []);
        const quizData = await quizRes.json();
        if (!quizRes.ok) throw new Error(quizData?.error || "Erreur");
        const q = quizData.quiz;
        setTitle(q.title || "");
        setDescription(q.description || "");
        setIsPublished(!!q.isPublished);
        setThemeSlug(q.themeSlug || "");
        setDifficulty(q.difficulty || "debutant");
        setQuestions(
          (q.questions || []).map((qq: RawQuestion) => ({
            text: qq.text,
            explanation: qq.explanation,
            media: qq.media,
            choices: (qq.choices || []).map((c: RawChoice) => ({
              text: c.text,
              isCorrect: !!c.isCorrect,
              explanation: c.explanation,
              media: c.media,
            })),
          }))
        );
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Erreur");
      } finally {
        setLoading(false);
      }
    })();
  }, [status, session, router, id]);

  function addQuestion() {
    setQuestions((prev) => [
      ...prev,
      {
        text: "",
        choices: [
          { text: "", isCorrect: true },
          { text: "", isCorrect: false },
        ],
      },
    ]);
  }
  
  function addChoice(qIndex: number) {
    setQuestions((prev) =>
      prev.map((q, i) =>
        i !== qIndex
          ? q
          : {
              ...q,
              choices: [...q.choices, { text: "", isCorrect: false }],
            }
      )
    );
  }

  function updateChoiceText(questionIndex: number, choiceIndex: number, text: string) {
    setQuestions((prev) =>
      prev.map((question, i) =>
        i !== questionIndex
          ? question
          : {
              ...question,
              choices: question.choices.map((choice, j) => (j !== choiceIndex ? choice : { ...choice, text })),
            }
      )
    );
  }

  function updateChoiceCorrect(questionIndex: number, choiceIndex: number, isCorrect: boolean) {
    setQuestions((prev) =>
      prev.map((question, i) =>
        i !== questionIndex
          ? question
          : {
              ...question,
              choices: question.choices.map((choice, j) => (j !== choiceIndex ? choice : { ...choice, isCorrect })),
            }
      )
    );
  }

  function updateQuestionExplanation(questionIndex: number, explanation: string) {
    setQuestions((prev) =>
      prev.map((question, i) =>
        i !== questionIndex ? question : { ...question, explanation }
      )
    );
  }

  function updateQuestionMedia(questionIndex: number, media: { type: "image" | "video"; url: string; filename: string } | null) {
    setQuestions((prev) =>
      prev.map((question, i) =>
        i !== questionIndex ? question : { ...question, media: media || undefined }
      )
    );
  }

  function updateChoiceExplanation(questionIndex: number, choiceIndex: number, explanation: string) {
    setQuestions((prev) =>
      prev.map((question, i) =>
        i !== questionIndex
          ? question
          : {
              ...question,
              choices: question.choices.map((choice, j) => (j !== choiceIndex ? choice : { ...choice, explanation })),
            }
      )
    );
  }

  function updateChoiceMedia(questionIndex: number, choiceIndex: number, media: { type: "image" | "video"; url: string; filename: string } | null) {
    setQuestions((prev) =>
      prev.map((question, i) =>
        i !== questionIndex
          ? question
          : {
              ...question,
              choices: question.choices.map((choice, j) => (j !== choiceIndex ? choice : { ...choice, media: media || undefined })),
            }
      )
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/quizzes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          isPublished,
          themeSlug: themeSlug || undefined,
          difficulty,
          questions,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Erreur");
      router.replace("/admin/quizzes");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p>Chargement...</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Éditer le quizz</h1>
      <form onSubmit={onSubmit} className="space-y-8">
        <div className="grid gap-4 rounded-xl border border-black/[.08] bg-white p-4">
          <label className="block">
            <div className="text-sm mb-1">Titre</div>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border rounded px-3 py-2"
              required
            />
          </label>
          <label className="block">
            <div className="text-sm mb-1">Description</div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border rounded px-3 py-2"
            />
          </label>
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
            />
            <span>Publier</span>
          </label>
          <label className="block">
            <div className="text-sm mb-1">Thématique</div>
            <select
              value={themeSlug}
              onChange={(e) => setThemeSlug(e.target.value)}
              className="w-full border rounded px-3 py-2"
            >
              <option value="">— Aucune —</option>
              {themes.map((t) => (
                <option key={t.id} value={t.slug}>
                  {t.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <div className="text-sm mb-1">Niveau</div>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as "debutant" | "intermediaire" | "expert")}
              className="w-full border rounded px-3 py-2"
            >
              <option value="debutant">Débutant</option>
              <option value="intermediaire">Intermédiaire</option>
              <option value="expert">Expert</option>
            </select>
          </label>
        </div>

        <div className="space-y-4 rounded-xl border border-black/[.08] bg-white p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Questions</h2>
            <button type="button" onClick={addQuestion} className="text-sm rounded-md bg-blue-600 text-white px-3 py-1 hover:bg-blue-700">Ajouter une question</button>
          </div>
          {questions.map((q, qi) => (
            <div key={qi} className="border rounded p-4 space-y-3">
              <label className="block">
                <div className="text-sm mb-1">Énoncé</div>
                <input
                  value={q.text}
                  onChange={(e) =>
                    setQuestions((prev) =>
                      prev.map((qq, i) =>
                        i !== qi ? qq : { ...qq, text: e.target.value }
                      )
                    )
                  }
                  className="w-full border rounded px-3 py-2"
                  required
                />
              </label>
              <label className="block">
                <div className="text-sm mb-1">Explication</div>
                <textarea
                  value={q.explanation}
                  onChange={(e) => updateQuestionExplanation(qi, e.target.value)}
                  className="w-full border rounded px-3 py-2"
                />
              </label>
                             <MediaUpload
                 currentMedia={q.media}
                 onMediaUpload={(media) => updateQuestionMedia(qi, media)}
                 label="Média pour la question (optionnel)"
               />
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-medium">Choix</div>
                  <button
                    type="button"
                    onClick={() => addChoice(qi)}
                    className="text-sm border rounded px-3 py-1"
                  >
                    Ajouter un choix
                  </button>
                </div>
                {q.choices.map((c, ci) => (
                  <div
                    key={ci}
                    className="grid grid-cols-[1fr_auto_auto] gap-2 items-center"
                  >
                    <input
                      value={c.text}
                      onChange={(e) => updateChoiceText(qi, ci, e.target.value)}
                      className="border rounded px-3 py-2"
                      required
                    />
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={c.isCorrect}
                        onChange={(e) => updateChoiceCorrect(qi, ci, e.target.checked)}
                      />
                      <span>Correct</span>
                    </label>
                                         <label className="block">
                       <div className="text-sm mb-1">Explication du choix (optionnel)</div>
                       <textarea 
                         value={c.explanation || ""} 
                         onChange={(e) => updateChoiceExplanation(qi, ci, e.target.value)} 
                         className="w-full border rounded px-3 py-2" 
                         placeholder={c.isCorrect ? "Expliquez pourquoi cette réponse est correcte..." : "Expliquez pourquoi cette réponse est incorrecte..."}
                       />
                     </label>

                     <MediaUpload
                       onMediaUpload={(media) => updateChoiceMedia(qi, ci, media)}
                       currentMedia={c.media}
                       label="Média pour ce choix (optionnel)"
                     />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {error && <p className="text-red-600">{error}</p>}
        <button type="submit" disabled={saving} className="inline-flex items-center rounded-lg bg-blue-600 text-white px-5 py-2 disabled:opacity-50 hover:bg-blue-700">{saving ? "Enregistrement..." : "Enregistrer"}</button>
      </form>
    </div>
  );
}
