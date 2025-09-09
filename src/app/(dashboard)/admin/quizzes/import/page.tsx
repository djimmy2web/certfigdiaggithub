"use client";
import { useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface ImportSuccess {
  title: string;
  difficulty: string;
  questionsCount: number;
  isPublished: boolean;
  action: string;
  line: number;
}

interface ImportError {
  title: string;
  error: string;
  line: number;
}

type ImportResult = {
  success: boolean;
  results?: {
    success: ImportSuccess[];
    errors: ImportError[];
    summary: {
      total: number;
      imported: number;
      failed: number;
      skipped: number;
    };
  };
  error?: string;
  details?: unknown[];
};

type ParsedQuiz = {
  title: string;
  description: string;
  difficulty: string;
  isPublished: boolean;
  questions: Array<{
    text: string;
    explanation: string;
    choices: Array<{
      text: string;
      isCorrect: boolean;
      explanation: string;
    }>;
  }>;
};

export default function ImportQuizzesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [csvData, setCsvData] = useState<string>("");
  const [previewData, setPreviewData] = useState<ParsedQuiz[]>([]);
  const [overwrite, setOverwrite] = useState(false);
  const [loading, setLoading] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  // Vérifier l'authentification
  if (status === "loading") return <div>Chargement...</div>;
  if (!session?.user || session.user.role !== "admin") {
    router.replace("/connexion");
    return null;
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setCsvData(text);
      parseCSV(text);
    };
    reader.readAsText(file);
  };

  const parseCSV = (csvText: string) => {
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) {
      alert("Le fichier CSV doit contenir au moins une ligne d'en-tête et une ligne de données");
      return;
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const requiredHeaders = ['quiz_title', 'question_text', 'choice_text', 'is_correct'];
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));

    if (missingHeaders.length > 0) {
      alert(`En-têtes manquants: ${missingHeaders.join(', ')}`);
      return;
    }

    // Parser les données en structure de quiz
    const quizMap = new Map<string, ParsedQuiz>();

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      if (values.length >= 4) {
        const quizTitle = values[headers.indexOf('quiz_title')] || '';
        const questionText = values[headers.indexOf('question_text')] || '';
        const choiceText = values[headers.indexOf('choice_text')] || '';
        const isCorrect = values[headers.indexOf('is_correct')]?.toLowerCase() === 'true';
        const description = values[headers.indexOf('description')] || '';
        const difficulty = values[headers.indexOf('difficulty')] || 'debutant';
        const isPublished = values[headers.indexOf('is_published')]?.toLowerCase() === 'true';
        const questionExplanation = values[headers.indexOf('question_explanation')] || '';
        const choiceExplanation = values[headers.indexOf('choice_explanation')] || '';

        if (!quizMap.has(quizTitle)) {
          quizMap.set(quizTitle, {
            title: quizTitle,
            description,
            difficulty,
            isPublished,
            questions: [],
          });
        }

        const quiz = quizMap.get(quizTitle)!;
        
        // Trouver ou créer la question
        let question = quiz.questions.find(q => q.text === questionText);
        if (!question) {
          question = {
            text: questionText,
            explanation: questionExplanation,
            choices: [],
          };
          quiz.questions.push(question);
        }

        // Ajouter le choix
        question.choices.push({
          text: choiceText,
          isCorrect,
          explanation: choiceExplanation,
        });
      }
    }

    const quizzes = Array.from(quizMap.values());
    setPreviewData(quizzes.slice(0, 3)); // Afficher les 3 premiers quiz
  };

  const handleImport = async () => {
    if (!csvData) {
      alert("Veuillez d'abord sélectionner un fichier CSV");
      return;
    }

    setLoading(true);
    setImportResult(null);

    try {
      // Re-parser les données pour l'import
      const lines = csvData.trim().split('\n');
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      
      const quizMap = new Map<string, ParsedQuiz>();

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        if (values.length >= 4) {
          const quizTitle = values[headers.indexOf('quiz_title')] || '';
          const questionText = values[headers.indexOf('question_text')] || '';
          const choiceText = values[headers.indexOf('choice_text')] || '';
          const isCorrect = values[headers.indexOf('is_correct')]?.toLowerCase() === 'true';
          const description = values[headers.indexOf('description')] || '';
          const difficulty = values[headers.indexOf('difficulty')] || 'debutant';
          const isPublished = values[headers.indexOf('is_published')]?.toLowerCase() === 'true';
          const questionExplanation = values[headers.indexOf('question_explanation')] || '';
          const choiceExplanation = values[headers.indexOf('choice_explanation')] || '';

          if (!quizMap.has(quizTitle)) {
            quizMap.set(quizTitle, {
              title: quizTitle,
              description,
              difficulty,
              isPublished,
              questions: [],
            });
          }

          const quiz = quizMap.get(quizTitle)!;
          
          let question = quiz.questions.find(q => q.text === questionText);
          if (!question) {
            question = {
              text: questionText,
              explanation: questionExplanation,
              choices: [],
            };
            quiz.questions.push(question);
          }

          question.choices.push({
            text: choiceText,
            isCorrect,
            explanation: choiceExplanation,
          });
        }
      }

      const quizzes = Array.from(quizMap.values());

      const response = await fetch("/api/admin/quizzes/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quizzes,
          overwrite,
        }),
      });

      const result = await response.json();
      setImportResult(result);

    } catch (error: unknown) {
      setImportResult({
        success: false,
        error: error instanceof Error ? error.message : "Erreur lors de l'import",
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = () => {
    const template = `quiz_title,description,difficulty,is_published,question_text,question_explanation,choice_text,is_correct,choice_explanation
"Quiz sur les diagnostics","Quiz de base sur les diagnostics immobiliers",debutant,false,"Qu'est-ce qu'un diagnostic immobilier ?","Question fondamentale sur le diagnostic","Un rapport technique obligatoire",true,"C'est la définition correcte"
"Quiz sur les diagnostics","Quiz de base sur les diagnostics immobiliers",debutant,false,"Qu'est-ce qu'un diagnostic immobilier ?","Question fondamentale sur le diagnostic","Un document optionnel",false,"C'est incorrect, c'est obligatoire"
"Quiz sur les diagnostics","Quiz de base sur les diagnostics immobiliers",debutant,false,"Quel est le délai de validité du diagnostic amiante ?","Question sur la réglementation","3 ans",false,"C'est incorrect"
"Quiz sur les diagnostics","Quiz de base sur les diagnostics immobiliers",debutant,false,"Quel est le délai de validité du diagnostic amiante ?","Question sur la réglementation","Illimité",true,"C'est correct, pas de limite de temps"`;
    
    const blob = new Blob([template], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "template_import_quiz.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const downloadResults = () => {
    if (!importResult?.results) return;

    const { success, errors } = importResult.results;
    let csvContent = "title,difficulty,questions_count,is_published,action,status,error\n";
    
    success.forEach(quiz => {
      csvContent += `"${quiz.title}",${quiz.difficulty},${quiz.questionsCount},${quiz.isPublished},${quiz.action},SUCCESS,\n`;
    });
    
    errors.forEach(error => {
      csvContent += `"${error.title}",,,,ERROR,"${error.error}"\n`;
    });

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "resultats_import_quiz.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Import de quiz</h1>
        <button
          onClick={downloadTemplate}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          📥 Télécharger le modèle CSV
        </button>
      </div>

      <div className="bg-white border rounded-lg p-6 space-y-6">
        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-800 mb-2">Instructions</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Le fichier CSV doit contenir les colonnes : quiz_title, question_text, choice_text, is_correct</li>
            <li>• Colonnes optionnelles : description, difficulty, is_published, question_explanation, choice_explanation</li>
            <li>• Format : Une ligne par choix de réponse (plusieurs lignes par question)</li>
            <li>• Les quiz existants seront ignorés sauf si l&apos;option &quot;Écraser&quot; est activée</li>
            <li>• Chaque question doit avoir au moins 2 choix dont un correct</li>
          </ul>
        </div>

        {/* Upload de fichier */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Sélectionner un fichier CSV
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>

        {/* Options */}
        <div className="space-y-3">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={overwrite}
              onChange={(e) => setOverwrite(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">
              Écraser les quiz existants (même titre)
            </span>
          </label>
        </div>

        {/* Aperçu */}
        {previewData.length > 0 && (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">Aperçu des quiz</h3>
            <div className="space-y-4">
              {previewData.map((quiz, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{quiz.title}</h4>
                    <div className="flex gap-2 text-sm">
                      <span className={`px-2 py-1 rounded ${
                        quiz.difficulty === 'debutant' ? 'bg-green-100 text-green-800' :
                        quiz.difficulty === 'intermediaire' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {quiz.difficulty}
                      </span>
                      <span className={`px-2 py-1 rounded ${
                        quiz.isPublished ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {quiz.isPublished ? 'Publié' : 'Brouillon'}
                      </span>
                    </div>
                  </div>
                  {quiz.description && (
                    <p className="text-sm text-gray-600 mb-2">{quiz.description}</p>
                  )}
                  <div className="text-sm text-gray-600">
                    {quiz.questions.length} question(s) • {quiz.questions.reduce((acc, q) => acc + q.choices.length, 0)} choix total
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bouton d'import */}
        <div className="flex gap-4">
          <button
            onClick={handleImport}
            disabled={loading || !csvData}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? "Import en cours..." : "Importer les quiz"}
          </button>
          
          {importResult?.results && (
            <button
              onClick={downloadResults}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              📥 Télécharger les résultats
            </button>
          )}
        </div>
      </div>

      {/* Résultats */}
      {importResult && (
        <div className="bg-white border rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Résultats de l&apos;import
          </h3>
          
          {importResult.success ? (
            <div className="space-y-4">
              {/* Résumé */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="text-2xl font-bold text-green-600">
                    {importResult.results?.summary.imported}
                  </div>
                  <div className="text-sm text-green-700">Importés</div>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="text-2xl font-bold text-red-600">
                    {importResult.results?.summary.failed}
                  </div>
                  <div className="text-sm text-red-700">Échecs</div>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="text-2xl font-bold text-yellow-600">
                    {importResult.results?.summary.skipped}
                  </div>
                  <div className="text-sm text-yellow-700">Ignorés</div>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="text-2xl font-bold text-blue-600">
                    {importResult.results?.summary.total}
                  </div>
                  <div className="text-sm text-blue-700">Total</div>
                </div>
              </div>

              {/* Erreurs détaillées */}
              {importResult.results?.errors?.length && importResult.results.errors.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Erreurs détaillées</h4>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-h-60 overflow-y-auto">
                    {importResult.results?.errors.map((error, index) => (
                      <div key={index} className="text-sm text-red-700 mb-1">
                        <strong>Ligne {error.line}:</strong> {error.title} - {error.error}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Quiz créés */}
              {importResult.results?.success?.length && importResult.results.success.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Quiz traités</h4>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 max-h-60 overflow-y-auto">
                    {importResult.results?.success.map((quiz, index) => (
                      <div key={index} className="text-sm text-green-700 mb-1">
                        <strong>Ligne {quiz.line}:</strong> {quiz.title} ({quiz.difficulty}) - {quiz.questionsCount} questions - {quiz.action === 'created' ? 'Créé' : 'Mis à jour'}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="text-red-700">
                <strong>Erreur:</strong> {importResult.error}
              </div>
              {importResult.details && (
                <div className="mt-2 text-sm">
                  <pre className="whitespace-pre-wrap">{JSON.stringify(importResult.details, null, 2)}</pre>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
