import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../services/api';

export default function ShareModal({ game, onClose }) {
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sharing, setSharing] = useState(false);
    const [message, setMessage] = useState('');
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadGroups();
    }, []);

    const loadGroups = async () => {
        try {
            const myGroups = await api.getMyGroups();
            setGroups(myGroups || []);
        } catch (err) {
            console.error('Error loading groups:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleShare = async (groupId) => {
        setSharing(true);
        setError(null);
        try {
            await api.postGroupReview(groupId, {
                game_id: game.id,
                game_name: game.name,
                game_image: game.image || game.background_image,
                rating: 5,
                comment: message || `Recomendo esse jogo: ${game.name}!`
            });
            setSuccess(true);
            setTimeout(() => {
                onClose();
            }, 1500);
        } catch (err) {
            console.error('Error sharing:', err);
            setError('Erro ao compartilhar');
        } finally {
            setSharing(false);
        }
    };

    if (!game) return null;

    return (
        <motion.div
            className="share-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
        >
            <motion.div
                className="share-modal"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="share-modal-header">
                    <h3>Compartilhar</h3>
                    <button className="close-btn" onClick={onClose}>X</button>
                </div>

                <div className="share-game-preview">
                    <img src={game.image} alt={game.name} />
                    <span>{game.name}</span>
                </div>

                <div className="share-message">
                    <input
                        type="text"
                        placeholder="Adicionar mensagem (opcional)"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                    />
                </div>

                {error && (
                    <div className="share-error">
                        {error}
                    </div>
                )}

                {success ? (
                    <div className="share-success">
                        Compartilhado com sucesso!
                    </div>
                {/* External Sharing Section */}
                <div className="share-external-section">
                    <button
                        className="share-external-btn primary"
                        onClick={async () => {
                            const shareData = {
                                title: 'GameSwipe',
                                text: `Olha esse jogo que achei no GameSwipe: ${game.name}! 🎮`,
                                url: window.location.origin
                            };
                            if (navigator.share) {
                                try {
                                    await navigator.share(shareData);
                                    setSuccess(true);
                                    setTimeout(() => onClose(), 2000);
                                } catch (err) {
                                    console.log('Error sharing:', err);
                                }
                            } else {
                                // Fallback to clipboard
                                navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
                                setSuccess(true);
                                alert('Link copiado para a área de transferência!');
                                setTimeout(() => onClose(), 2000);
                            }
                        }}
                    >
                        <span className="share-icon">📤</span>
                        <span className="share-label">
                            {navigator.share ? 'Compartilhar (WhatsApp/Insta)' : 'Copiar Link'}
                        </span>
                    </button>
                </div>

                <div className="share-divider">
                    <span>ou compartilhar em grupo interno</span>
                </div>

                {loading ? (
                    <div className="share-loading">Carregando grupos...</div>
                ) : groups.length === 0 ? (
                    <div className="share-empty">
                        <p>Voce nao esta em nenhum grupo ainda.</p>
                        <p>Entre em um grupo para compartilhar jogos internamente!</p>
                    </div>
                ) : (
                    <div className="share-groups">
                        <p className="share-groups-label">Seus grupos:</p>
                        {groups.map((group) => (
                            <button
                                key={group.id}
                                className="share-group-btn"
                                onClick={() => handleShare(group.id)}
                                disabled={sharing}
                            >
                                <span className="group-name">{group.name}</span>
                                <span className="group-members">{group.member_count} membros</span>
                            </button>
                        ))}
                    </div>
                )}
            </motion.div>
        </motion.div>
    );
}
