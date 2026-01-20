import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { fetchGenres } from '../services/rawgApi';

export default function OnboardingPreferences({ onComplete }) {
    const [genres, setGenres] = useState([]);
    const [selectedGenres, setSelectedGenres] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchGenres()
            .then(data => {
                setGenres(data);
                setLoading(false);
            })
            .catch(err => {
                console.error('Error fetching genres:', err);
                setLoading(false);
            });
    }, []);

    const toggleGenre = (slug) => {
        setSelectedGenres(prev =>
            prev.includes(slug)
                ? prev.filter(s => s !== slug)
                : [...prev, slug]
        );
    };

    const handleContinue = async () => {
        setSaving(true);

        try {
            // Save to localStorage
            localStorage.setItem('gameswipe_preferences', JSON.stringify(selectedGenres));
            localStorage.setItem('gameswipe_onboarding_complete', 'true');

            onComplete(selectedGenres);
        } catch (err) {
            console.error('Error saving preferences:', err);
            localStorage.setItem('gameswipe_preferences', JSON.stringify(selectedGenres));
            localStorage.setItem('gameswipe_onboarding_complete', 'true');
            onComplete(selectedGenres);
        }
    };

    const handleSkip = () => {
        localStorage.setItem('gameswipe_onboarding_complete', 'true');
        onComplete([]);
    };

    return (
        <div className="onboarding-page">
            <div className="onboarding-bg-decoration"></div>

            <motion.div
                className="onboarding-container"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                {/* Header */}
                <div className="onboarding-header">
                    <span className="onboarding-icon">🎮</span>
                    <h1>Bem-vindo ao GameSwipe!</h1>
                    <p>Escolha seus gêneros favoritos para personalizar suas recomendações</p>
                </div>

                {/* Genres Grid */}
                {loading ? (
                    <div className="loading">
                        <div className="loading-spinner"></div>
                        <p>Carregando gêneros...</p>
                    </div>
                ) : (
                    <div className="onboarding-genres">
                        {genres.map((genre, index) => (
                            <motion.button
                                key={genre.id}
                                className={`genre-card ${selectedGenres.includes(genre.slug) ? 'selected' : ''}`}
                                onClick={() => toggleGenre(genre.slug)}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: index * 0.03 }}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <span className="genre-card-name">{genre.name}</span>
                                {selectedGenres.includes(genre.slug) && (
                                    <span className="genre-card-check">✓</span>
                                )}
                            </motion.button>
                        ))}
                    </div>
                )}

                {/* Selection count */}
                <p className="onboarding-count">
                    {selectedGenres.length} {selectedGenres.length === 1 ? 'gênero selecionado' : 'gêneros selecionados'}
                </p>

                {/* Actions */}
                <div className="onboarding-actions">
                    <button
                        className="onboarding-btn primary"
                        onClick={handleContinue}
                        disabled={saving}
                    >
                        {saving ? (
                            <span className="btn-loading"></span>
                        ) : (
                            <>Começar a descobrir! 🚀</>
                        )}
                    </button>

                    <button
                        className="onboarding-btn secondary"
                        onClick={handleSkip}
                    >
                        Pular por agora
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
