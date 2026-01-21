/* eslint-disable no-undef */
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
import ReviewsTab from './components/ReviewsTab';
import ForYouTab from './components/ForYouTab';
import GroupsSection from './components/GroupsSection';
import ProfileTab from './components/ProfileTab';
import { fetchGames, fetchGenres } from './services/rawgApi';
import cognitoAuth from './services/cognitoAuth';
import api from './services/api';

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
    const [showConfetti, setShowConfetti] = useState(false);
    const [activeTab, setActiveTab] = useState('home'); // 'home' | 'likes' | 'filters'

    // Game State
    const [games, setGames] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [genres, setGenres] = useState([]);
    const [selectedGenres, setSelectedGenres] = useState([]);
    const [showAdult, setShowAdult] = useState(false);
    const [releaseYear, setReleaseYear] = useState(''); // 'YYYY-MM-DD,YYYY-MM-DD'
    const [matches, setMatches] = useState([]);
    const [seenIds, setSeenIds] = useState(new Set());
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [lastSwipedGame, setLastSwipedGame] = useState(null);

    // Check for existing session on mount
    useEffect(() => {
        const initAuth = async () => {
            try {
                // Check for stored tokens (from OAuth callback)
                const idToken = localStorage.getItem('id_token');
                if (idToken) {
                    try {
                        const payload = JSON.parse(atob(idToken.split('.')[1]));
                        const userData = {
                            id: payload.sub,
                            email: payload.email,
                            user_metadata: { name: payload.name || payload.email }
                        };
                        setUser(userData);
                        setSession({ idToken });
                        setSession({ idToken });

                        // Fetch profile from API to get role
                        try {
                            const userProfile = await api.getCurrentUser();
                            setProfile({
                                ...userData,
                                ...userProfile
                            });
                        } catch (e) {
                            console.error('Error fetching profile:', e);
                            setProfile({
                                name: payload.name || payload.email?.split('@')[0],
                                role: 'user'
                            });
                        }

                        // Load matches from API
                        try {
                            const userMatches = await api.getMatches();
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

                        // Check onboarding
                        if (!localStorage.getItem('gameswipe_onboarding_complete')) {
                            setShowOnboarding(true);
                        }
                    } catch (e) {
                        console.error('Token decode error:', e);
                        localStorage.removeItem('id_token');
                        localStorage.removeItem('access_token');
                        localStorage.removeItem('refresh_token');
                    }
                } else {
                    // Check Cognito session
                    const cognitoSession = await cognitoAuth.getSession();
                    if (cognitoSession) {
                        const userInfo = await cognitoAuth.getUserInfo();
                        const userData = {
                            id: cognitoSession.getIdToken().payload.sub,
                            email: userInfo.email,
                            user_metadata: { name: userInfo.name || userInfo.email }
                        };
                        setUser(userData);
                        setSession(cognitoSession);
                        setProfile({
                            name: userInfo.name || userInfo.email?.split('@')[0],
                            role: 'user'
                        });

                        // Set token for API calls
                        api.setToken(cognitoSession.getIdToken().getJwtToken());

                        // Fetch real profile from API to get correct role
                        try {
                            const userProfile = await api.getCurrentUser();
                            setProfile(prev => ({
                                ...prev,
                                ...userProfile
                            }));
                        } catch (e) {
                            console.error('Error fetching profile:', e);
                        }

                        // Load matches from API
                        try {
                            api.setToken(cognitoSession.getIdToken().getJwtToken());
                            const userMatches = await api.getMatches();
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

                        if (!localStorage.getItem('gameswipe_onboarding_complete')) {
                            setShowOnboarding(true);
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

    // Handle login
    const handleLogin = async (userData, sessionData) => {
        setUser(userData);
        setSession(sessionData);

        if (sessionData && userData.id !== 'demo') {
            try {
                setProfile({
                    name: userData.user_metadata?.name || userData.email?.split('@')[0],
                    role: 'user'
                });

                // Fetch real profile from API to get correct role
                try {
                    const userProfile = await api.getCurrentUser();
                    setProfile(prev => ({
                        ...prev,
                        ...userProfile
                    }));
                } catch (e) {
                    console.error('Error fetching profile in login:', e);
                }

                // Check if onboarding is complete
                const onboardingComplete = localStorage.getItem('gameswipe_onboarding_complete') === 'true';

                if (!onboardingComplete) {
                    setShowOnboarding(true);
                } else {
                    const savedPrefs = localStorage.getItem('gameswipe_preferences');
                    if (savedPrefs) setSelectedGenres(JSON.parse(savedPrefs));
                }

                // Load matches from API
                try {
                    const userMatches = await api.getMatches();
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
            } catch (err) {
                console.error('Error loading profile:', err);
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
            cognitoAuth.signOut();
            localStorage.removeItem('id_token');
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            api.setToken(null);
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
            adult: showAdult,
            dates: releaseYear,
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
    }, [selectedGenres, user, showAdult, releaseYear]);

    // Load more games
    const loadMoreGames = useCallback(async () => {
        if (!hasMore || loading) return;

        const nextPage = page + 1;
        try {
            const data = await fetchGames({
                page: nextPage,
                genres: selectedGenres.join(','),
                adult: showAdult,
                dates: releaseYear,
                pageSize: 20
            });

            const newGames = data.games.filter(g => !seenIds.has(g.id));
            setGames(prev => [...prev, ...newGames]);
            setPage(nextPage);
            setHasMore(!!data.next);
        } catch (err) {
            console.error(err);
        }
    }, [page, hasMore, loading, selectedGenres, seenIds, showAdult, releaseYear]);

    // Handle swipe
    const handleSwipe = async (direction, game) => {
        // Save for undo
        setLastSwipedGame({ game, direction, wasMatch: direction === 'right' });

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
                    await api.saveMatch(game);
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

    // Handle undo - go back to previous game
    const handleUndo = () => {
        if (lastSwipedGame && currentIndex > 0) {
            const { game, wasMatch } = lastSwipedGame;

            // Go back one card
            setCurrentIndex(prev => prev - 1);

            // Remove from seen
            setSeenIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(game.id);
                return newSet;
            });

            // Remove from matches if it was a like
            if (wasMatch) {
                setMatches(prev => prev.filter(m => m.id !== game.id));
            }

            // Clear last swiped
            setLastSwipedGame(null);
        }
    };

    // Handle super like
    const handleSuperLike = (game) => {
        if (game) {
            // Mark as superLiked and add to matches
            const superLikedGame = { ...game, superLiked: true };

            setSeenIds(prev => new Set([...prev, game.id]));
            setMatches(prev => {
                if (prev.some(m => m.id === game.id)) return prev;
                return [superLikedGame, ...prev];
            });

            // Show confetti animation
            setShowConfetti(true);
            setTimeout(() => setShowConfetti(false), 1500);

            // Save to database if logged in
            if (session && user?.id !== 'demo') {
                api.saveMatch(superLikedGame).catch(err => {
                    console.error('Error saving super like:', err);
                });
            }

            setCurrentIndex(prev => prev + 1);

            if (games.length - currentIndex < 5) {
                loadMoreGames();
            }
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
        setReleaseYear('');
    };

    // Remove match
    const handleRemoveMatch = async (gameId) => {
        setMatches(prev => prev.filter(m => m.id !== gameId));

        if (session && user?.id !== 'demo') {
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
        // Reset all filters and states related to game fetching
        setMatches([]);
        setSeenIds(new Set());
        setSelectedGenres([]);
        setShowAdult(false);
        setReleaseYear(''); // Reset releaseYear
        setPage(1);
        setHasMore(true); // Reset hasMore to true to allow initial fetch

        fetchGames({
            page: 1,
            genres: selectedGenres.join(','),
            adult: showAdult,
            dates: releaseYear, // Pass releaseYear to fetchGames
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
                {/* Confetti Animation */}
                {showConfetti && (
                    <div className="confetti-overlay">
                        {[...Array(30)].map((_, i) => (
                            <div key={i} className="confetti-piece" style={{
                                left: `${Math.random() * 100}%`,
                                animationDelay: `${Math.random() * 0.5}s`,
                                backgroundColor: ['#fbbf24', '#f59e0b', '#fcd34d', '#fef3c7'][Math.floor(Math.random() * 4)]
                            }} />
                        ))}
                    </div>
                )}

                <header className="app-header">
                    <div className="header-logo">
                        <span className="logo-icon">🎮</span>
                        <span className="logo-text">GameSwipe</span>
                    </div>
                    <button
                        className="config-btn"
                        onClick={() => setActiveTab('filters')}
                    >
                        ⚙️
                    </button>
                </header>

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
                                onSuperLike={handleSuperLike}
                                onUndo={handleUndo}
                                canUndo={!!lastSwipedGame && currentIndex > 0}
                            />
                        )}

                        {activeTab === 'foryou' && (
                            <ForYouTab
                                user={user}
                                onSwipe={handleSwipe}
                                onCardClick={setSelectedGameId}
                            />
                        )}

                        {activeTab === 'likes' && (
                            <LikesTab
                                matches={matches}
                                onRemoveMatch={handleRemoveMatch}
                                onMatchClick={(game) => setSelectedGameId(game.id)}
                            />
                        )}

                        {activeTab === 'groups' && (
                            <div className="tab-content groups-tab">
                                <GroupsSection user={user} />
                            </div>
                        )}

                        {activeTab === 'profile' && (
                            <ProfileTab
                                user={user}
                                profile={profile}
                                onLogout={handleLogout}
                                onOpenAdmin={() => setShowAdmin(true)}
                            />
                        )}

                        {activeTab === 'filters' && (
                            <FiltersTab
                                genres={genres}
                                selectedGenres={selectedGenres}
                                showAdult={showAdult}
                                releaseYear={releaseYear}
                                onGenreToggle={handleGenreChange}
                                onToggleAdult={() => setShowAdult(!showAdult)}
                                onReleaseYearChange={setReleaseYear}
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

