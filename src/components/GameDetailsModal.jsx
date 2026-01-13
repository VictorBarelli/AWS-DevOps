import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchGameDetails, fetchGameScreenshots } from '../services/rawgApi';

export default function GameDetailsModal({ gameId, onClose, onSwipe }) {
    const [game, setGame] = useState(null);
    const [screenshots, setScreenshots] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    useEffect(() => {
        if (gameId) {
            setLoading(true);
            Promise.all([
                fetchGameDetails(gameId),
                fetchGameScreenshots(gameId)
            ])
                .then(([gameData, screenshotsData]) => {
                    setGame(gameData);
                    setScreenshots([gameData.image, ...screenshotsData].filter(Boolean));
                    setLoading(false);
                })
                .catch(err => {
                    console.error('Error loading game details:', err);
                    setLoading(false);
                });
        }
    }, [gameId]);

    const nextImage = () => {
        setCurrentImageIndex(prev =>
            prev < screenshots.length - 1 ? prev + 1 : 0
        );
    };

    const prevImage = () => {
        setCurrentImageIndex(prev =>
            prev > 0 ? prev - 1 : screenshots.length - 1
        );
    };

    const handleLike = () => {
        if (game) {
            onSwipe('right', {
                id: game.id,
                name: game.name,
                image: game.image,
                genres: game.genres,
                rating: game.rating
            });
        }
        onClose();
    };

    const handlePass = () => {
        onClose();
    };

    if (!gameId) return null;

    return (
        <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
        >
            <motion.div
                className="game-details-modal"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={e => e.stopPropagation()}
            >
                {loading ? (
                    <div className="loading">
                        <div className="loading-spinner"></div>
                        <p>Carregando detalhes...</p>
                    </div>
                ) : game ? (
                    <>
                        {/* Close button */}
                        <button className="modal-close" onClick={onClose}>✕</button>

                        {/* Image Carousel */}
                        <div className="modal-gallery">
                            {screenshots.length > 0 && (
                                <>
                                    <img
                                        src={screenshots[currentImageIndex]}
                                        alt={game.name}
                                        className="modal-image"
                                    />
                                    {screenshots.length > 1 && (
                                        <>
                                            <button className="gallery-btn prev" onClick={prevImage}>❮</button>
                                            <button className="gallery-btn next" onClick={nextImage}>❯</button>
                                            <div className="gallery-dots">
                                                {screenshots.map((_, i) => (
                                                    <span
                                                        key={i}
                                                        className={`gallery-dot ${i === currentImageIndex ? 'active' : ''}`}
                                                        onClick={() => setCurrentImageIndex(i)}
                                                    />
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Content */}
                        <div className="modal-content">
                            <h2 className="modal-title">{game.name}</h2>

                            {/* Meta info */}
                            <div className="modal-meta">
                                {game.rating > 0 && (
                                    <span className="meta-item rating">⭐ {game.rating.toFixed(1)}</span>
                                )}
                                {game.metacritic && (
                                    <span className={`meta-item metacritic ${game.metacritic >= 75 ? 'high' :
                                            game.metacritic >= 50 ? 'mid' : 'low'
                                        }`}>
                                        MC {game.metacritic}
                                    </span>
                                )}
                                {game.released && (
                                    <span className="meta-item">📅 {new Date(game.released).getFullYear()}</span>
                                )}
                                {game.playtime > 0 && (
                                    <span className="meta-item">🕒 {game.playtime}h</span>
                                )}
                            </div>

                            {/* Genres */}
                            <div className="modal-genres">
                                {game.genres?.map((genre, i) => (
                                    <span key={i} className="genre-tag">{genre}</span>
                                ))}
                            </div>

                            {/* Platforms */}
                            {game.platforms?.length > 0 && (
                                <div className="modal-platforms">
                                    <strong>Plataformas:</strong> {game.platforms.join(', ')}
                                </div>
                            )}

                            {/* Developers */}
                            {game.developers?.length > 0 && (
                                <div className="modal-developers">
                                    <strong>Desenvolvedor:</strong> {game.developers.join(', ')}
                                </div>
                            )}

                            {/* Description */}
                            {game.description && (
                                <div className="modal-description">
                                    <h3>Sobre o jogo</h3>
                                    <p>{game.description}</p>
                                </div>
                            )}

                            {/* Website link */}
                            {game.website && (
                                <a
                                    href={game.website}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="modal-website"
                                >
                                    🌐 Visitar site oficial
                                </a>
                            )}
                        </div>

                        {/* Action buttons */}
                        <div className="modal-actions">
                            <button className="modal-action-btn pass" onClick={handlePass}>
                                ✕ Passar
                            </button>
                            <button className="modal-action-btn like" onClick={handleLike}>
                                ♥ Quero jogar!
                            </button>
                        </div>
                    </>
                ) : (
                    <div className="modal-error">
                        <p>Erro ao carregar detalhes do jogo</p>
                        <button onClick={onClose}>Fechar</button>
                    </div>
                )}
            </motion.div>
        </motion.div>
    );
}
