import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { api } from '../services/api';

export default function AdminPanel({ user, onClose }) {
    const [users, setUsers] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('users');
    const [error, setError] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            setError('');
            const [usersData, statsData] = await Promise.all([
                api.getAllUsers(),
                api.getStats()
            ]);
            setUsers(usersData || []);
            setStats(statsData || null);
        } catch (err) {
            console.error('Error loading admin data:', err);
            setError('Erro ao carregar dados: ' + err.message);
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
                    <h2>Painel Admin</h2>
                    <button className="admin-close" onClick={onClose}>X</button>
                </div>

                {/* Tabs */}
                <div className="admin-tabs">
                    <button
                        className={`admin-tab ${activeTab === 'users' ? 'active' : ''}`}
                        onClick={() => setActiveTab('users')}
                    >
                        Usuarios ({users.length})
                    </button>
                    <button
                        className={`admin-tab ${activeTab === 'stats' ? 'active' : ''}`}
                        onClick={() => setActiveTab('stats')}
                    >
                        Estatisticas
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
                                <p className="admin-empty">Nenhum usuario cadastrado</p>
                            ) : (
                                <table className="admin-table">
                                    <thead>
                                        <tr>
                                            <th>Nome</th>
                                            <th>Email</th>
                                            <th>Role</th>
                                            <th>Criado em</th>
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
                                                        disabled={u.email === user.email}
                                                        className="admin-select"
                                                    >
                                                        <option value="user">User</option>
                                                        <option value="admin">Admin</option>
                                                    </select>
                                                </td>
                                                <td>{formatDate(u.created_at)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    ) : (
                        <div className="admin-stats">
                            <h3>Estatisticas Gerais</h3>
                            {stats ? (
                                <div className="stats-grid">
                                    <div className="stat-card">
                                        <div className="stat-value">{stats.totalUsers || 0}</div>
                                        <div className="stat-label">Total de Usuarios</div>
                                    </div>
                                    <div className="stat-card">
                                        <div className="stat-value">{stats.totalMatches || 0}</div>
                                        <div className="stat-label">Total de Matches</div>
                                    </div>
                                    <div className="stat-card">
                                        <div className="stat-value">{stats.totalSuperLikes || 0}</div>
                                        <div className="stat-label">Super Likes</div>
                                    </div>
                                </div>
                            ) : (
                                <p className="admin-empty">Nenhuma estatistica disponivel</p>
                            )}
                        </div>
                    )}
                </div>

                {/* Refresh button */}
                <button className="admin-refresh" onClick={loadData}>
                    Atualizar
                </button>
            </motion.div>
        </motion.div>
    );
}
