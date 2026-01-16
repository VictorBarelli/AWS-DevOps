import { AnimatePresence } from 'framer-motion';
import SwipeCard from './SwipeCard';

export default function HomeTab({
    loading,
    currentCards,
    onSwipe,
    onCardClick,
    onRefresh,
    onButtonSwipe
}) {
    if (loading) {
        return (
            <div className="tab-content home-tab">
                <div className="loading">
                    <div className="loading-spinner"></div>
                    <p>Carregando jogos...</p>
                </div>
            </div>
        );
    }

    if (currentCards.length === 0) {
        return (
            <div className="tab-content home-tab">
                <div className="no-more-cards">
                    <h3>🎮 Fim dos jogos!</h3>
                    <p>Você viu todos os jogos disponíveis com esses filtros.</p>
                    <button className="refresh-btn" onClick={onRefresh}>
                        🔄 Ver novamente
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="tab-content home-tab">
            <div className="card-container">
                <AnimatePresence>
                    {currentCards.map((game, i) => (
                        <SwipeCard
                            key={game.id}
                            game={game}
                            onSwipe={onSwipe}
                            isTop={i === 0}
                            onCardClick={(g) => onCardClick(g.id)}
                        />
                    ))}
                </AnimatePresence>
            </div>

            <div className="action-buttons">
                <button
                    className="action-btn nope"
                    onClick={() => onButtonSwipe('left')}
                    title="Não curti"
                >
                    ✕
                </button>
                <button
                    className="action-btn info"
                    onClick={() => onCardClick(currentCards[0]?.id)}
                    title="Ver detalhes"
                >
                    ℹ
                </button>
                <button
                    className="action-btn like"
                    onClick={() => onButtonSwipe('right')}
                    title="Quero jogar!"
                >
                    ♥
                </button>
            </div>
        </div>
    );
}
