"use client";
import { useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface ImportSuccess {
  email: string;
  name: string;
  role: string;
  action: string;
  password?: string;
  line?: number;
}

interface ImportError {
  email: string;
  error: string;
  line: number;
}

interface UserRow {
  email: string;
  name: string;
  role: string;
  password: string;
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

export default function ImportUsersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [csvData, setCsvData] = useState<string>("");
  const [previewData, setPreviewData] = useState<UserRow[]>([]);
  const [generatePasswords, setGeneratePasswords] = useState(false);
  const [sendEmails, setSendEmails] = useState(false);
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
    const requiredHeaders = ['email', 'name'];
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));

    if (missingHeaders.length > 0) {
      alert(`En-têtes manquants: ${missingHeaders.join(', ')}`);
      return;
    }

    const data = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      if (values.length >= 2) {
        const row: UserRow = {
          email: values[headers.indexOf('email')] || '',
          name: values[headers.indexOf('name')] || '',
          role: values[headers.indexOf('role')] || 'user',
          password: values[headers.indexOf('password')] || '',
        };
        data.push(row);
      }
    }

    setPreviewData(data.slice(0, 5)); // Afficher les 5 premières lignes
  };

  const handleImport = async () => {
    if (!csvData) {
      alert("Veuillez d'abord sélectionner un fichier CSV");
      return;
    }

    setLoading(true);
    setImportResult(null);

    try {
      const lines = csvData.trim().split('\n');
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      
      const users = [];
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        if (values.length >= 2) {
          const user = {
            email: values[headers.indexOf('email')] || '',
            name: values[headers.indexOf('name')] || '',
            role: values[headers.indexOf('role')] || 'user',
            password: values[headers.indexOf('password')] || '',
          };
          users.push(user);
        }
      }

      const response = await fetch("/api/admin/users/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          users,
          generatePasswords,
          sendEmails,
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
    const template = "email,name,role,password\njohn@example.com,John Doe,user,password123\njane@example.com,Jane Smith,admin,securepass";
    const blob = new Blob([template], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "template_import_utilisateurs.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const downloadResults = () => {
    if (!importResult?.results) return;

    const { success, errors } = importResult.results;
    let csvContent = "email,name,role,password,status,error\n";
    
    success.forEach(user => {
      csvContent += `${user.email},${user.name},${user.role},${user.password || ""},SUCCESS,\n`;
    });
    
    errors.forEach(error => {
      csvContent += `${error.email},,,,ERROR,${error.error}\n`;
    });

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "resultats_import.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Import d&apos;utilisateurs</h1>
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
            <li>• Le fichier CSV doit contenir les colonnes : email, name, role (optionnel), password (optionnel)</li>
            <li>• Les rôles possibles : &quot;user&quot; ou &quot;admin&quot; (par défaut : &quot;user&quot;)</li>
            <li>• Si aucun mot de passe n&apos;est fourni, vous pouvez générer des mots de passe automatiquement</li>
            <li>• Les utilisateurs existants seront ignorés</li>
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
              checked={generatePasswords}
              onChange={(e) => setGeneratePasswords(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">
              Générer automatiquement les mots de passe manquants
            </span>
          </label>
          
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={sendEmails}
              onChange={(e) => setSendEmails(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">
              Envoyer des emails de bienvenue (non implémenté)
            </span>
          </label>
        </div>

        {/* Aperçu */}
        {previewData.length > 0 && (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">Aperçu des données</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rôle</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mot de passe</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {previewData.map((row, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.role}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {row.password ? "***" : generatePasswords ? "Généré" : "Manquant"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
            {loading ? "Import en cours..." : "Importer les utilisateurs"}
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
                        <strong>Ligne {error.line}:</strong> {error.email} - {error.error}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Utilisateurs créés */}
              {importResult.results?.success?.length && importResult.results.success.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Utilisateurs créés</h4>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 max-h-60 overflow-y-auto">
                    {importResult.results?.success.map((user, index) => (
                      <div key={index} className="text-sm text-green-700 mb-1">
                        <strong>Ligne {user.line}:</strong> {user.email} ({user.name}) - {user.role}
                        {user.password && ` - Mot de passe: ${user.password}`}
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
