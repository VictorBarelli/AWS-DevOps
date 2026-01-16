import { motion } from 'framer-motion';

export default function FiltersTab({
    genres,
    selectedGenres,
    showAdult,
    releaseYear,
    onGenreToggle,
    onToggleAdult,
    onReleaseYearChange,
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

            {/* Year Filter */}
            <div className="year-section" style={{ marginBottom: '24px' }}>
                <h3>Ano de Lançamento</h3>
                <div className="year-options" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {[
                        { label: 'Todos', value: '' },
                        { label: '2025', value: '2025-01-01,2025-12-31' },
                        { label: '2024', value: '2024-01-01,2024-12-31' },
                        { label: '2023', value: '2023-01-01,2023-12-31' },
                        { label: '2020-22', value: '2020-01-01,2022-12-31' },
                        { label: 'Anos 2010', value: '2010-01-01,2019-12-31' },
                        { label: 'Anos 2000', value: '2000-01-01,2009-12-31' },
                        { label: 'Retrô', value: '1950-01-01,1999-12-31' }
                    ].map(opt => (
                        <button
                            key={opt.label}
                            onClick={() => onReleaseYearChange(opt.value)}
                            style={{
                                padding: '8px 12px',
                                borderRadius: '20px',
                                border: '1px solid var(--border-color)',
                                background: releaseYear === opt.value ? 'var(--accent-primary)' : 'rgba(255,255,255,0.05)',
                                color: releaseYear === opt.value ? 'white' : 'var(--text-secondary)',
                                fontSize: '0.85rem',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            {opt.label}
                        </button>
                    ))}
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
