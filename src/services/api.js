const API_URL = import.meta.env.VITE_API_URL || '';

class ApiService {
    constructor() {
        // Use id_token from Cognito OAuth
        this.token = localStorage.getItem('id_token') || localStorage.getItem('auth_token');
    }

    setToken(token) {
        this.token = token;
        if (token) {
            localStorage.setItem('auth_token', token);
            localStorage.setItem('id_token', token);
        } else {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('id_token');
        }
    }

    getToken() {
        // Check both possible token storage locations
        return this.token || localStorage.getItem('id_token') || localStorage.getItem('auth_token');
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
            return null;
        }
    }

    logout() {
        this.setToken(null);
    }

    async updateProfile(name) {
        return this.request('/api/profile', {
            method: 'PUT',
            body: JSON.stringify({ name })
        });
    }

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

    async healthCheck() {
        return this.request('/health');
    }

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

    async getRecommendations() {
        return this.request('/api/recommendations');
    }

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

    async getGroupMessages(groupId) {
        return this.request(`/api/groups/${groupId}/messages`);
    }

    async postGroupMessage(groupId, message) {
        return this.request(`/api/groups/${groupId}/messages`, {
            method: 'POST',
            body: JSON.stringify({ message })
        });
    }

    async getGroupReviews(groupId) {
        return this.request(`/api/groups/${groupId}/reviews`);
    }

    async editMessage(messageId, message) {
        return this.request(`/api/groups/messages/${messageId}`, {
            method: 'PUT',
            body: JSON.stringify({ message })
        });
    }

    async deleteMessage(messageId) {
        return this.request(`/api/groups/messages/${messageId}`, {
            method: 'DELETE'
        });
    }
}

export const api = new ApiService();
export default api;
