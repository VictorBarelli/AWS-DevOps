import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getAllUsers, updateUserRole, deleteUser, getMatchStats } from '../services/supabase';

export default function AdminPanel({ user, onClose }) {
    const [users, setUsers] = useState([]);
    const [stats, setStats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('users');
    const [error, setError] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [usersData, statsData] = await Promise.all([
                getAllUsers(),
                getMatchStats()
            ]);
            setUsers(usersData || []);
            setStats(statsData || []);
        } catch (err) {
            console.error('Error loading admin data:', err);
            setError('Erro ao carregar dados');
        } finally {
            setLoading(false);
        }
    };

    const handleRoleChange = async (userId, newRole) => {
        try {
            await updateUserRole(userId, newRole);
            setUsers(users.map(u =>
                u.id === userId ? { ...u, role: newRole } : u
            ));
        } catch (err) {
            console.error('Error updating role:', err);
            setError('Erro ao atualizar role');
        }
    };

    const handleDeleteUser = async (userId) => {
        if (!confirm('Tem certeza que deseja excluir este usuário?')) return;

        try {
            await deleteUser(userId);
            setUsers(users.filter(u => u.id !== userId));
        } catch (err) {
            console.error('Error deleting user:', err);
            setError('Erro ao excluir usuário');
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
                        👥 Usuários ({users.length})
                    </button>
                    <button
                        className={`admin-tab ${activeTab === 'stats' ? 'active' : ''}`}
                        onClick={() => setActiveTab('stats')}
                    >
                        📊 Estatísticas
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
