import { motion, AnimatePresence } from 'framer-motion';

export default function MatchesList({
    matches,
    onRemoveMatch,
    onMatchClick,
    isOpen,      // Mobile: is drawer open
    onClose      // Mobile: close drawer
}) {
    return (
        <div className={`panel matches-panel ${isOpen ? 'open' : ''}`}>
            {/* Header */}
            <div className="panel-header">
                <span className="panel-icon">💚</span>
                <h2 className="panel-title">Meus Matches</h2>
                {matches.length > 0 && (
                    <span className="matches-count">({matches.length})</span>
                )}
            </div>

            {/* Matches List */}
            {matches.length === 0 ? (
                <div className="matches-empty">
                    <div className="matches-empty-icon">🎯</div>
                    <p className="matches-empty-text">
                        Seus jogos favoritos aparecerão aqui.<br />
                        Arraste para a direita para adicionar!
                    </p>
                </div>
            ) : (
                <div className="matches-list">
                    <AnimatePresence>
                        {matches.map(game => (
                            <motion.div
                                key={game.id}
                                className="match-item"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.2 }}
                                onClick={() => onMatchClick && onMatchClick(game)}
                            >
                                <img
                                    src={game.image || 'https://via.placeholder.com/64?text=?'}
                                    alt={game.name}
                                    className="match-image"
                                />

                                <div className="match-info">
                                    <h4 className="match-title">{game.name}</h4>
                                    <p className="match-genres">
                                        {game.genres?.slice(0, 2).join(', ') || 'Sem gênero'}
                                    </p>
                                    <span className="match-view-hint">Clique para detalhes</span>
                                </div>

                                <button
                                    className="match-remove"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onRemoveMatch(game.id);
                                    }}
                                    title="Remover dos matches"
                                >
                                    ✕
                                </button>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}

            {/* Stats */}
            {matches.length > 0 && (
                <div style={{
                    marginTop: '16px',
                    paddingTop: '16px',
                    borderTop: '1px solid var(--border-color)',
                    textAlign: 'center',
                    fontSize: 'var(--font-size-xs)',
                    color: 'var(--text-muted)'
                }}>
                    {matches.length} {matches.length === 1 ? 'jogo' : 'jogos'} na sua lista
                </div>
            )}
        </div>
    );
}
