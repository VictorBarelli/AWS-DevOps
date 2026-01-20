import { useState, useEffect, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import LoginPage from './components/LoginPage';
import AdminPanel from './components/AdminPanel';
import OnboardingPreferences from './components/OnboardingPreferences';
import GameDetailsModal from './components/GameDetailsModal';
import TabNavigation from './components/TabNavigation';
import HomeTab from './components/HomeTab';
import LikesTab from './components/LikesTab';
import FiltersTab from './components/FiltersTab';
import { fetchGames, fetchGenres } from './services/rawgApi';
import { cognitoAuth } from './services/cognitoAuth';
import { api } from './services/api';

// LocalStorage keys
const STORAGE_KEYS = {
    MATCHES: 'gameswipe_matches',
    FILTERS: 'gameswipe_filters',
    SEEN: 'gameswipe_seen'
};

export default function App() {
    // Auth State
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [authLoading, setAuthLoading] = useState(true);
    const [showAdmin, setShowAdmin] = useState(false);
    const [showOnboarding, setShowOnboarding] = useState(false);
    const [selectedGameId, setSelectedGameId] = useState(null);
    const [activeTab, setActiveTab] = useState('home');

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

    // Confetti and Undo state
    const [showConfetti, setShowConfetti] = useState(false);
    const [lastSwipedGame, setLastSwipedGame] = useState(null);
    const [canUndo, setCanUndo] = useState(false);

    // Check for OAuth callback and existing session on mount
    useEffect(() => {
        const initAuth = async () => {
            try {
                // Check for OAuth callback code
                const code = cognitoAuth.getAuthCodeFromUrl();
                if (code) {
                    console.log('Processing OAuth callback...');
                    await cognitoAuth.exchangeCodeForTokens(code);
                    cognitoAuth.clearUrlParams();
                }

                // Check for existing token
                const token = cognitoAuth.getStoredToken();
                if (token) {
                    const userData = cognitoAuth.getCurrentUser();
                    if (userData) {
                        setUser(userData);
                        api.setToken(token);

                        // Fetch profile from backend API (this also creates user if needed)
                        try {
                            const userProfile = await api.getCurrentUser();
                            setProfile(userProfile);
                            console.log('User profile loaded:', userProfile);

                            // Check if onboarding needed
                            if (!userProfile?.onboarding_complete && !localStorage.getItem('gameswipe_onboarding_complete')) {
                                setShowOnboarding(true);
                            }

                            // Load user's matches from backend
                            const userMatches = await api.getMatches();
                            setMatches(userMatches.map(m => ({
                                id: m.game_id,
                                name: m.game_name,
                                image: m.game_image,
                                genres: m.game_genres,
                                rating: m.game_rating,
                                superLiked: m.super_liked
                            })));
                        } catch (err) {
                            console.error('Error loading profile:', err);
                            // Still allow user to use app with basic profile
                            setProfile({ name: userData.name, role: 'user' });
                        }
                    }
                }
            } catch (err) {
                console.error('Auth init error:', err);
            } finally {
                setAuthLoading(false);
            }
        };

        initAuth();
    }, []);

    // Handle login from LoginPage
    const handleLogin = async (_userData, isDemo = false) => {
        if (isDemo) {
            // Demo mode
            setUser({ id: 'demo', email: 'demo@example.com', name: 'Visitante' });
            setProfile({ name: 'Visitante', role: 'user' });

            const onboardingComplete = localStorage.getItem('gameswipe_onboarding_complete') === 'true';
            if (!onboardingComplete) {
                setShowOnboarding(true);
            } else {
                const savedPrefs = localStorage.getItem('gameswipe_preferences');
                if (savedPrefs) setSelectedGenres(JSON.parse(savedPrefs));
            }

            const savedMatches = localStorage.getItem(STORAGE_KEYS.MATCHES);
            if (savedMatches) setMatches(JSON.parse(savedMatches));
        } else {
            // OAuth login - handled by cognitoAuth
            cognitoAuth.signInWithGoogle();
        }
    };

    // Handle onboarding complete
    const handleOnboardingComplete = (preferences) => {
        setShowOnboarding(false);
        setSelectedGenres(preferences);
    };

    // Handle logout
    const handleLogout = async () => {
        cognitoAuth.signOut();
        setUser(null);
        setProfile(null);
        setMatches([]);
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
        if (!user) return;

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
        // Save for undo
        setLastSwipedGame({ game, direction, index: currentIndex });
        setCanUndo(true);

        setSeenIds(prev => new Set([...prev, game.id]));

        if (direction === 'right' || direction === 'super') {
            const superLiked = direction === 'super';

            // Show confetti for super like
            if (superLiked) {
                setShowConfetti(true);
                setTimeout(() => setShowConfetti(false), 2000);
            }

            // Add to matches
            setMatches(prev => {
                if (prev.some(m => m.id === game.id)) return prev;
                return [{ ...game, superLiked }, ...prev];
            });

            // Save to backend if logged in (not demo)
            if (user?.id !== 'demo') {
                try {
                    await api.saveMatch(game, superLiked);
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

    // Handle undo
    const handleUndo = async () => {
        if (!lastSwipedGame || !canUndo) return;

        const { game, direction } = lastSwipedGame;

        // Remove from seen
        setSeenIds(prev => {
            const newSet = new Set(prev);
            newSet.delete(game.id);
            return newSet;
        });

        // If it was a like/super, remove from matches
        if (direction === 'right' || direction === 'super') {
            setMatches(prev => prev.filter(m => m.id !== game.id));

            // Remove from backend
            if (user?.id !== 'demo') {
                try {
                    await api.removeMatch(game.id);
                } catch (err) {
                    console.error('Error removing match:', err);
                }
            }
        }

        // Go back one card
        setCurrentIndex(prev => Math.max(0, prev - 1));
        setCanUndo(false);
        setLastSwipedGame(null);
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

        if (user?.id !== 'demo') {
            try {
                await api.removeMatch(gameId);
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
            <div className="app tinder-layout">
                {/* Confetti Effect */}
                {showConfetti && (
                    <div className="confetti-container">
                        {[...Array(50)].map((_, i) => (
                            <div
                                key={i}
                                className="confetti"
                                style={{
                                    left: `${Math.random() * 100}%`,
                                    animationDelay: `${Math.random() * 0.5}s`,
                                    backgroundColor: ['#ff6b6b', '#ffd700', '#4ecdc4', '#45b7d1', '#96ceb4'][Math.floor(Math.random() * 5)]
                                }}
                            />
                        ))}
                    </div>
                )}

                {/* Main Content Area */}
                <div className="main-content">
                    <AnimatePresence mode="wait">
                        {activeTab === 'home' && (
                            <HomeTab
                                loading={loading}
                                currentCards={currentCards}
                                onSwipe={handleSwipe}
                                onCardClick={setSelectedGameId}
                                onRefresh={handleRefresh}
                                onButtonSwipe={handleButtonSwipe}
                                canUndo={canUndo}
                                onUndo={handleUndo}
                            />
                        )}

                        {activeTab === 'likes' && (
                            <LikesTab
                                matches={matches}
                                onRemoveMatch={handleRemoveMatch}
                                onMatchClick={(game) => setSelectedGameId(game.id)}
                            />
                        )}

                        {activeTab === 'filters' && (
                            <FiltersTab
                                genres={genres}
                                selectedGenres={selectedGenres}
                                onGenreToggle={handleGenreChange}
                                onClearFilters={handleClearFilters}
                                user={user}
                                profile={profile}
                                onLogout={handleLogout}
                                onOpenAdmin={() => setShowAdmin(true)}
                            />
                        )}
                    </AnimatePresence>
                </div>

                {/* Bottom Tab Navigation */}
                <TabNavigation
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                    matchCount={matches.length}
                />
            </div>

            {/* Admin Panel */}
            <AnimatePresence>
                {showAdmin && profile?.role === 'admin' && (
                    <AdminPanel
                        user={user}
                        onClose={() => setShowAdmin(false)}
                    />
                )}
            </AnimatePresence>

            {/* Game Details Modal */}
            <AnimatePresence>
                {selectedGameId && (
                    <GameDetailsModal
                        gameId={selectedGameId}
                        onClose={() => setSelectedGameId(null)}
                        onSwipe={handleSwipe}
                    />
                )}
            </AnimatePresence>
        </>
    );
}
