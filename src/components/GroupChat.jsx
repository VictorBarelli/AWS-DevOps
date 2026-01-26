import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import api from '../services/api';

export default function GroupChat({ group, onClose, currentUserId }) {
    const [messages, setMessages] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [activeTab, setActiveTab] = useState('chat');
    const [editingId, setEditingId] = useState(null);
    const [editText, setEditText] = useState('');
    const messagesEndRef = useRef(null);

    useEffect(() => {
        loadData();
    }, [group.id]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [messagesData, reviewsData] = await Promise.all([
                api.getGroupMessages(group.id).catch(() => []),
                api.getGroupReviews(group.id).catch(() => [])
            ]);
            setMessages(messagesData || []);
            setReviews(reviewsData || []);
        } catch (err) {
            console.error('Error loading chat data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || sending) return;

        setSending(true);
        try {
            const result = await api.postGroupMessage(group.id, newMessage);
            setMessages(prev => [result, ...prev]);
            setNewMessage('');
        } catch (err) {
            console.error('Error sending message:', err);
            window.alert('Erro ao enviar mensagem');
        } finally {
            setSending(false);
        }
    };

    const handleEditMessage = async (messageId) => {
        if (!editText.trim()) return;
        try {
            await api.editMessage(messageId, editText);
            setMessages(prev => prev.map(msg =>
                msg.id === messageId ? { ...msg, message: editText } : msg
            ));
            setEditingId(null);
            setEditText('');
        } catch (err) {
            console.error('Error editing message:', err);
            window.alert('Erro ao editar mensagem');
        }
    };

    const handleDeleteMessage = async (messageId) => {
        if (!window.confirm('Tem certeza que deseja excluir esta mensagem?')) return;
        try {
            await api.deleteMessage(messageId);
            setMessages(prev => prev.filter(msg => msg.id !== messageId));
        } catch (err) {
            console.error('Error deleting message:', err);
            window.alert('Erro ao excluir mensagem');
        }
    };

    const startEditing = (msg) => {
        setEditingId(msg.id);
        setEditText(msg.message);
    };

    const cancelEditing = () => {
        setEditingId(null);
        setEditText('');
    };

    const formatTime = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getInitial = (name, email) => {
        return (name || email || '?')[0].toUpperCase();
    };

    const isOwnMessage = (msg) => {
        return msg.user_id === currentUserId;
    };

    return (
        <motion.div
            className="group-chat-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            <motion.div
                className="group-chat-container"
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
            >
                <div className="chat-header">
                    <div className="chat-group-info">
                        <h3>{group.name}</h3>
                        <span>{group.member_count || 0} membros</span>
                    </div>
                    <button className="chat-close-btn" onClick={onClose}>✕</button>
                </div>

                <div className="chat-tabs">
                    <button
                        className={activeTab === 'chat' ? 'active' : ''}
                        onClick={() => setActiveTab('chat')}
                    >
                        💬 Chat
                    </button>
                    <button
                        className={activeTab === 'reviews' ? 'active' : ''}
                        onClick={() => setActiveTab('reviews')}
                    >
                        🎮 Reviews ({reviews.length})
                    </button>
                </div>

                <div className="chat-content">
                    {loading ? (
                        <div className="chat-loading">
                            <div className="loading-spinner"></div>
                            <p>Carregando...</p>
                        </div>
                    ) : activeTab === 'chat' ? (
                        <>
                            <div className="chat-messages">
                                {messages.length === 0 ? (
                                    <div className="chat-empty">
                                        <p>Seja o primeiro a enviar uma mensagem!</p>
                                    </div>
                                ) : (
                                    messages.slice().reverse().map(msg => (
                                        <div key={msg.id} className={`chat-message ${isOwnMessage(msg) ? 'own' : ''}`}>
                                            <div className="message-avatar">
                                                {getInitial(msg.user_name, msg.user_email)}
                                            </div>
                                            <div className="message-content">
                                                <div className="message-header">
                                                    <span className="message-author">
                                                        {msg.user_name || msg.user_email?.split('@')[0]}
                                                    </span>
                                                    <span className="message-time">
                                                        {formatTime(msg.created_at)}
                                                    </span>
                                                </div>
                                                {editingId === msg.id ? (
                                                    <div className="message-edit-form">
                                                        <input
                                                            type="text"
                                                            value={editText}
                                                            onChange={(e) => setEditText(e.target.value)}
                                                            autoFocus
                                                        />
                                                        <div className="edit-actions">
                                                            <button onClick={() => handleEditMessage(msg.id)}>✓</button>
                                                            <button onClick={cancelEditing}>✕</button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <p className="message-text">{msg.message}</p>
                                                        {isOwnMessage(msg) && (
                                                            <div className="message-actions">
                                                                <button
                                                                    className="msg-action-btn"
                                                                    onClick={() => startEditing(msg)}
                                                                    title="Editar"
                                                                >
                                                                    ✏️
                                                                </button>
                                                                <button
                                                                    className="msg-action-btn delete"
                                                                    onClick={() => handleDeleteMessage(msg.id)}
                                                                    title="Excluir"
                                                                >
                                                                    🗑️
                                                                </button>
                                                            </div>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                                <div ref={messagesEndRef} />
                            </div>
                            <form className="chat-input-form" onSubmit={handleSendMessage}>
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Digite sua mensagem..."
                                    disabled={sending}
                                />
                                <button type="submit" disabled={sending || !newMessage.trim()}>
                                    {sending ? '...' : '➤'}
                                </button>
                            </form>
                        </>
                    ) : (
                        <div className="chat-reviews">
                            {reviews.length === 0 ? (
                                <div className="chat-empty">
                                    <p>Nenhuma review compartilhada neste grupo ainda.</p>
                                </div>
                            ) : (
                                reviews.map(review => (
                                    <div key={review.id} className="review-card">
                                        <div className="review-game-info">
                                            {review.game_image && (
                                                <img src={review.game_image} alt="" />
                                            )}
                                            <div>
                                                <h4>{review.game_name}</h4>
                                                <div className="review-rating">
                                                    {'⭐'.repeat(review.rating)}
                                                </div>
                                            </div>
                                        </div>
                                        <p className="review-comment">{review.comment}</p>
                                        <div className="review-footer">
                                            <span>{review.user_name || review.user_email?.split('@')[0]}</span>
                                            <span>{formatTime(review.created_at)}</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
}
