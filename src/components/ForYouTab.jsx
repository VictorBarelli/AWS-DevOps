import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';

export default function ForYouTab({ user, onSwipe, onCardClick }) {
    const [recommendations, setRecommendations] = useState([]);
    const [preferences, setPreferences] = useState({});
    const [topGenres, setTopGenres] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        loadRecommendations();
    }, []);

    const loadRecommendations = async () => {
        try {
            setLoading(true);
            setError('');
            const data = await api.getRecommendations();

            if (data.message) {
                setError(data.message);
            } else {
                setRecommendations(data.recommendations || []);
                setPreferences(data.preferences || {});
                setTopGenres(data.topGenres || []);
            }
        } catch (err) {
            console.error('Error loading recommendations:', err);
            setError('Erro ao carregar recomendações');
        } finally {
            setLoading(false);
        }
    };

    const handleSwipe = (direction, game) => {
        if (onSwipe) {
            onSwipe(direction, game);
        }
        setCurrentIndex(prev => prev + 1);
    };

    const handleCardClick = (game) => {
        if (onCardClick) {
            onCardClick(game.id);
        }
    };

    const currentGame = recommendations[currentIndex];
    const hasMoreGames = currentIndex < recommendations.length;

    return (
        <div className="tab-content foryou-tab">
            {/* Preferences Header */}
            {topGenres.length > 0 && (
                <div className="preferences-header">
                    <h3>🧠 Seu Perfil de Jogador</h3>
                    <div className="genre-bars">
                        {topGenres.map(({ genre, percentage }) => (
                            <div key={genre} className="genre-bar-item">
                                <div className="genre-bar-label">
                                    <span>{genre}</span>
                                    <span>{percentage}%</span>
                                </div>
                                <div className="genre-bar-bg">
                                    <motion.div
                                        className="genre-bar-fill"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${percentage}%` }}
                                        transition={{ duration: 0.5, delay: 0.2 }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Main Content */}
            {loading ? (
                <div className="loading">
                    <div className="loading-spinner"></div>
                    <p>Analisando suas preferências...</p>
                </div>
            ) : error ? (
                <div className="foryou-empty">
                    <h3>🎮 {error}</h3>
                    <p>Volte para a aba Explorar e curta alguns jogos para que possamos conhecer seu gosto!</p>
                </div>
            ) : !hasMoreGames ? (
                <div className="foryou-empty">
                    <h3>🎯 Viu todas as recomendações!</h3>
                    <p>Continue explorando jogos para receber mais sugestões personalizadas.</p>
                    <button className="refresh-btn" onClick={loadRecommendations}>
                        🔄 Buscar mais
                    </button>
                </div>
            ) : (
                <div className="recommendation-card-container">
                    <AnimatePresence mode="wait">
                        {currentGame && (
                            <motion.div
                                key={currentGame.id}
                                className="recommendation-card"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, x: -100 }}
                                onClick={() => handleCardClick(currentGame)}
                            >
                                <div className="recommendation-image-container">
                                    {currentGame.image ? (
                                        <img
                                            src={currentGame.image}
                                            alt={currentGame.name}
                                            className="recommendation-image"
                                        />
                                    ) : (
                                        <div className="recommendation-image fallback">
                                            <span>🎮</span>
                                        </div>
                                    )}

                                    {/* Match Score Badge */}
                                    <div className="match-score-badge">
                                        <span className="match-percentage">{currentGame.matchScore}%</span>
                                        <span className="match-label">match</span>
                                    </div>
                                </div>

                                <div className="recommendation-content">
                                    <h3 className="recommendation-title">{currentGame.name}</h3>

                                    <div className="recommendation-meta">
                                        {currentGame.rating > 0 && (
                                            <span className="meta-rating">⭐ {currentGame.rating.toFixed(1)}</span>
                                        )}
                                        {currentGame.metacritic && (
                                            <span className={`meta-metacritic ${currentGame.metacritic >= 75 ? 'high' :
                                                    currentGame.metacritic >= 50 ? 'mid' : 'low'
                                                }`}>
                                                MC {currentGame.metacritic}
                                            </span>
                                        )}
                                        {currentGame.released && (
                                            <span>{new Date(currentGame.released).getFullYear()}</span>
                                        )}
                                    </div>

                                    <div className="recommendation-genres">
                                        {currentGame.genres?.slice(0, 3).map((genre, i) => (
                                            <span
                                                key={i}
                                                className={`genre-tag ${preferences[genre] ? 'matched' : ''}`}
                                            >
                                                {genre}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Action Buttons */}
                    <div className="recommendation-actions">
                        <button
                            className="rec-action-btn nope"
                            onClick={() => handleSwipe('left', currentGame)}
                        >
                            ✕
                        </button>
                        <button
                            className="rec-action-btn like"
                            onClick={() => handleSwipe('right', currentGame)}
                        >
                            ♥
                        </button>
                    </div>

                    {/* Progress */}
                    <div className="recommendation-progress">
                        {currentIndex + 1} / {recommendations.length}
                    </div>
                </div>
            )}
        </div>
    );
}
