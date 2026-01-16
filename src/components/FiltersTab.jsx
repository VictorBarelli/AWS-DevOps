import { motion } from 'framer-motion';

export default function FiltersTab({
    genres,
    selectedGenres,
    onGenreToggle,
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
