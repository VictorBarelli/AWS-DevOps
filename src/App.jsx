import { useState, useEffect, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import SwipeCard from './components/SwipeCard';
import FilterPanel from './components/FilterPanel';
import MatchesList from './components/MatchesList';
import LoginPage from './components/LoginPage';
import AdminPanel from './components/AdminPanel';
import OnboardingPreferences from './components/OnboardingPreferences';
import GameDetailsModal from './components/GameDetailsModal';
import { fetchGames, fetchGenres } from './services/rawgApi';
import {
    supabase,
    getSession,
    getUserProfile,
    signOut,
    getUserMatches,
    saveMatch,
    removeMatch,
    createOrUpdateProfile
} from './services/supabase';

// LocalStorage keys (for demo mode)
const STORAGE_KEYS = {
    MATCHES: 'gameswipe_matches',
    FILTERS: 'gameswipe_filters',
    SEEN: 'gameswipe_seen'
};

export default function App() {
    // Auth State
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [session, setSession] = useState(null);
    const [authLoading, setAuthLoading] = useState(true);
    const [showAdmin, setShowAdmin] = useState(false);
    const [showOnboarding, setShowOnboarding] = useState(false);
    const [selectedGameId, setSelectedGameId] = useState(null);
    const [mobilePanel, setMobilePanel] = useState(null); // 'filters' | 'matches' | null

    // Game State
    const [games, setGames] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [genres, setGenres] = useState([]);
    const [selectedGenres, setSelectedGenres] = useState([]);
    const [matches, setMatches] = useState([]);
    const [seenIds, setSeenIds] = useState(new Set());
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    // Check for existing session on mount
    useEffect(() => {
        const initAuth = async () => {
            try {
                const session = await getSession();
                if (session?.user) {
                    setUser(session.user);
                    setSession(session);

                    // Create or get user profile (handles OAuth users)
                    await createOrUpdateProfile(session.user);

                    // Get user profile with role
                    let profile;
                    try {
                        profile = await getUserProfile(session.user.id);
                    } catch (e) {
                        // Profile might not exist yet for OAuth users
                        console.log('Profile not found, will be created');
                    }
                    setProfile(profile);

                    // Check if onboarding needed for new OAuth users
                    if (!profile?.onboarding_complete && !localStorage.getItem('gameswipe_onboarding_complete')) {
                        setShowOnboarding(true);
                    }

                    // Load user's matches from database
                    try {
                        const userMatches = await getUserMatches(session.user.id);
                        setMatches(userMatches.map(m => ({
                            id: m.game_id,
                            name: m.game_name,
                            image: m.game_image,
                            genres: m.game_genres,
                            rating: m.game_rating
                        })));
                    } catch (e) {
                        console.log('No matches found');
                    }
                }
            } catch (err) {
                console.error('Auth init error:', err);
            } finally {
                setAuthLoading(false);
            }
        };

        initAuth();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                if (event === 'SIGNED_OUT') {
                    setUser(null);
                    setProfile(null);
                    setSession(null);
                    setMatches([]);
                }
            }
        );

        return () => subscription.unsubscribe();
    }, []);

    // Handle login
    const handleLogin = async (userData, sessionData) => {
        setUser(userData);
        setSession(sessionData);

        if (sessionData && userData.id !== 'demo') {
            try {
                const profile = await getUserProfile(userData.id);
                setProfile(profile);

                // Check if onboarding is complete
                const onboardingComplete = profile?.onboarding_complete ||
                    localStorage.getItem('gameswipe_onboarding_complete') === 'true';

                if (!onboardingComplete) {
                    setShowOnboarding(true);
                } else if (profile?.preferences) {
                    setSelectedGenres(profile.preferences);
                }

                // Load matches from database
                const userMatches = await getUserMatches(userData.id);
                setMatches(userMatches.map(m => ({
                    id: m.game_id,
                    name: m.game_name,
                    image: m.game_image,
                    genres: m.game_genres,
                    rating: m.game_rating
                })));
            } catch (err) {
                console.error('Error loading profile:', err);
                // Check localStorage for onboarding
                const onboardingComplete = localStorage.getItem('gameswipe_onboarding_complete') === 'true';
                if (!onboardingComplete) {
                    setShowOnboarding(true);
                }
            }
        } else {
            // Demo mode - check localStorage
            const onboardingComplete = localStorage.getItem('gameswipe_onboarding_complete') === 'true';
            if (!onboardingComplete) {
                setShowOnboarding(true);
            } else {
                const savedPrefs = localStorage.getItem('gameswipe_preferences');
                if (savedPrefs) setSelectedGenres(JSON.parse(savedPrefs));
            }

            const savedMatches = localStorage.getItem(STORAGE_KEYS.MATCHES);
            if (savedMatches) setMatches(JSON.parse(savedMatches));
            setProfile({
                name: userData.user_metadata?.name || 'Visitante',
                role: 'user'
            });
        }
    };

    // Handle onboarding complete
    const handleOnboardingComplete = (preferences) => {
        setShowOnboarding(false);
        setSelectedGenres(preferences);
    };

    // Handle logout
    const handleLogout = async () => {
        try {
            if (session) {
                await signOut();
            }
            setUser(null);
            setProfile(null);
            setSession(null);
            setMatches([]);
        } catch (err) {
            console.error('Logout error:', err);
        }
    };

    // Load filters from localStorage
    useEffect(() => {
        const savedFilters = localStorage.getItem(STORAGE_KEYS.FILTERS);
        const savedSeen = localStorage.getItem(STORAGE_KEYS.SEEN);

        if (savedFilters) setSelectedGenres(JSON.parse(savedFilters));
        if (savedSeen) setSeenIds(new Set(JSON.parse(savedSeen)));
    }, []);

    // Save filters to localStorage
    useEffect(() => {
        localStorage.setItem(STORAGE_KEYS.FILTERS, JSON.stringify(selectedGenres));
    }, [selectedGenres]);

    // Save seen games to localStorage
    useEffect(() => {
        localStorage.setItem(STORAGE_KEYS.SEEN, JSON.stringify([...seenIds]));
    }, [seenIds]);

    // Save matches for demo mode
    useEffect(() => {
        if (user?.id === 'demo') {
            localStorage.setItem(STORAGE_KEYS.MATCHES, JSON.stringify(matches));
        }
    }, [matches, user]);

    // Fetch genres on mount
    useEffect(() => {
        fetchGenres()
            .then(setGenres)
            .catch(console.error);
    }, []);

    // Fetch games when filters change
    useEffect(() => {
        if (!user) return; // Don't fetch if not logged in

        setLoading(true);
        setPage(1);
        setCurrentIndex(0);
        setGames([]);

        fetchGames({
            page: 1,
            genres: selectedGenres.join(','),
            pageSize: 20
        })
            .then(data => {
                // Don't filter by seenIds here - let users see all games matching filters
                setGames(data.games);
                setHasMore(!!data.next);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, [selectedGenres, user]);

    // Load more games
    const loadMoreGames = useCallback(async () => {
        if (!hasMore || loading) return;

        const nextPage = page + 1;
        try {
            const data = await fetchGames({
                page: nextPage,
                genres: selectedGenres.join(','),
                pageSize: 20
            });

            const newGames = data.games.filter(g => !seenIds.has(g.id));
            setGames(prev => [...prev, ...newGames]);
            setPage(nextPage);
            setHasMore(!!data.next);
        } catch (err) {
            console.error(err);
        }
    }, [page, hasMore, loading, selectedGenres, seenIds]);

    // Handle swipe
    const handleSwipe = async (direction, game) => {
        setSeenIds(prev => new Set([...prev, game.id]));

        if (direction === 'right') {
            // Add to matches
            setMatches(prev => {
                if (prev.some(m => m.id === game.id)) return prev;
                return [game, ...prev];
            });

            // Save to database if logged in
            if (session && user?.id !== 'demo') {
                try {
                    await saveMatch(user.id, game);
                } catch (err) {
                    console.error('Error saving match:', err);
                }
            }
        }

        setCurrentIndex(prev => prev + 1);

        if (games.length - currentIndex < 5) {
            loadMoreGames();
        }
    };

    // Handle button swipe
    const handleButtonSwipe = (direction) => {
        const currentGame = games[currentIndex];
        if (currentGame) {
            handleSwipe(direction, currentGame);
        }
    };

    // Handle genre toggle
    const handleGenreChange = (slug) => {
        setSelectedGenres(prev =>
            prev.includes(slug)
                ? prev.filter(s => s !== slug)
                : [...prev, slug]
        );
    };

    // Clear filters
    const handleClearFilters = () => {
        setSelectedGenres([]);
    };

    // Remove match
    const handleRemoveMatch = async (gameId) => {
        setMatches(prev => prev.filter(m => m.id !== gameId));

        if (session && user?.id !== 'demo') {
            try {
                await removeMatch(user.id, gameId);
            } catch (err) {
                console.error('Error removing match:', err);
            }
        }
    };

    // Refresh games
    const handleRefresh = () => {
        setSeenIds(new Set());
        setCurrentIndex(0);
        localStorage.removeItem(STORAGE_KEYS.SEEN);

        setLoading(true);
        fetchGames({
            page: 1,
            genres: selectedGenres.join(','),
            pageSize: 20
        })
            .then(data => {
                setGames(data.games);
                setPage(1);
                setHasMore(!!data.next);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    };

    const currentCards = games.slice(currentIndex, currentIndex + 2);

    // Loading state
    if (authLoading) {
        return (
            <div className="login-page">
                <div className="loading">
                    <div className="loading-spinner"></div>
                </div>
            </div>
        );
    }

    // Login page
    if (!user) {
        return <LoginPage onLogin={handleLogin} />;
    }

    // Onboarding preferences
    if (showOnboarding) {
        return (
            <OnboardingPreferences
                user={user}
                onComplete={handleOnboardingComplete}
            />
        );
    }

    return (
        <>
            <div className="app">
                {/* Left Panel - Filters */}
                {/* Left Panel - Filters */}
                <FilterPanel
                    genres={genres}
                    selectedGenres={selectedGenres}
                    onGenreChange={handleGenreChange}
                    onClearFilters={handleClearFilters}
                    user={{
                        ...user,
                        name: profile?.name || user.user_metadata?.name || user.email,
                        role: profile?.role
                    }}
                    onLogout={handleLogout}
                    onOpenAdmin={() => setShowAdmin(true)}
                    isOpen={mobilePanel === 'filters'}
                    onClose={() => setMobilePanel(null)}
                />

                {/* Center - Swipe Area */}
                <div className="swipe-area">
                    {loading ? (
                        <div className="loading">
                            <div className="loading-spinner"></div>
                            <p>Carregando jogos...</p>
                        </div>
                    ) : currentCards.length === 0 ? (
                        <div className="no-more-cards">
                            <h3>🎮 Fim dos jogos!</h3>
                            <p>Você viu todos os jogos disponíveis com esses filtros.</p>
                            <button className="refresh-btn" onClick={handleRefresh}>
                                🔄 Ver novamente
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="card-container">
                                <AnimatePresence>
                                    {currentCards.map((game, i) => (
                                        <SwipeCard
                                            key={game.id}
                                            game={game}
                                            onSwipe={handleSwipe}
                                            isTop={i === 0}
                                            onCardClick={(g) => setSelectedGameId(g.id)}
                                        />
                                    ))}
                                </AnimatePresence>
                            </div>

                            <div className="action-buttons">
                                <button
                                    className="action-btn nope"
                                    onClick={() => handleButtonSwipe('left')}
                                    title="Não curti"
                                >
                                    ✕
                                </button>
                                <button
                                    className="action-btn like"
                                    onClick={() => handleButtonSwipe('right')}
                                    title="Quero jogar!"
                                >
                                    ♥
                                </button>
                            </div>
                        </>
                    )}
                </div>

                {/* Right Panel - Matches */}
                <MatchesList
                    matches={matches}
                    onRemoveMatch={handleRemoveMatch}
                    onMatchClick={(game) => setSelectedGameId(game.id)}
                    isOpen={mobilePanel === 'matches'}
                    onClose={() => setMobilePanel(null)}
                />

                {/* Mobile Overlay */}
                <div
                    className={`mobile-overlay ${mobilePanel ? 'visible' : ''}`}
                    onClick={() => setMobilePanel(null)}
                />

                {/* Mobile Navigation */}
                <div className="mobile-nav">
                    {/* Version Indicator for Debugging */}
                    <div style={{ position: 'absolute', top: -15, right: 0, fontSize: 10, opacity: 0.5 }}>v5</div>

                    <button
                        className={`mobile-nav-btn ${mobilePanel === 'filters' ? 'active' : ''}`}
                        onClick={() => setMobilePanel(mobilePanel === 'filters' ? null : 'filters')}
                    >
                        <span>🧭</span>
                        <span>Explore</span>
                    </button>

                    <button
                        className={`mobile-nav-btn ${!mobilePanel ? 'active' : ''}`}
                        onClick={() => setMobilePanel(null)}
                    >
                        <span>🔥</span>
                        <span>Home</span>
                    </button>

                    <button
                        className={`mobile-nav-btn ${mobilePanel === 'matches' ? 'active' : ''}`}
                        onClick={() => setMobilePanel(mobilePanel === 'matches' ? null : 'matches')}
                    >
                        <span>💚</span>
                        <span>Likes</span>
                        {matches.length > 0 && <span className="badge-dot">{matches.length}</span>}
                    </button>
                </div>
            </div>

            {/* Admin Panel */}
            < AnimatePresence >
                {showAdmin && profile?.role === 'admin' && (
                    <AdminPanel
                        user={user}
                        onClose={() => setShowAdmin(false)}
                    />
                )
                }
            </AnimatePresence >

            {/* Game Details Modal */}
            < AnimatePresence >
                {selectedGameId && (
                    <GameDetailsModal
                        gameId={selectedGameId}
                        onClose={() => setSelectedGameId(null)}
                        onSwipe={handleSwipe}
                    />
                )}
            </AnimatePresence >
        </>
    );
}

