import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import { fetchGames } from '../services/rawgApi';

export default function ReviewsTab({ user }) {
    const [activeView, setActiveView] = useState('feed'); // 'feed' | 'write' | 'my'
    const [reviews, setReviews] = useState([]);
    const [myReviews, setMyReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    // Write review state
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [selectedGame, setSelectedGame] = useState(null);
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [isPublic, setIsPublic] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [searchLoading, setSearchLoading] = useState(false);

    useEffect(() => {
        loadFeed();
    }, []);

    const loadFeed = async () => {
        try {
            setLoading(true);
            const data = await api.getReviewsFeed(1);
            setReviews(data.reviews || []);
            setHasMore(data.page < data.totalPages);
            setPage(1);
        } catch (err) {
            console.error('Error loading feed:', err);
        } finally {
            setLoading(false);
        }
    };

    const loadMore = async () => {
        if (!hasMore) return;
        try {
            const nextPage = page + 1;
            const data = await api.getReviewsFeed(nextPage);
            setReviews(prev => [...prev, ...(data.reviews || [])]);
            setHasMore(data.page < data.totalPages);
            setPage(nextPage);
        } catch (err) {
            console.error('Error loading more:', err);
        }
    };

    const loadMyReviews = async () => {
        try {
            setLoading(true);
            const data = await api.getMyReviews();
            setMyReviews(data || []);
        } catch (err) {
            console.error('Error loading my reviews:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;
        try {
            setSearchLoading(true);
            const data = await fetchGames({ search: searchQuery, pageSize: 10 });
            setSearchResults(data.games || []);
        } catch (err) {
            console.error('Error searching games:', err);
        } finally {
            setSearchLoading(false);
        }
    };

    const handleSelectGame = (game) => {
        setSelectedGame(game);
        setSearchResults([]);
        setSearchQuery('');
    };

    const handleSubmitReview = async () => {
        if (!selectedGame || rating === 0) return;

        try {
            setSubmitting(true);
            await api.createReview({
                game_id: selectedGame.id,
                game_name: selectedGame.name,
                game_image: selectedGame.image,
                rating,
                comment,
                is_public: isPublic
            });

            // Reset form
            setSelectedGame(null);
            setRating(0);
            setComment('');
            setIsPublic(true);

            // Reload feed
            await loadFeed();
            setActiveView('feed');
        } catch (err) {
            console.error('Error submitting review:', err);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteReview = async (reviewId) => {
        if (!window.confirm('Tem certeza que deseja excluir esta avaliação?')) return;
        try {
            await api.deleteReview(reviewId);
            setMyReviews(prev => prev.filter(r => r.id !== reviewId));
            loadFeed();
        } catch (err) {
            console.error('Error deleting review:', err);
        }
    };

    const renderStars = (count, interactive = false, onSelect = null) => {
        return (
            <div className="stars-container">
                {[1, 2, 3, 4, 5].map(star => (
                    <span
                        key={star}
                        className={`star ${star <= count ? 'filled' : ''} ${interactive ? 'interactive' : ''}`}
                        onClick={() => interactive && onSelect && onSelect(star)}
                    >
                        ★
                    </span>
                ))}
            </div>
        );
    };

    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    return (
        <div className="tab-content reviews-tab">
            {/* Tab Navigation */}
            <div className="reviews-nav">
                <button
                    className={`reviews-nav-btn ${activeView === 'feed' ? 'active' : ''}`}
                    onClick={() => { setActiveView('feed'); loadFeed(); }}
                >
                    🌍 Comunidade
                </button>
                <button
                    className={`reviews-nav-btn ${activeView === 'write' ? 'active' : ''}`}
                    onClick={() => setActiveView('write')}
                >
                    ✍️ Avaliar
                </button>
                <button
                    className={`reviews-nav-btn ${activeView === 'my' ? 'active' : ''}`}
                    onClick={() => { setActiveView('my'); loadMyReviews(); }}
                >
                    📋 Minhas
                </button>
            </div>

            {/* Feed View */}
            {activeView === 'feed' && (
                <div className="reviews-feed">
                    {loading ? (
                        <div className="loading">
                            <div className="loading-spinner"></div>
                            <p>Carregando reviews...</p>
                        </div>
                    ) : reviews.length === 0 ? (
                        <div className="reviews-empty">
                            <h3>🎮 Nenhuma avaliação ainda</h3>
                            <p>Seja o primeiro a avaliar um jogo!</p>
                            <button onClick={() => setActiveView('write')}>
                                ✍️ Escrever avaliação
                            </button>
                        </div>
                    ) : (
                        <>
                            {reviews.map(review => (
                                <motion.div
                                    key={review.id}
                                    className="review-card"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                >
                                    <div className="review-header">
                                        <div className="review-user">
                                            <div className="review-avatar">
                                                {review.user_avatar ? (
                                                    <img src={review.user_avatar} alt="" />
                                                ) : (
                                                    <span>{review.user_name?.[0]?.toUpperCase() || '?'}</span>
                                                )}
                                            </div>
                                            <div className="review-user-info">
                                                <span className="review-user-name">{review.user_name || 'Anônimo'}</span>
                                                <span className="review-date">{formatDate(review.created_at)}</span>
                                            </div>
                                        </div>
                                        {renderStars(review.rating)}
                                    </div>

                                    <div className="review-game">
                                        {review.game_image && (
                                            <img src={review.game_image} alt={review.game_name} className="review-game-image" />
                                        )}
                                        <span className="review-game-name">{review.game_name}</span>
                                    </div>

                                    {review.comment && (
                                        <p className="review-comment">{review.comment}</p>
                                    )}
                                </motion.div>
                            ))}

                            {hasMore && (
                                <button className="load-more-btn" onClick={loadMore}>
                                    Carregar mais
                                </button>
                            )}
                        </>
                    )}
                </div>
            )}

            {/* Write Review View */}
            {activeView === 'write' && (
                <div className="review-form">
                    <h3>✍️ Escrever Avaliação</h3>

                    {!selectedGame ? (
                        <div className="game-search">
                            <div className="search-input-group">
                                <input
                                    type="text"
                                    placeholder="Pesquisar jogo..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                />
                                <button onClick={handleSearch} disabled={searchLoading}>
                                    {searchLoading ? '...' : '🔍'}
                                </button>
                            </div>

                            {searchResults.length > 0 && (
                                <div className="search-results">
                                    {searchResults.map(game => (
                                        <div
                                            key={game.id}
                                            className="search-result-item"
                                            onClick={() => handleSelectGame(game)}
                                        >
                                            {game.image && (
                                                <img src={game.image} alt={game.name} />
                                            )}
                                            <div className="search-result-info">
                                                <span className="search-result-name">{game.name}</span>
                                                <span className="search-result-genres">
                                                    {game.genres?.slice(0, 2).join(', ')}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="selected-game">
                            <div className="selected-game-header">
                                {selectedGame.image && (
                                    <img src={selectedGame.image} alt={selectedGame.name} />
                                )}
                                <div className="selected-game-info">
                                    <h4>{selectedGame.name}</h4>
                                    <button onClick={() => setSelectedGame(null)}>✕ Trocar</button>
                                </div>
                            </div>

                            <div className="rating-section">
                                <label>Sua nota:</label>
                                {renderStars(rating, true, setRating)}
                            </div>

                            <div className="comment-section">
                                <label>Comentário (opcional):</label>
                                <textarea
                                    placeholder="O que você achou do jogo?"
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    rows={4}
                                />
                            </div>

                            <div className="visibility-section">
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={isPublic}
                                        onChange={(e) => setIsPublic(e.target.checked)}
                                    />
                                    Publicar na comunidade
                                </label>
                            </div>

                            <button
                                className="submit-review-btn"
                                onClick={handleSubmitReview}
                                disabled={rating === 0 || submitting}
                            >
                                {submitting ? 'Enviando...' : '📝 Publicar Avaliação'}
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* My Reviews View */}
            {activeView === 'my' && (
                <div className="my-reviews">
                    {loading ? (
                        <div className="loading">
                            <div className="loading-spinner"></div>
                            <p>Carregando suas avaliações...</p>
                        </div>
                    ) : myReviews.length === 0 ? (
                        <div className="reviews-empty">
                            <h3>📋 Você ainda não avaliou nenhum jogo</h3>
                            <button onClick={() => setActiveView('write')}>
                                ✍️ Escrever primeira avaliação
                            </button>
                        </div>
                    ) : (
                        myReviews.map(review => (
                            <motion.div
                                key={review.id}
                                className="review-card my-review"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                <div className="review-header">
                                    <div className="review-game">
                                        {review.game_image && (
                                            <img src={review.game_image} alt={review.game_name} className="review-game-image" />
                                        )}
                                        <span className="review-game-name">{review.game_name}</span>
                                    </div>
                                    {renderStars(review.rating)}
                                </div>

                                {review.comment && (
                                    <p className="review-comment">{review.comment}</p>
                                )}

                                <div className="review-footer">
                                    <span className="review-date">{formatDate(review.created_at)}</span>
                                    <span className={`review-visibility ${review.is_public ? 'public' : 'private'}`}>
                                        {review.is_public ? '🌍 Público' : '🔒 Privado'}
                                    </span>
                                    <button
                                        className="delete-review-btn"
                                        onClick={() => handleDeleteReview(review.id)}
                                    >
                                        🗑️
                                    </button>
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
