import { motion } from 'framer-motion';

export default function FiltersTab({
    genres,
    selectedGenres,
    showAdult,
    onGenreToggle,
    onToggleAdult,
    onClearFilters,
    user,
    profile,
    onLogout,
    onOpenAdmin
}) {
    return (
        <div className="tab-content filters-tab">
            <div className="filters-header">
                <h2>Filtros e Preferências</h2>
                <p>Personalize sua experiência de descoberta de jogos</p>
            </div>

            {/* User Info Section */}
            <div className="user-section">
                <div className="user-info">
                    <div className="user-avatar">
                        {user?.user_metadata?.avatar_url ? (
                            <img src={user.user_metadata.avatar_url} alt="Avatar" />
                        ) : (
                            <div className="avatar-placeholder">
                                {(profile?.name || user?.email)?.[0]?.toUpperCase()}
                            </div>
                        )}
                    </div>
                    <div className="user-details">
                        <h3>{profile?.name || user?.user_metadata?.name || user?.email}</h3>
                        <p>{user?.email}</p>
                        {profile?.role === 'admin' && (
                            <span className="role-badge">Admin</span>
                        )}
                    </div>
                </div>

                <div className="user-actions">
                    {profile?.role === 'admin' && (
                        <button className="admin-btn" onClick={onOpenAdmin}>
                            👑 Admin Panel
                        </button>
                    )}
                    <button className="logout-btn" onClick={onLogout}>
                        🚪 Sair
                    </button>
                </div>
            </div>

            {/* Content Preferences */}
            <div className="preferences-section" style={{ marginBottom: '24px' }}>
                <h3>Preferências de Conteúdo</h3>
                <div
                    className={`preference-toggle ${showAdult ? 'active' : ''}`}
                    onClick={onToggleAdult}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '16px',
                        background: 'var(--bg-card)',
                        borderRadius: 'var(--border-radius-md)',
                        cursor: 'pointer',
                        marginTop: '12px',
                        border: showAdult ? '1px solid var(--accent-primary)' : '1px solid transparent'
                    }}
                >
                    <div className="toggle-checkbox" style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '6px',
                        border: '2px solid var(--text-muted)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: showAdult ? 'var(--accent-primary)' : 'transparent',
                        borderColor: showAdult ? 'var(--accent-primary)' : 'var(--text-muted)',
                        transition: 'all 0.2s'
                    }}>
                        {showAdult && <span style={{ color: 'white', fontSize: '14px' }}>✓</span>}
                    </div>
                    <div className="toggle-info">
                        <div className="toggle-label" style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                            🔞 Conteúdo Adulto (+18)
                        </div>
                        <div className="toggle-desc" style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                            Habilita jogos com tags Nudity e Sexual Content
                        </div>
                    </div>
                </div>
            </div>

            {/* Genres Filter */}
            <div className="genres-section">
                <div className="genres-header">
                    <h3>Gêneros de Jogos</h3>
                    {selectedGenres.length > 0 && (
                        <button className="clear-btn" onClick={onClearFilters}>
                            Limpar ({selectedGenres.length})
                        </button>
                    )}
                </div>

                <div className="genres-grid">
                    {genres.map((genre) => {
                        const isSelected = selectedGenres.includes(genre.slug);
                        return (
                            <motion.button
                                key={genre.id}
                                className={`genre-chip ${isSelected ? 'selected' : ''}`}
                                onClick={() => onGenreToggle(genre.slug)}
                                whileTap={{ scale: 0.95 }}
                            >
                                <span className="genre-name">{genre.name}</span>
                                {isSelected && <span className="check-icon">✓</span>}
                            </motion.button>
                        );
                    })}
                </div>
            </div>

            {/* Stats Section */}
            <div className="stats-section">
                <h3>Estatísticas</h3>
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-value">{selectedGenres.length}</div>
                        <div className="stat-label">Gêneros Selecionados</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
