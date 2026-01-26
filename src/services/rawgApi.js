import axios from 'axios';

const API_KEY = import.meta.env.VITE_RAWG_API_KEY;
const BASE_URL = 'https://api.rawg.io/api';

if (!API_KEY) {
    console.warn('RAWG API key is missing. Please check your .env file.');
}

const api = axios.create({
    baseURL: BASE_URL,
    params: {
        key: API_KEY
    }
});

/**
 * Shuffle array randomly
 */
function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

/**
 * Fetch games with optional filters
 * @param {Object} options - Filter options
 * @param {number} options.page - Page number (default: 1)
 * @param {number} options.pageSize - Number of games per page (default: 20)
 * @param {string} options.genres - Comma-separated genre slugs
 * @param {string} options.ordering - Ordering field (e.g., '-rating', '-released')
 * @returns {Promise<Object>} API response with games array and pagination info
 */
export async function fetchGames({
    page = 1,
    pageSize = 20,
    genres = '',
    ordering = '',
    search = '',
    adult = false,
    dates = null
} = {}) {
    try {
        const params = {
            page,
            page_size: pageSize
        };

        // Add genres filter if provided
        if (genres && genres.length > 0) {
            params.genres = genres;
        }

        // Add dates filter if provided
        if (dates) {
            params.dates = dates;
        }

        // Exclude common Japanese/anime/Chinese game tags for more western-focused results
        // Also exclude adult content by default
        const excludeTags = ['anime', 'visual-novel', 'jrpg', 'otome', 'dating-sim', 'gacha', 'mobile-game'];

        if (!adult) {
            // When adult filter is OFF, exclude adult content
            excludeTags.push('nudity', 'sexual-content', 'hentai', 'nsfw');
        }

        params.tags_exclude = excludeTags.join(',');

        // Use random page offset for variety
        if (!ordering) {
            // Get random ordering from options
            const orderings = ['-rating', '-released', '-added', '-metacritic', 'name'];
            params.ordering = orderings[Math.floor(Math.random() * orderings.length)];
        } else {
            params.ordering = ordering;
        }

        if (search) {
            params.search = search;
        }

        console.log('Fetching games with params:', params);

        const response = await api.get('/games', { params });

        // Shuffle the results for random order
        const shuffledGames = shuffleArray(response.data.results);

        // Regex to detect Chinese/Japanese/Korean characters
        const asianCharRegex = /[\u3000-\u303F\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF\uAC00-\uD7AF]/;

        // Filter out games without images and games with Asian character names
        const filteredGames = shuffledGames.filter(game =>
            game.background_image && !asianCharRegex.test(game.name)
        );

        return {
            games: filteredGames.map(game => ({
                id: game.id,
                name: game.name,
                image: game.background_image,
                rating: game.rating,
                ratingCount: game.ratings_count,
                released: game.released,
                genres: game.genres?.map(g => g.name) || [],
                platforms: game.platforms?.map(p => p.platform.name) || [],
                metacritic: game.metacritic
            })),
            count: response.data.count,
            next: response.data.next,
            previous: response.data.previous
        };
    } catch (error) {
        console.error('Error fetching games:', error);
        throw error;
    }
}

/**
 * Fetch all available genres
 * @returns {Promise<Array>} Array of genre objects with id, name, and slug
 */
export async function fetchGenres() {
    try {
        const response = await api.get('/genres');

        return response.data.results.map(genre => ({
            id: genre.id,
            name: genre.name,
            slug: genre.slug,
            gamesCount: genre.games_count,
            image: genre.image_background
        }));
    } catch (error) {
        console.error('Error fetching genres:', error);
        throw error;
    }
}

/**
 * Fetch game details by ID
 * @param {number} gameId - The game ID
 * @returns {Promise<Object>} Detailed game information
 */
export async function fetchGameDetails(gameId) {
    try {
        const response = await api.get(`/games/${gameId}`);
        const game = response.data;

        return {
            id: game.id,
            name: game.name,
            description: game.description_raw,
            descriptionHtml: game.description,
            image: game.background_image,
            imageAdditional: game.background_image_additional,
            rating: game.rating,
            released: game.released,
            genres: game.genres?.map(g => g.name) || [],
            platforms: game.platforms?.map(p => p.platform.name) || [],
            developers: game.developers?.map(d => d.name) || [],
            publishers: game.publishers?.map(p => p.name) || [],
            website: game.website,
            metacritic: game.metacritic,
            playtime: game.playtime,
            esrbRating: game.esrb_rating?.name
        };
    } catch (error) {
        console.error('Error fetching game details:', error);
        throw error;
    }
}

/**
 * Fetch game screenshots
 * @param {number} gameId - The game ID
 * @returns {Promise<Array>} Array of screenshot URLs
 */
export async function fetchGameScreenshots(gameId) {
    try {
        const response = await api.get(`/games/${gameId}/screenshots`);
        return response.data.results.map(s => s.image);
    } catch (error) {
        console.error('Error fetching screenshots:', error);
        return [];
    }
}

export default {
    fetchGames,
    fetchGenres,
    fetchGameDetails,
    fetchGameScreenshots
};

