export default function FilterPanel({
    genres,
    selectedGenres,
    showAdult,
    onGenreChange,
    onToggleAdult,
    onClearFilters,
    user,
    onLogout,
    onOpenAdmin,
    isOpen,      // Mobile: is drawer open
    onClose      // Mobile: close drawer
}) {
    return (
        <div className={`panel filter-panel ${isOpen ? 'open' : ''}`}>
            {/* Logo */}
            <div className="logo">
                <span className="logo-icon">🎮</span>
                <span className="logo-text">GameSwipe</span>
            </div>

            {/* User Info */}
            {user && (
                <div className="user-info">
                    <div className="user-avatar">
                        {user.name?.charAt(0).toUpperCase() || '?'}
                    </div>
                    <div className="user-details">
                        <span className="user-name">{user.name}</span>
                        <div className="user-actions">
                            {user.role === 'admin' && (
                                <button className="admin-link" onClick={onOpenAdmin}>
                                    👑 Admin
                                </button>
                            )}
                            <button className="logout-btn" onClick={onLogout}>
                                Sair
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="filter-section">
                <h3 className="filter-title">Preferências</h3>
                <div className="filter-options">
                    <label className={`filter-option ${showAdult ? 'active' : ''}`}>
                        <input
                            type="checkbox"
                            checked={showAdult}
                            onChange={onToggleAdult}
                        />
                        <span className="filter-checkbox"></span>
                        <span className="filter-label">🔞 Conteúdo Adulto (+18)</span>
                    </label>
                </div>
            </div>

            {/* Genres Filter */}
            <div className="filter-section">
                <h3 className="filter-title">Gêneros</h3>
                <div className="filter-options">
                    {genres.map(genre => (
                        <label
                            key={genre.id}
                            className={`filter-option ${selectedGenres.includes(genre.slug) ? 'active' : ''}`}
                        >
                            <input
                                type="checkbox"
                                checked={selectedGenres.includes(genre.slug)}
                                onChange={() => onGenreChange(genre.slug)}
                            />
                            <span className="filter-checkbox"></span>
                            <span className="filter-label">{genre.name}</span>
                        </label>
                    ))}
                </div>
            </div>

            {/* Clear Filters */}
            {selectedGenres.length > 0 && (
                <button className="clear-filters-btn" onClick={onClearFilters}>
                    Limpar filtros ({selectedGenres.length})
                </button>
            )}

            {/* Instructions */}
            <div style={{
                marginTop: 'auto',
                paddingTop: '24px',
                borderTop: '1px solid var(--border-color)',
                fontSize: 'var(--font-size-xs)',
                color: 'var(--text-muted)',
                lineHeight: 1.6
            }}>
                <p style={{ marginBottom: '8px' }}>
                    <strong style={{ color: 'var(--text-secondary)' }}>Como jogar:</strong>
                </p>
                <p>👉 Arraste para <span style={{ color: 'var(--accent-like)' }}>direita</span> = Quero jogar!</p>
                <p>👈 Arraste para <span style={{ color: 'var(--accent-nope)' }}>esquerda</span> = Não curti</p>
            </div>
        </div>
    );
}
