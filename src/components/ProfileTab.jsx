import { useState } from 'react';
import { motion } from 'framer-motion';
import ReviewsTab from './ReviewsTab';
import api from '../services/api';

export default function ProfileTab({ user, profile, onLogout, onOpenAdmin }) {
    const [activeSection, setActiveSection] = useState('info');
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState(profile?.name || '');
    const [updating, setUpdating] = useState(false);

    const isAdmin = profile?.role === 'admin';

    const handleUpdateProfile = async () => {
        if (!editName.trim()) return;
        setUpdating(true);
        try {
            await api.updateProfile(editName);
            // Reload page to refresh profile
            window.location.reload();
        } catch (error) {
            console.error('Failed to update profile:', error);
            alert('Erro ao atualizar perfil');
        } finally {
            setUpdating(false);
            setIsEditing(false);
        }
    };

    return (
        <div className="tab-content profile-tab">
            <div className="profile-header">
                <div className="profile-avatar">
                    {profile?.avatar_url ? (
                        <img src={profile.avatar_url} alt="" />
                    ) : (
                        <span>{profile?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || '?'}</span>
                    )}
                </div>
                <div className="profile-info">
                    {isEditing ? (
                        <div className="profile-edit-form">
                            <input
                                type="text"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                placeholder="Seu nome"
                                className="profile-name-input"
                                autoFocus
                            />
                            <div className="profile-edit-actions">
                                <button
                                    className="save-btn"
                                    onClick={handleUpdateProfile}
                                    disabled={updating}
                                >
                                    {updating ? '...' : '💾'}
                                </button>
                                <button
                                    className="cancel-btn"
                                    onClick={() => {
                                        setIsEditing(false);
                                        setEditName(profile?.name || '');
                                    }}
                                >
                                    ✕
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="profile-name-container">
                            <h2>{profile?.name || user?.email?.split('@')[0] || 'Usuário'}</h2>
                            <button
                                className="edit-profile-btn"
                                onClick={() => {
                                    setIsEditing(true);
                                    setEditName(profile?.name || '');
                                }}
                                title="Editar nome"
                            >
                                ✏️
                            </button>
                        </div>
                    )}
                    <p>{user?.email}</p>
                    {isAdmin && <span className="admin-badge">Admin</span>}
                </div>
            </div>

            <div className="profile-nav">
                <button
                    className={activeSection === 'info' ? 'active' : ''}
                    onClick={() => setActiveSection('info')}
                >
                    👤 Perfil
                </button>
                <button
                    className={activeSection === 'reviews' ? 'active' : ''}
                    onClick={() => setActiveSection('reviews')}
                >
                    ⭐ Reviews
                </button>
            </div>

            {activeSection === 'info' && (
                <div className="profile-content">
                    <div className="profile-stats">
                        <div className="stat-item">
                            <span className="stat-value">0</span>
                            <span className="stat-label">Jogos Curtidos</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-value">0</span>
                            <span className="stat-label">Reviews</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-value">0</span>
                            <span className="stat-label">Grupos</span>
                        </div>
                    </div>

                    <div className="profile-actions">
                        {isAdmin && (
                            <button className="profile-action-btn admin" onClick={onOpenAdmin}>
                                🛡️ Admin Panel
                            </button>
                        )}
                    </div>
                </div>
            )}

            {activeSection === 'reviews' && (
                <ReviewsTab user={user} />
            )}
        </div>
    );
}
