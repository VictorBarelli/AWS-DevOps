import { motion } from 'framer-motion';

export default function LikesTab({ matches, onRemoveMatch, onMatchClick }) {
    if (matches.length === 0) {
        return (
            <div className="tab-content likes-tab">
                <div className="empty-state">
                    <div className="empty-icon">💚</div>
                    <h3>Nenhum jogo curtido ainda</h3>
                    <p>Comece a explorar e curta jogos que você gostaria de jogar!</p>
                </div>
            </div>
        );
    }

    return (
        <div className="tab-content likes-tab">
            <div className="likes-header">
                <h2>Seus Jogos Favoritos</h2>
                <span className="likes-count">{matches.length} {matches.length === 1 ? 'jogo' : 'jogos'}</span>
            </div>

            <div className="likes-grid">
                {matches.map((game, index) => (
                    <motion.div
                        key={game.id}
                        className={`like-card ${game.superLiked ? 'super-liked' : ''}`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => onMatchClick(game)}
                    >
                        <div className="like-card-image">
                            <img src={game.image} alt={game.name} />
                            <button
                                className="remove-btn"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onRemoveMatch(game.id);
                                }}
                                title="Remover"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="like-card-info">
                            <h3>{game.name}</h3>
                            {game.rating > 0 && (
                                <div className="like-card-rating">
                                    ⭐ {game.rating.toFixed(1)}
                                </div>
                            )}
                            {game.genres && game.genres.length > 0 && (
                                <div className="like-card-genres">
                                    {game.genres.slice(0, 2).map((genre, i) => (
                                        <span key={i} className="genre-tag">{genre}</span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
