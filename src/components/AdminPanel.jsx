/* eslint-disable no-undef */
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../services/api';

export default function AdminPanel({ user, onClose }) {
    const [users, setUsers] = useState([]);
    const [stats, setStats] = useState([]);
    const [customGames, setCustomGames] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('users');
    const [error, setError] = useState('');

    // Form state for new game
    const [newGame, setNewGame] = useState({
        name: '',
        image: '',
        genres: '',
        rating: 4.0,
        description: ''
    });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [usersData, statsData, gamesData] = await Promise.all([
                api.getAllUsers(),
                api.getMatchStats(),
                api.getCustomGames().catch(() => [])
            ]);
            setUsers(usersData || []);
            setStats(statsData || []);
            setCustomGames(gamesData || []);
        } catch (err) {
            console.error('Error loading admin data:', err);
            setError('Erro ao carregar dados');
        } finally {
            setLoading(false);
        }
    };

    const handleRoleChange = async (userId, newRole) => {
        try {
            await api.updateUserRole(userId, newRole);
            setUsers(users.map(u =>
                u.id === userId ? { ...u, role: newRole } : u
            ));
        } catch (err) {
            console.error('Error updating role:', err);
            setError('Erro ao atualizar role');
        }
    };

    const handleDeleteUser = async (userId) => {
        if (!window.confirm('Tem certeza que deseja excluir este usuário?')) return;

        try {
            await api.deleteUser(userId);
            setUsers(users.filter(u => u.id !== userId));
        } catch (err) {
            console.error('Error deleting user:', err);
            setError('Erro ao excluir usuário');
        }
    };

    const handleAddGame = async (e) => {
        e.preventDefault();
        if (!newGame.name.trim()) {
            setError('Nome do jogo é obrigatório');
            return;
        }

        setSaving(true);
        try {
            const gameData = {
                name: newGame.name.trim(),
                image: newGame.image.trim() || null,
                genres: newGame.genres ? newGame.genres.split(',').map(g => g.trim()) : [],
                rating: parseFloat(newGame.rating) || 4.0,
                description: newGame.description.trim() || null
            };

            const created = await api.createCustomGame(gameData);
            setCustomGames([created, ...customGames]);
            setNewGame({ name: '', image: '', genres: '', rating: 4.0, description: '' });
            setError('');
        } catch (err) {
            console.error('Error creating game:', err);
            setError('Erro ao criar jogo');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteGame = async (gameId) => {
        if (!window.confirm('Tem certeza que deseja excluir este jogo?')) return;

        try {
            await api.deleteCustomGame(gameId);
            setCustomGames(customGames.filter(g => g.id !== gameId));
        } catch (err) {
            console.error('Error deleting game:', err);
            setError('Erro ao excluir jogo');
        }
    };

    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <motion.div
            className="admin-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            <motion.div
                className="admin-panel"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
            >
                {/* Header */}
                <div className="admin-header">
                    <h2>👑 Painel Admin</h2>
                    <button className="admin-close" onClick={onClose}>✕</button>
                </div>

                {/* Tabs */}
                <div className="admin-tabs">
                    <button
                        className={`admin-tab ${activeTab === 'users' ? 'active' : ''}`}
                        onClick={() => setActiveTab('users')}
                    >
                        👥 Usuários
                    </button>
                    <button
                        className={`admin-tab ${activeTab === 'games' ? 'active' : ''}`}
                        onClick={() => setActiveTab('games')}
                    >
                        🎮 Jogos
                    </button>
                    <button
                        className={`admin-tab ${activeTab === 'stats' ? 'active' : ''}`}
                        onClick={() => setActiveTab('stats')}
                    >
                        📊 Stats
                    </button>
                </div>

                {/* Content */}
                <div className="admin-content">
                    {loading ? (
                        <div className="loading">
                            <div className="loading-spinner"></div>
                            <p>Carregando...</p>
                        </div>
                    ) : error ? (
                        <div className="form-error">{error}</div>
                    ) : activeTab === 'users' ? (
                        <div className="admin-users">
                            {users.length === 0 ? (
                                <p className="admin-empty">Nenhum usuário cadastrado</p>
                            ) : (
                                <table className="admin-table">
                                    <thead>
                                        <tr>
                                            <th>Nome</th>
                                            <th>Email</th>
                                            <th>Role</th>
                                            <th>Criado em</th>
                                            <th>Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {users.map(u => (
                                            <tr key={u.id}>
                                                <td>{u.name || '-'}</td>
                                                <td>{u.email}</td>
                                                <td>
                                                    <select
                                                        value={u.role}
                                                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                                                        disabled={u.id === user.id}
                                                        className="admin-select"
                                                    >
                                                        <option value="user">User</option>
                                                        <option value="admin">Admin</option>
                                                    </select>
                                                </td>
                                                <td>{formatDate(u.created_at)}</td>
                                                <td>
                                                    {u.id !== user.id && (
                                                        <button
                                                            className="admin-delete-btn"
                                                            onClick={() => handleDeleteUser(u.id)}
                                                        >
                                                            🗑️
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    ) : activeTab === 'games' ? (
                        <div className="admin-games">
                            {/* Add Game Form */}
                            <form className="add-game-form" onSubmit={handleAddGame}>
                                <h3>➕ Adicionar Jogo</h3>
                                <div className="form-row">
                                    <input
                                        type="text"
                                        placeholder="Nome do jogo *"
                                        value={newGame.name}
                                        onChange={(e) => setNewGame({ ...newGame, name: e.target.value })}
                                        required
                                    />
                                    <input
                                        type="url"
                                        placeholder="URL da imagem"
                                        value={newGame.image}
                                        onChange={(e) => setNewGame({ ...newGame, image: e.target.value })}
                                    />
                                </div>
                                <div className="form-row">
                                    <input
                                        type="text"
                                        placeholder="Gêneros (separados por vírgula)"
                                        value={newGame.genres}
                                        onChange={(e) => setNewGame({ ...newGame, genres: e.target.value })}
                                    />
                                    <input
                                        type="number"
                                        placeholder="Rating"
                                        min="0"
                                        max="5"
                                        step="0.1"
                                        value={newGame.rating}
                                        onChange={(e) => setNewGame({ ...newGame, rating: e.target.value })}
                                    />
                                </div>
                                <textarea
                                    placeholder="Descrição"
                                    value={newGame.description}
                                    onChange={(e) => setNewGame({ ...newGame, description: e.target.value })}
                                    rows={2}
                                />
                                <button type="submit" disabled={saving} className="add-game-btn">
                                    {saving ? 'Salvando...' : '💾 Salvar Jogo'}
                                </button>
                            </form>

                            {/* Games List */}
                            <h3>📋 Jogos Customizados ({customGames.length})</h3>
                            {customGames.length === 0 ? (
                                <p className="admin-empty">Nenhum jogo customizado ainda</p>
                            ) : (
                                <div className="games-list">
                                    {customGames.map(game => (
                                        <div key={game.id} className="game-item">
                                            {game.image && (
                                                <img src={game.image} alt="" className="game-thumb" />
                                            )}
                                            <div className="game-info">
                                                <span className="game-name">{game.name}</span>
                                                <span className="game-genres">
                                                    {game.genres?.join(', ') || 'Sem gênero'}
                                                </span>
                                            </div>
                                            <span className="game-rating">⭐ {game.rating}</span>
                                            <button
                                                className="admin-delete-btn"
                                                onClick={() => handleDeleteGame(game.id)}
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="admin-stats">
                            <h3>🎮 Top 10 Jogos Mais Curtidos</h3>
                            {stats.length === 0 ? (
                                <p className="admin-empty">Nenhum match registrado ainda</p>
                            ) : (
                                <div className="stats-list">
                                    {stats.map((stat, i) => (
                                        <div key={i} className="stat-item">
                                            <span className="stat-rank">#{i + 1}</span>
                                            <span className="stat-name">{stat.name}</span>
                                            <span className="stat-count">{stat.count} ❤️</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Refresh button */}
                <button className="admin-refresh" onClick={loadData}>
                    🔄 Atualizar
                </button>
            </motion.div>
        </motion.div>
    );
}
