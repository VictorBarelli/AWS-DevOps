import { useState } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';

export default function SwipeCard({ game, onSwipe, isTop, onCardClick }) {
    const [exitX, setExitX] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [imageError, setImageError] = useState(false);

    const x = useMotionValue(0);
    const rotate = useTransform(x, [-200, 200], [-25, 25]);
    const likeOpacity = useTransform(x, [0, 100], [0, 1]);
    const nopeOpacity = useTransform(x, [-100, 0], [1, 0]);

    const handleDragStart = () => {
        setIsDragging(true);
    };

    const handleDragEnd = (_, info) => {
        setIsDragging(false);
        const threshold = 100;

        if (info.offset.x > threshold) {
            setExitX(300);
            onSwipe('right', game);
        } else if (info.offset.x < -threshold) {
            setExitX(-300);
            onSwipe('left', game);
        }
    };

    const handleClick = (e) => {
        // Only trigger click if not dragging
        if (!isDragging && onCardClick && isTop) {
            onCardClick(game);
        }
    };

    if (!game) return null;

    return (
        <motion.div
            className="game-card"
            style={{
                x,
                rotate,
                zIndex: isTop ? 10 : 0
            }}
            drag={isTop ? 'x' : false}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={1}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onClick={handleClick}
            initial={{ scale: isTop ? 1 : 0.95, opacity: isTop ? 1 : 0.5 }}
            animate={{
                scale: isTop ? 1 : 0.95,
                opacity: isTop ? 1 : 0.7,
                y: isTop ? 0 : 10
            }}
            exit={{
                x: exitX,
                opacity: 0,
                transition: { duration: 0.3 }
            }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        >
            {/* Swipe Indicators */}
            <motion.div
                className="swipe-indicator like"
                style={{ opacity: likeOpacity }}
            >
                PLAY ✓
            </motion.div>

            <motion.div
                className="swipe-indicator nope"
                style={{ opacity: nopeOpacity }}
            >
                NOPE ✗
            </motion.div>

            {/* Game Image */}
            {!imageError && game.image ? (
                <img
                    src={game.image}
                    alt={game.name}
                    className="game-card-image"
                    draggable={false}
                    onError={() => setImageError(true)}
                />
            ) : (
                <div className="game-card-image fallback-image">
                    <span style={{ fontSize: '80px', opacity: 0.5 }}>🎮</span>
                    <span style={{
                        marginTop: '20px',
                        color: 'rgba(255,255,255,0.6)',
                        fontSize: '18px',
                        fontWeight: 500
                    }}>
                        Sem imagem disponível
                    </span>
                </div>
            )}

            {/* Click hint */}
            {isTop && (
                <div className="card-click-hint">
                    Clique para ver detalhes
                </div>
            )}

            {/* Game Info */}
            <div className="game-card-content">
                <div>
                    <h2 className="game-card-title">{game.name}</h2>

                    <div className="game-card-genres">
                        {game.genres?.slice(0, 3).map((genre, i) => (
                            <span key={i} className="genre-tag">{genre}</span>
                        ))}
                    </div>
                </div>

                <div className="game-card-meta">
                    {game.rating > 0 && (
                        <span className="rating">
                            ⭐ {game.rating.toFixed(1)}
                        </span>
                    )}

                    {game.released && (
                        <span>{new Date(game.released).getFullYear()}</span>
                    )}

                    {game.metacritic && (
                        <span style={{
                            color: game.metacritic >= 75 ? '#10b981' :
                                game.metacritic >= 50 ? '#fbbf24' : '#ef4444'
                        }}>
                            MC: {game.metacritic}
                        </span>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
