// Backend API Service for EC2
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://44.203.12.38:3001';

class API {
    constructor() {
        this.baseURL = API_BASE_URL;
        this.token = null;
    }

    setToken(token) {
        this.token = token;
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;

        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        const response = await fetch(url, {
            ...options,
            headers
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'Request failed' }));
            throw new Error(error.error || 'Request failed');
        }

        return response.json();
    }

    // User endpoints
    async getCurrentUser() {
        return this.request('/api/users/me');
    }

    async updateProfile(data) {
        return this.request('/api/users/me', {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    // Matches endpoints
    async getMatches() {
        return this.request('/api/matches');
    }

    async saveMatch(gameData, superLiked = false) {
        return this.request('/api/matches', {
            method: 'POST',
            body: JSON.stringify({
                game_id: gameData.id,
                game_name: gameData.name,
                game_image: gameData.image,
                game_genres: gameData.genres,
                game_rating: gameData.rating,
                super_liked: superLiked
            })
        });
    }

    async removeMatch(gameId) {
        return this.request(`/api/matches/${gameId}`, {
            method: 'DELETE'
        });
    }

    // Admin endpoints
    async getAllUsers() {
        return this.request('/api/admin/users');
    }

    async updateUserRole(userId, role) {
        return this.request(`/api/admin/users/${userId}/role`, {
            method: 'PUT',
            body: JSON.stringify({ role })
        });
    }

    async getStats() {
        return this.request('/api/admin/stats');
    }
}

export const api = new API();
export default api;
