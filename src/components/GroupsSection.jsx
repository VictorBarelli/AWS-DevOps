import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../services/api';

export default function GroupsSection({ user, onSelectGroup }) {
    const [groups, setGroups] = useState([]);
    const [myGroups, setMyGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeView, setActiveView] = useState('my'); // Start with 'my' groups

    useEffect(() => {
        loadGroups();
    }, []);

    const loadGroups = async () => {
        try {
            setLoading(true);
            const [allGroups, userGroups] = await Promise.all([
                api.getGroups(),
                api.getMyGroups()
            ]);
            setGroups(allGroups || []);
            setMyGroups(userGroups || []);
        } catch (err) {
            console.error('Error loading groups:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleJoin = async (groupId) => {
        try {
            await api.joinGroup(groupId);
            loadGroups(); // Refresh
        } catch (err) {
            console.error('Error joining group:', err);
        }
    };

    const handleLeave = async (groupId) => {
        try {
            await api.leaveGroup(groupId);
            loadGroups(); // Refresh
        } catch (err) {
            console.error('Error leaving group:', err);
        }
    };

    const isJoined = (groupId) => {
        return myGroups.some(g => g.id === groupId);
    };

    const getGenreEmoji = (genre) => {
        const emojis = {
            'Action': '⚔️',
            'RPG': '🧙',
            'Adventure': '🗺️',
            'Indie': '💎',
            'Strategy': '♟️',
            'Shooter': '🔫',
            'Puzzle': '🧩',
            'Racing': '🏎️',
            'Sports': '⚽',
            'Horror': '👻'
        };
        return emojis[genre] || '🎮';
    };

    if (loading) {
        return (
            <div className="groups-loading">
                <div className="loading-spinner"></div>
                <p>Carregando grupos...</p>
            </div>
        );
    }

    const displayGroups = activeView === 'my' ? myGroups : groups;

    return (
        <div className="groups-section">
            <div className="groups-header">
                <h3>👥 Comunidades</h3>
                <div className="groups-toggle">
                    <button
                        className={activeView === 'my' ? 'active' : ''}
                        onClick={() => setActiveView('my')}
                    >
                        Meus Grupos ({myGroups.length})
                    </button>
                    <button
                        className={activeView === 'all' ? 'active' : ''}
                        onClick={() => setActiveView('all')}
                    >
                        Todos
                    </button>
                </div>
            </div>

            {displayGroups.length === 0 ? (
                <div className="groups-empty">
                    {activeView === 'my' ? (
                        <div className="empty-state-centered">
                            <div className="empty-icon">👥</div>
                            <h4>Você ainda não está em nenhum grupo</h4>
                            <p>Entre em um grupo para participar de discussões!</p>
                            <button
                                className="join-group-btn"
                                onClick={() => setActiveView('all')}
                            >
                                🔍 Explorar Grupos
                            </button>
                        </div>
                    ) : (
                        <p>Nenhum grupo disponível</p>
                    )}
                </div>
            ) : (
                <div className="groups-grid">
                    {displayGroups.map(group => (
                        <motion.div
                            key={group.id}
                            className="group-card"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            whileHover={{ scale: 1.02 }}
                            onClick={() => onSelectGroup && onSelectGroup(group)}
                        >
                            <div className="group-emoji">
                                {getGenreEmoji(group.genre)}
                            </div>
                            <div className="group-info">
                                <h4>{group.name}</h4>
                                <p className="group-desc">{group.description}</p>
                                <div className="group-meta">
                                    <span className="group-genre">{group.genre}</span>
                                    <span className="group-members">
                                        👥 {group.member_count || 0}
                                    </span>
                                </div>
                            </div>
                            <button
                                className={`group-join-btn ${isJoined(group.id) ? 'joined' : ''}`}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    isJoined(group.id) ? handleLeave(group.id) : handleJoin(group.id);
                                }}
                            >
                                {isJoined(group.id) ? '✓ Membro' : '+ Entrar'}
                            </button>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}
