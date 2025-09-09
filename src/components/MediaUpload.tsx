"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";

interface MediaUploadProps {
  onMediaUpload: (media: { type: "image" | "video"; url: string; filename: string } | null) => void;
  currentMedia?: { type: "image" | "video"; url: string; filename: string } | null;
  label?: string;
  className?: string;
}

export default function MediaUpload({ onMediaUpload, currentMedia, label = "Ajouter un média", className = "" }: MediaUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("media", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de l'upload");
      }

      onMediaUpload({
        type: data.file.type,
        url: data.file.url,
        filename: data.file.filename,
      });
    } catch (err: unknown) {
      setError((err as Error).message || "Erreur lors de l'upload");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemove = () => {
    onMediaUpload(null);
    setError(null);
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">{label}</label>
        {currentMedia && (
          <button
            type="button"
            onClick={handleRemove}
            className="text-sm text-red-600 hover:text-red-800"
          >
            Supprimer
          </button>
        )}
      </div>

      {currentMedia ? (
        <div className="border rounded-lg p-4 bg-gray-50">
          {currentMedia.type === "image" ? (
            <Image
              src={currentMedia.url}
              alt="Média"
              width={300}
              height={192}
              className="max-w-full h-auto max-h-48 object-contain rounded"
            />
          ) : (
            <video
              src={currentMedia.url}
              controls
              className="max-w-full h-auto max-h-48 rounded"
            >
              Votre navigateur ne supporte pas la lecture de vidéos.
            </video>
          )}
          <p className="text-sm text-gray-600 mt-2">{currentMedia.filename}</p>
        </div>
      ) : (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            onChange={handleFileChange}
            disabled={uploading}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="text-blue-600 hover:text-blue-800 disabled:opacity-50"
          >
            {uploading ? "Upload en cours..." : "Sélectionner un fichier"}
          </button>
          <p className="text-sm text-gray-500 mt-1">
            Images (JPG, PNG, GIF) ou Vidéos (MP4, WebM) - Max 10MB
          </p>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
