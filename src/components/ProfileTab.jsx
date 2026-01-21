import { useState } from 'react';
import { motion } from 'framer-motion';
import ReviewsTab from './ReviewsTab';

export default function ProfileTab({ user, profile, onLogout, onOpenAdmin }) {
    const [activeSection, setActiveSection] = useState('info');

    const isAdmin = profile?.role === 'admin';

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
                    <h2>{profile?.name || user?.email?.split('@')[0] || 'Usuário'}</h2>
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
                        <button className="profile-action-btn logout" onClick={onLogout}>
                            🚪 Sair
                        </button>
                    </div>
                </div>
            )}

            {activeSection === 'reviews' && (
                <ReviewsTab user={user} />
            )}
        </div>
    );
}
