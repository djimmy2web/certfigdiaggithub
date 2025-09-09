"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

interface Game {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  difficulty: "facile" | "moyen" | "difficile";
  category: string;
  isAvailable: boolean;
}

interface GameState {
  currentGame: string | null;
  score: number;
  lives: number;
  timeLeft: number;
  isPlaying: boolean;
  isCompleted: boolean;
}

interface MemoryCard {
  id: number;
  content: string;
  type: 'word' | 'definition';
  pairId: number;
  isFlipped: boolean;
  isMatched: boolean;
}

interface SpeedQuestion {
  question: string;
  options: string[];
  answer: string;
}

interface PuzzleSentence {
  sentence: string;
  words: string[];
  hint: string;
}

interface QuizQuestion {
  question: string;
  options: string[];
  answer: string;
  category: string;
}

interface GameData {
  type: string;
  cards?: MemoryCard[];
  questions?: SpeedQuestion[] | QuizQuestion[];
  sentences?: PuzzleSentence[];
  targetWord?: string;
  validWords?: string[];
  currentQuestion?: number;
  currentSentence?: number;
  shuffledWords?: string[];
  guesses?: string[];
  currentGuess?: string;
  gameOver?: boolean;
  startTime?: number;
}

export default function JeuxPage() {
  const [games, setGames] = useState<Game[]>([]);
  const [gameState, setGameState] = useState<GameState>({
    currentGame: null,
    score: 0,
    lives: 3,
    timeLeft: 60,
    isPlaying: false,
    isCompleted: false
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const availableGames: Game[] = [
      {
        id: "memory",
        title: "Mémoire des Mots",
        description: "Retrouvez les paires de mots français et leurs définitions",
        icon: "🧠",
        color: "bg-gradient-to-r from-purple-500 to-pink-500",
        difficulty: "moyen",
        category: "mémoire",
        isAvailable: true
      },
      {
        id: "speed",
        title: "Course contre la Montre",
        description: "Répondez le plus vite possible aux questions de vocabulaire",
        icon: "⚡",
        color: "bg-gradient-to-r from-red-500 to-orange-500",
        difficulty: "difficile",
        category: "vitesse",
        isAvailable: true
      },
      {
        id: "puzzle",
        title: "Puzzle de Phrases",
        description: "Reconstituez les phrases en ordonnant les mots",
        icon: "🧩",
        color: "bg-gradient-to-r from-blue-500 to-cyan-500",
        difficulty: "facile",
        category: "logique",
        isAvailable: true
      },
      {
        id: "wordle",
        title: "Wordle Français",
        description: "Devinez le mot français en 6 tentatives",
        icon: "📝",
        color: "bg-gradient-to-r from-green-500 to-emerald-500",
        difficulty: "moyen",
        category: "devinette",
        isAvailable: true
      },
      {
        id: "quiz",
        title: "Quiz Express",
        description: "Quiz rapide avec questions variées",
        icon: "🎯",
        color: "bg-gradient-to-r from-indigo-500 to-purple-500",
        difficulty: "facile",
        category: "quiz",
        isAvailable: true
      },
      {
        id: "coming-soon",
        title: "Plus de Jeux",
        description: "D'autres jeux arrivent bientôt !",
        icon: "🚀",
        color: "bg-gradient-to-r from-gray-400 to-gray-600",
        difficulty: "facile",
        category: "futur",
        isAvailable: false
      }
    ];
    setGames(availableGames);
    setLoading(false);
  }, []);

  const startGame = (gameId: string) => {
    setGameState({
      currentGame: gameId,
      score: 0,
      lives: 3,
      timeLeft: 60,
      isPlaying: true,
      isCompleted: false
    });
  };

  const endGame = () => {
    setGameState(prev => ({
      ...prev,
      isPlaying: false,
      isCompleted: true
    }));
  };

  const resetGame = () => {
    setGameState({
      currentGame: null,
      score: 0,
      lives: 3,
      timeLeft: 60,
      isPlaying: false,
      isCompleted: false
    });
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "facile": return "text-green-600 bg-green-100";
      case "moyen": return "text-yellow-600 bg-yellow-100";
      case "difficile": return "text-red-600 bg-red-100";
      default: return "text-gray-600 bg-gray-100";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des jeux...</p>
        </div>
      </div>
    );
  }

  if (gameState.isPlaying) {
    return <GameComponent gameId={gameState.currentGame!} onEnd={endGame} />;
  }

  if (gameState.isCompleted) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Jeu terminé !
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Score final : {gameState.score} points
            </p>
            
            <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
              <div className="text-center mb-6">
                <div className="text-6xl font-bold text-blue-600 mb-2">{gameState.score}</div>
                <div className="text-2xl text-gray-700">Points</div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={resetGame}
                className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
              >
                Jouer à nouveau
              </button>
              <Link
                href="/reviser"
                className="bg-gray-600 text-white px-8 py-3 rounded-lg hover:bg-gray-700 transition-colors font-semibold"
              >
                Retour à la révision
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* En-tête */}
        <div className="text-center mb-12">
          <div className="text-6xl mb-4">🎮</div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Zone de Jeux
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Apprenez en vous amusant avec nos jeux éducatifs interactifs
          </p>
          <Link 
            href="/reviser"
            className="inline-flex items-center mt-6 text-blue-600 hover:text-blue-700 font-medium"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Retour à la révision
          </Link>
        </div>

        {/* Grille des jeux */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {games.map((game) => (
            <div
              key={game.id}
              className={`relative group cursor-pointer transform transition-all duration-300 hover:scale-105 ${
                !game.isAvailable ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              onClick={() => game.isAvailable && startGame(game.id)}
            >
              <div className={`${game.color} rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow`}>
                <div className="text-4xl mb-4">{game.icon}</div>
                <h3 className="text-xl font-bold mb-2">{game.title}</h3>
                <p className="text-white/90 text-sm mb-4">{game.description}</p>
                
                <div className="flex items-center justify-between">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getDifficultyColor(game.difficulty)}`}>
                    {game.difficulty}
                  </span>
                  <span className="text-white/70 text-xs">{game.category}</span>
                </div>

                {!game.isAvailable && (
                  <div className="absolute inset-0 bg-black/20 rounded-2xl flex items-center justify-center">
                    <span className="text-white font-semibold">Bientôt disponible</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Section de statistiques */}
        <div className="mt-16 bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            🏆 Classement des Jeux
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">🧠</div>
              <div className="text-lg font-semibold text-gray-900">Mémoire des Mots</div>
              <div className="text-sm text-gray-600">Le plus populaire</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600">⚡</div>
              <div className="text-lg font-semibold text-gray-900">Course contre la Montre</div>
              <div className="text-sm text-gray-600">Le plus rapide</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">📝</div>
              <div className="text-lg font-semibold text-gray-900">Wordle Français</div>
              <div className="text-sm text-gray-600">Le plus addictif</div>
            </div>
          </div>
        </div>

        {/* Conseils pour jouer */}
        <div className="mt-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-8 text-white">
          <h3 className="text-2xl font-bold mb-4">💡 Conseils pour bien jouer</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-2">🎯 Commencez par les jeux faciles</h4>
              <p className="text-blue-100">Prenez le temps de comprendre les règles</p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">⏰ Gérez votre temps</h4>
              <p className="text-blue-100">Certains jeux sont chronométrés</p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">🔄 Pratiquez régulièrement</h4>
              <p className="text-blue-100">La répétition améliore vos performances</p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">🏆 Défiez vos amis</h4>
              <p className="text-blue-100">Comparez vos scores</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Composant pour les jeux individuels
function GameComponent({ gameId, onEnd }: { gameId: string; onEnd: () => void }) {
  const [gameData, setGameData] = useState<GameData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [timeLeft, setTimeLeft] = useState(60);

  useEffect(() => {
    const initializeGame = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/games?type=${gameId}&limit=10`);
        const result = await response.json();
        
        if (!response.ok) {
          throw new Error(result.error || 'Erreur lors du chargement du jeu');
        }

        // Initialiser les données spécifiques au jeu
        const gameConfig = {
          ...result.data,
          currentQuestion: 0,
          currentSentence: 0,
          shuffledWords: [],
          guesses: [],
          currentGuess: "",
          gameOver: false,
          startTime: Date.now()
        };

        setGameData(gameConfig);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Erreur lors du chargement du jeu");
      } finally {
        setLoading(false);
      }
    };

    initializeGame();
  }, [gameId]);

  useEffect(() => {
    if (timeLeft > 0 && gameData && !gameData.gameOver) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            onEnd();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [timeLeft, gameData, onEnd]);

  // Vérifier la fin de partie pour les vies
  useEffect(() => {
    if (lives <= 0) {
      setTimeout(() => onEnd(), 1000);
    }
  }, [lives, onEnd]);

  // Gestion des erreurs et chargement
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement du jeu...</p>
        </div>
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
          <button
            onClick={() => window.location.reload()}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  const handleMemoryCardClick = (cardId: number) => {
    if (!gameData || gameData.type !== "memory" || !gameData.cards) return;

    const card = gameData.cards.find((c: MemoryCard) => c.id === cardId);
    if (!card || card.isFlipped || card.isMatched) return;

    const newCards = gameData.cards.map((c: MemoryCard) =>
      c.id === cardId ? { ...c, isFlipped: true } : c
    );

    const flippedCards = newCards.filter((c: MemoryCard) => c.isFlipped && !c.isMatched);

    if (flippedCards.length === 2) {
      const [card1, card2] = flippedCards;
      // Vérifier si c'est une paire (même pairId)
      if (card1.pairId === card2.pairId) {
        // Paire trouvée !
        setGameData({
          ...gameData,
          cards: newCards.map((c: MemoryCard) =>
            c.id === card1.id || c.id === card2.id ? { ...c, isMatched: true } : c
          )
        });
        setScore(prev => prev + 20);
        
        // Vérifier si toutes les paires sont trouvées
        const matchedPairs = newCards.filter((c: MemoryCard) => c.isMatched).length / 2;
        if (matchedPairs === gameData.cards.length / 2) {
          setTimeout(() => onEnd(), 1000);
        }
      } else {
        // Pas une paire, retourner les cartes
        setTimeout(() => {
          setGameData({
            ...gameData,
            cards: newCards.map((c: MemoryCard) =>
              c.id === card1.id || c.id === card2.id ? { ...c, isFlipped: false } : c
            )
          });
          setLives(prev => prev - 1);
          
          if (lives <= 1) {
            setTimeout(() => onEnd(), 1000);
          }
        }, 1500);
      }
    } else {
      setGameData({ ...gameData, cards: newCards });
    }
  };

  const handleSpeedAnswer = (answer: string) => {
    if (!gameData || gameData.type !== "speed" || !gameData.questions || gameData.currentQuestion === undefined) return;

    const currentQ = gameData.questions[gameData.currentQuestion];
    const timeBonus = Math.max(1, Math.floor(timeLeft / 10)); // Bonus de temps
    
    if (answer === currentQ.answer) {
      setScore(prev => prev + 10 + timeBonus);
    } else {
      setLives(prev => prev - 1);
    }

    if ((gameData.currentQuestion || 0) + 1 >= (gameData.questions?.length || 0)) {
      setTimeout(() => onEnd(), 1000);
    } else {
      setGameData({
        ...gameData,
        currentQuestion: (gameData.currentQuestion || 0) + 1
      });
    }
  };

  const handlePuzzleWordClick = (word: string) => {
    if (!gameData || gameData.type !== "puzzle" || !gameData.sentences || gameData.currentSentence === undefined || !gameData.shuffledWords) return;

    const currentSentence = gameData.sentences[gameData.currentSentence];
    const newShuffledWords = [...gameData.shuffledWords, word];

    if (newShuffledWords.length === currentSentence.words.length) {
      const isCorrect = newShuffledWords.join(" ") === currentSentence.sentence;
      if (isCorrect) {
        setScore(prev => prev + 20);
        // Animation de succès
        setTimeout(() => {
          if ((gameData.currentSentence || 0) + 1 >= (gameData.sentences?.length || 0)) {
            setTimeout(() => onEnd(), 1000);
          } else {
            setGameData({
              ...gameData,
              currentSentence: (gameData.currentSentence || 0) + 1,
              shuffledWords: []
            });
          }
        }, 1000);
      } else {
        setLives(prev => prev - 1);
        // Animation d'erreur
        setTimeout(() => {
          setGameData({
            ...gameData,
            shuffledWords: []
          });
        }, 1000);
      }
    } else {
      setGameData({
        ...gameData,
        shuffledWords: newShuffledWords
      });
    }
  };

  const handleWordleGuess = (guess: string) => {
    if (!gameData || gameData.type !== "wordle" || !gameData.guesses) return;

    const newGuesses = [...gameData.guesses, guess];
    const isCorrect = guess === gameData.targetWord;
    const gameOver = isCorrect || newGuesses.length >= 6;

    if (isCorrect) {
      setScore(prev => prev + 50);
    }

    setGameData({
      ...gameData,
      guesses: newGuesses,
      gameOver
    });

    if (gameOver) {
      setTimeout(onEnd, 2000);
    }
  };

  const handleQuizAnswer = (answer: string) => {
    if (!gameData || gameData.type !== "quiz" || !gameData.questions || gameData.currentQuestion === undefined) return;

      const currentQ = gameData.questions[gameData.currentQuestion];
    if (!currentQ) return;

    if (answer === currentQ.answer) {
      setScore(prev => prev + 10);
      // Feedback visuel de succès
      setTimeout(() => {
        if ((gameData.currentQuestion || 0) + 1 >= (gameData.questions?.length || 0)) { 
          setTimeout(() => onEnd(), 1000);
        } else {
          setGameData({
            ...gameData,
            currentQuestion: (gameData.currentQuestion || 0) + 1
          });
        }
      }, 1000);
    } else {
      setLives(prev => prev - 1);
      // Feedback visuel d'erreur
      setTimeout(() => {
        if ((gameData.currentQuestion || 0) + 1 >= (gameData.questions?.length || 0)) {
          setTimeout(() => onEnd(), 1000);
        } else {
          setGameData({
            ...gameData,
            currentQuestion: (gameData.currentQuestion || 0) + 1
          });
        }
      }, 1000);
    }
  };

  if (!gameData) {
    return <div>Chargement du jeu...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* En-tête du jeu */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {gameId === "memory" && "🧠 Mémoire des Mots"}
                {gameId === "speed" && "⚡ Course contre la Montre"}
                {gameId === "puzzle" && "🧩 Puzzle de Phrases"}
                {gameId === "wordle" && "📝 Wordle Français"}
                {gameId === "quiz" && "🎯 Quiz Express"}
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-center">
                <div className="text-lg font-bold text-blue-600">{score}</div>
                <div className="text-xs text-gray-600">Score</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-red-600">{lives}</div>
                <div className="text-xs text-gray-600">Vies</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-green-600">{timeLeft}s</div>
                <div className="text-xs text-gray-600">Temps</div>
              </div>
            </div>
          </div>
        </div>

        {/* Contenu du jeu */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          {gameData.type === "memory" && (
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold mb-4">Retrouvez les paires de mots et définitions</h2>
              <div className="grid grid-cols-4 gap-4 max-w-2xl mx-auto">
                {gameData.cards?.map((card: MemoryCard) => (
                  <button
                    key={card.id}
                    onClick={() => handleMemoryCardClick(card.id)}
                    className={`h-24 rounded-lg border-2 transition-all duration-300 transform hover:scale-105 ${
                      card.isFlipped || card.isMatched
                        ? card.isMatched
                          ? "bg-green-100 border-green-500 text-green-800"
                          : "bg-blue-100 border-blue-500 text-blue-800"
                        : "bg-gray-100 border-gray-300 hover:border-blue-300"
                    } ${card.isMatched ? "opacity-75" : ""}`}
                  >
                    {card.isFlipped || card.isMatched ? (
                      <div className="text-center">
                        <div className="text-xs text-gray-500 mb-1">
                          {card.type === 'word' ? '📝' : '📖'}
                        </div>
                        <span className="text-xs font-medium leading-tight">{card.content}</span>
                      </div>
                    ) : (
                      <div className="text-center">
                        <span className="text-3xl">❓</span>
                        <div className="text-xs text-gray-500 mt-1">Cliquez</div>
                      </div>
                    )}
                  </button>
                ))}
              </div>
              <div className="mt-4 text-sm text-gray-600">
                Paires trouvées: {gameData.cards?.filter((c: MemoryCard) => c.isMatched).length || 0} / {(gameData.cards?.length || 0) / 2}
              </div>
            </div>
          )}

          {gameData.type === "speed" && (
            <div className="text-center">
              <div className="mb-6">
                <div className="text-2xl font-bold text-red-600 mb-2">
                  ⚡ COURSE CONTRE LA MONTRE ⚡
                </div>
                <div className="text-lg text-gray-600">
                  Question {(gameData.currentQuestion || 0) + 1} / {gameData.questions?.length || 0}
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-red-50 to-orange-50 p-6 rounded-xl border-2 border-red-200 mb-6">
                <h2 className="text-xl font-bold mb-4 text-gray-800">
                  {gameData.questions?.[gameData.currentQuestion || 0]?.question}
                </h2>
                
                <div className="grid grid-cols-1 gap-3 max-w-md mx-auto">
                  {gameData.questions?.[gameData.currentQuestion || 0]?.options.map((option: string) => (
                    <button
                      key={option}
                      onClick={() => handleSpeedAnswer(option)}
                      className="p-4 bg-white hover:bg-red-100 border-2 border-red-200 hover:border-red-400 rounded-lg transition-all duration-200 transform hover:scale-105 text-left"
                    >
                      <span className="font-medium text-gray-800">{option}</span>
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="text-sm text-gray-600">
                ⚠️ Plus vous répondez vite, plus vous gagnez de points !
              </div>
            </div>
          )}

          {gameData.type === "puzzle" && (
            <div className="text-center">
              <h2 className="text-xl font-bold mb-4">Reconstituez la phrase :</h2>
              
              {/* Indice */}
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  💡 {gameData.sentences?.[gameData.currentSentence || 0]?.hint}
                </p>
              </div>
              
              {/* Phrase en cours de construction */}
              <div className="mb-6 p-4 bg-gray-100 rounded-lg min-h-[60px] flex items-center justify-center">
                {gameData.shuffledWords && gameData.shuffledWords.length > 0 ? (
                  <p className="text-lg font-medium text-gray-800">
                    {gameData.shuffledWords.join(" ")}
                  </p>
                ) : (
                  <p className="text-gray-500 italic">Cliquez sur les mots dans l&apos;ordre</p>
                )}
              </div>
              
              {/* Mots disponibles */}
              <div className="grid grid-cols-4 gap-2 max-w-2xl mx-auto">
                {gameData.sentences?.[gameData.currentSentence || 0]?.words.map((word: string, index: number) => {
                  const isUsed = gameData.shuffledWords?.includes(word) || false;
                  return (
                    <button
                      key={index}
                      onClick={() => !isUsed && handlePuzzleWordClick(word)}
                      disabled={isUsed}
                      className={`p-3 rounded-lg transition-all duration-200 ${
                        isUsed
                          ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                          : "bg-green-100 hover:bg-green-200 text-green-800 hover:scale-105"
                      }`}
                    >
                      {word}
                    </button>
                  );
                })}
              </div>
              
              {/* Progression */}
              <div className="mt-4 text-sm text-gray-600">
                Phrase {(gameData.currentSentence || 0) + 1} / {gameData.sentences?.length || 0}
              </div>
            </div>
          )}

          {gameData.type === "wordle" && (
            <div className="text-center">
              <h2 className="text-xl font-bold mb-4">Devinez le mot français en 6 tentatives</h2>
              
              {/* Grille des tentatives */}
              <div className="mb-6 max-w-md mx-auto">
                {[...Array(6)].map((_, rowIndex) => {
                  const guess = gameData.guesses?.[rowIndex] || "";
                  const isCurrentRow = rowIndex === (gameData.guesses?.length || 0) && !gameData.gameOver;
                  
                  return (
                    <div key={rowIndex} className="flex justify-center mb-2">
                      {[...Array(5)].map((_, colIndex) => {
                        const letter = guess[colIndex] || "";
                        let bgColor = "bg-gray-100 border-gray-300";
                        let textColor = "text-gray-700";
                        
                        if (guess && gameData.targetWord) {
                          if (letter === gameData.targetWord[colIndex]) {
                            bgColor = "bg-green-500 border-green-500";
                            textColor = "text-white";
                          } else if (gameData.targetWord.includes(letter)) {
                            bgColor = "bg-yellow-500 border-yellow-500";
                            textColor = "text-white";
                          } else {
                            bgColor = "bg-gray-500 border-gray-500";
                            textColor = "text-white";
                          }
                        }
                        
                        return (
                          <div
                            key={colIndex}
                            className={`w-12 h-12 border-2 flex items-center justify-center font-bold text-lg mx-1 transition-all duration-300 ${
                              isCurrentRow ? "border-blue-400 bg-blue-50" : bgColor
                            } ${textColor}`}
                          >
                            {letter || (isCurrentRow ? "?" : "")}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
              
              {/* Clavier virtuel */}
              {!gameData.gameOver && (
                <div className="space-y-2">
                  <p className="text-sm text-gray-600 mb-4">Entrez votre mot de 5 lettres :</p>
                  <div className="max-w-md mx-auto">
                    <input
                      type="text"
                      maxLength={5}
                      className="w-full p-3 border-2 border-blue-300 rounded-lg text-center text-lg font-mono uppercase tracking-wider"
                      placeholder="MOTIF"
                      onKeyPress={(e) => {
                        if (e.key === "Enter" && e.currentTarget.value.length === 5) {
                          const word = e.currentTarget.value.toUpperCase();
                          if (gameData.validWords?.includes(word)) {
                            handleWordleGuess(word);
                            e.currentTarget.value = "";
                          } else {
                            alert("Ce mot n'est pas dans notre dictionnaire !");
                          }
                        }
                      }}
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      Appuyez sur Entrée pour valider
                    </p>
                  </div>
                </div>
              )}
              
              {/* Résultat */}
              {gameData.gameOver && (
                <div className="mt-4 p-4 bg-gray-100 rounded-lg">
                  <p className="text-lg font-semibold">
                    {gameData.guesses?.includes(gameData.targetWord || "") 
                      ? "🎉 Bravo ! Vous avez trouvé le mot !" 
                      : `❌ Dommage ! Le mot était : ${gameData.targetWord}`
                    }
                  </p>
                </div>
              )}
            </div>
          )}

          {gameData.type === "quiz" && (
            <div className="text-center">
              <div className="mb-6">
                <div className="text-2xl font-bold text-indigo-600 mb-2">
                  🎯 QUIZ EXPRESS
                </div>
                <div className="text-lg text-gray-600">
                  Question {(gameData.currentQuestion || 0) + 1} / {gameData.questions?.length || 0}
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-xl border-2 border-indigo-200 mb-6">
                <div className="mb-4">
                  <span className="inline-block px-3 py-1 bg-indigo-100 text-indigo-800 text-xs font-semibold rounded-full">
                    {(gameData.questions?.[gameData.currentQuestion || 0] as QuizQuestion)?.category}
                  </span>
                </div>
                
                <h2 className="text-xl font-bold mb-6 text-gray-800">
                    {gameData.questions?.[gameData.currentQuestion || 0]?.question}
                </h2>
                
                <div className="grid grid-cols-1 gap-3 max-w-md mx-auto">
                  {gameData.questions?.[gameData.currentQuestion || 0]?.options.map((option: string) => (
                    <button
                      key={option}
                      onClick={() => handleQuizAnswer(option)}
                      className="p-4 bg-white hover:bg-indigo-100 border-2 border-indigo-200 hover:border-indigo-400 rounded-lg transition-all duration-200 transform hover:scale-105 text-left"
                    >
                      <span className="font-medium text-gray-800">{option}</span>
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="text-sm text-gray-600">
                📚 Testez vos connaissances dans différents domaines !
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
