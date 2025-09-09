import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import mongoose from 'mongoose';
import WeeklyRanking from '@/models/WeeklyRanking';
import Division from '@/models/Division';

// S'assurer que les modèles sont enregistrés
const ensureModels = () => {
  // Les modèles sont automatiquement enregistrés lors de l'import
  // mais on peut forcer leur enregistrement ici si nécessaire
  if (!mongoose.models.Division) {
    console.log('Enregistrement du modèle Division...');
  }
  if (!mongoose.models.WeeklyRanking) {
    console.log('Enregistrement du modèle WeeklyRanking...');
  }
};

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    ensureModels();

    const { searchParams } = new URL(request.url);
    const weekStart = searchParams.get('weekStart');
    const divisionId = searchParams.get('divisionId');

    const query: Record<string, unknown> = {};
    
    if (weekStart) {
      query.weekStart = new Date(weekStart);
    }
    
    if (divisionId) {
      query.divisionId = divisionId;
    }

    // Si aucune semaine spécifiée, prendre la semaine actuelle
    if (!weekStart) {
      const now = new Date();
      const monday = new Date(now);
      monday.setDate(now.getDate() - now.getDay() + 1); // Lundi de cette semaine
      monday.setHours(0, 0, 0, 0);
      query.weekStart = monday;
    }

    // Récupérer d'abord les divisions pour éviter le problème de populate
    const divisions = await Division.find({}).sort({ order: 1 });
    const divisionMap = new Map(divisions.map(d => [d._id.toString(), d]));

    const rankings = await WeeklyRanking.find(query)
      .sort({ 'rankings.rank': 1 });

    // Enrichir les données avec les informations des divisions
    const enrichedRankings = rankings.map(ranking => {
      const division = divisionMap.get(ranking.divisionId.toString());
      return {
        ...ranking.toObject(),
        divisionId: division ? {
          _id: division._id,
          name: division.name,
          color: division.color,
          order: division.order
        } : ranking.divisionId
      };
    });

    // Trier par ordre des divisions puis par rang
    enrichedRankings.sort((a, b) => {
      const orderA = a.divisionId?.order || 0;
      const orderB = b.divisionId?.order || 0;
      if (orderA !== orderB) return orderA - orderB;
      return 0;
    });

    return NextResponse.json({
      success: true,
      rankings: enrichedRankings
    });

  } catch (error: unknown) {
    console.error('Erreur lors de la récupération des classements:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur lors de la récupération' },
      { status: 500 }
    );
  }
}
