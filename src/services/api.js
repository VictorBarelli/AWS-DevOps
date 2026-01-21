// API calls go through CloudFront proxy (same origin)
const API_URL = import.meta.env.VITE_API_URL || '';

class ApiService {
    constructor() {
        this.token = localStorage.getItem('auth_token');
    }

    setToken(token) {
        this.token = token;
        if (token) {
            localStorage.setItem('auth_token', token);
        } else {
            localStorage.removeItem('auth_token');
        }
    }

    getToken() {
        return this.token || localStorage.getItem('auth_token');
    }

    async request(endpoint, options = {}) {
        const url = `${API_URL}${endpoint}`;
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers,
        };

        const token = this.getToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(url, {
            ...options,
            headers,
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'Request failed' }));
            throw new Error(error.error || 'Request failed');
        }

        return response.json();
    }

    // Auth endpoints
    async register(email, password, name) {
        const data = await this.request('/api/auth/register', {
            method: 'POST',
            body: JSON.stringify({ email, password, name }),
        });
        this.setToken(data.token);
        return data;
    }

    async login(email, password) {
        const data = await this.request('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });
        this.setToken(data.token);
        return data;
    }

    async getCurrentUser() {
        try {
            const data = await this.request('/api/auth/me');
            return data.user;
        } catch {
            this.setToken(null);
            return null;
        }
    }

    logout() {
        this.setToken(null);
    }

    // Matches endpoints
    async getMatches() {
        const data = await this.request('/api/matches');
        return data.matches || [];
    }

    async saveMatch(game) {
        return this.request('/api/matches', {
            method: 'POST',
            body: JSON.stringify({ game }),
        });
    }

    async removeMatch(gameId) {
        return this.request(`/api/matches/${gameId}`, {
            method: 'DELETE',
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

    async deleteUser(userId) {
        return this.request(`/api/admin/users/${userId}`, {
            method: 'DELETE'
        });
    }

    async getMatchStats() {
        return this.request('/api/admin/stats');
    }

    // Health check
    async healthCheck() {
        return this.request('/health');
    }

    // Reviews endpoints
    async getReviewsFeed(page = 1) {
        return this.request(`/api/reviews/feed?page=${page}`);
    }

    async getGameReviews(gameId) {
        return this.request(`/api/reviews/game/${gameId}`);
    }

    async getMyReviews() {
        return this.request('/api/reviews/my');
    }

    async createReview(reviewData) {
        return this.request('/api/reviews', {
            method: 'POST',
            body: JSON.stringify(reviewData)
        });
    }

    async deleteReview(reviewId) {
        return this.request(`/api/reviews/${reviewId}`, {
            method: 'DELETE'
        });
    }

    // AI Recommendations
    async getRecommendations() {
        return this.request('/api/recommendations');
    }

    // Groups endpoints
    async getGroups() {
        return this.request('/api/groups');
    }

    async getGroup(slug) {
        return this.request(`/api/groups/${slug}`);
    }

    async getMyGroups() {
        return this.request('/api/groups/user/my');
    }

    async joinGroup(groupId) {
        return this.request(`/api/groups/${groupId}/join`, {
            method: 'POST'
        });
    }

    async leaveGroup(groupId) {
        return this.request(`/api/groups/${groupId}/leave`, {
            method: 'POST'
        });
    }

    async postGroupReview(groupId, reviewData) {
        return this.request(`/api/groups/${groupId}/review`, {
            method: 'POST',
            body: JSON.stringify(reviewData)
        });
    }
}

export const api = new ApiService();
export default api;
