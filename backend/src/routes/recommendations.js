const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { authenticateToken } = require('../middleware/auth');
const https = require('https');

const RAWG_API_KEY = process.env.RAWG_API_KEY || '';

const fetchFromRawg = (endpoint) => {
    return new Promise((resolve, reject) => {
        const url = `https://api.rawg.io/api${endpoint}${endpoint.includes('?') ? '&' : '?'}key=${RAWG_API_KEY}`;

        https.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    reject(e);
                }
            });
        }).on('error', reject);
    });
};

router.get('/', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;

        const matchesResult = await pool.query(`
            SELECT game_genres, game_rating, super_liked
            FROM matches
            WHERE user_id = $1
        `, [userId]);

        if (matchesResult.rows.length === 0) {
            return res.json({
                recommendations: [],
                preferences: {},
                message: 'Curta alguns jogos primeiro para receber recomendações personalizadas!'
            });
        }

        const genreScores = {};
        let totalGames = 0;

        matchesResult.rows.forEach(match => {
            const genres = match.game_genres || [];
            const weight = match.super_liked ? 2 : 1;

            genres.forEach(genre => {
                if (!genreScores[genre]) {
                    genreScores[genre] = 0;
                }
                genreScores[genre] += weight;
            });
            totalGames++;
        });

        const sortedGenres = Object.entries(genreScores)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3);

        if (sortedGenres.length === 0) {
            return res.json({
                recommendations: [],
                preferences: {},
                message: 'Não foi possível identificar suas preferências de gênero.'
            });
        }

        const preferences = {};
        const totalScore = Object.values(genreScores).reduce((a, b) => a + b, 0);
        sortedGenres.forEach(([genre, score]) => {
            preferences[genre] = Math.round((score / totalScore) * 100);
        });

        const existingGamesResult = await pool.query(
            'SELECT game_id FROM matches WHERE user_id = $1',
            [userId]
        );
        const existingGameIds = new Set(existingGamesResult.rows.map(r => r.game_id));

        const genreSlugs = sortedGenres.map(([genre]) =>
            genre.toLowerCase().replace(/\s+/g, '-')
        ).join(',');

        let recommendations = [];

        try {
            const rawgData = await fetchFromRawg(
                `/games?genres=${genreSlugs}&ordering=-rating&page_size=30`
            );

            if (rawgData.results) {
                recommendations = rawgData.results
                    .filter(game => !existingGameIds.has(game.id))
                    .slice(0, 15)
                    .map(game => ({
                        id: game.id,
                        name: game.name,
                        image: game.background_image,
                        rating: game.rating,
                        genres: game.genres?.map(g => g.name) || [],
                        released: game.released,
                        metacritic: game.metacritic,
                        matchScore: calculateMatchScore(game.genres?.map(g => g.name) || [], preferences)
                    }))
                    .sort((a, b) => b.matchScore - a.matchScore);
            }
        } catch (rawgError) {
            console.error('RAWG API error:', rawgError);
        }

        res.json({
            recommendations,
            preferences,
            totalGamesAnalyzed: totalGames,
            topGenres: sortedGenres.map(([genre, score]) => ({
                genre,
                score,
                percentage: Math.round((score / totalScore) * 100)
            }))
        });

    } catch (err) {
        console.error('Error getting recommendations:', err);
        res.status(500).json({ error: 'Error generating recommendations' });
    }
});

function calculateMatchScore(gameGenres, preferences) {
    if (gameGenres.length === 0) return 50;

    let score = 0;
    let matches = 0;

    gameGenres.forEach(genre => {
        if (preferences[genre]) {
            score += preferences[genre];
            matches++;
        }
    });

    return Math.min(99, Math.round(30 + (score * 0.7)));
}

module.exports = router;
