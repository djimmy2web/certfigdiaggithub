"use client";
import { useState, useEffect, useCallback } from 'react';

interface Division {
  _id: string;
  name: string;
  color: string;
  minPoints: number;
  maxPoints?: number;
}

interface UserDivisionProps {
  points: number;
  className?: string;
}

export default function UserDivision({ points, className = "" }: UserDivisionProps) {
  const [division, setDivision] = useState<Division | null>(null);
  const [loading, setLoading] = useState(true);

  const loadDivision = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/divisions');
      const data = await response.json();
      
      if (data.success) {
        // Trouver la division correspondante aux points de l'utilisateur
        const userDivision = data.divisions.find((div: Division) => {
          if (div.maxPoints) {
            return points >= div.minPoints && points <= div.maxPoints;
          } else {
            return points >= div.minPoints;
          }
        });
        
        setDivision(userDivision || null);
      }
    } catch (error) {
      console.error('Erreur lors du chargement de la division:', error);
    } finally {
      setLoading(false);
    }
  }, [points]);

  useEffect(() => {
    loadDivision();
  }, [loadDivision]);

  if (loading) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className="animate-pulse bg-gray-200 rounded-full w-4 h-4"></div>
        <span className="text-gray-400">Chargement...</span>
      </div>
    );
  }

  if (!division) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className="w-4 h-4 rounded-full bg-gray-300"></div>
        <span className="text-gray-500">Non classé</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div
        className="w-4 h-4 rounded-full"
        style={{ backgroundColor: division.color }}
      ></div>
      <span className="font-medium" style={{ color: division.color }}>
        {division.name}
      </span>
      <span className="text-sm text-gray-500">
        ({points} pts)
      </span>
    </div>
  );
}
