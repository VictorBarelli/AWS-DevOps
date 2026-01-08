/**
 * API Gateway Tests
 */

const request = require('supertest');
const app = require('../src/index');

describe('API Gateway', () => {
    describe('Health Endpoints', () => {
        test('GET /health returns healthy status', async () => {
            const response = await request(app)
                .get('/health')
                .expect('Content-Type', /json/)
                .expect(200);

            expect(response.body).toHaveProperty('status', 'healthy');
            expect(response.body).toHaveProperty('service', 'api-gateway');
            expect(response.body).toHaveProperty('timestamp');
            expect(response.body).toHaveProperty('uptime');
        });

        test('GET /ready returns readiness status', async () => {
            const response = await request(app)
                .get('/ready')
                .expect('Content-Type', /json/);

            expect(response.body).toHaveProperty('status');
            expect(response.body).toHaveProperty('service', 'api-gateway');
            expect(response.body).toHaveProperty('dependencies');
        });
    });

    describe('Authentication', () => {
        test('Protected routes require authentication', async () => {
            const response = await request(app)
                .get('/api/users')
                .expect('Content-Type', /json/)
                .expect(401);

            expect(response.body).toHaveProperty('error', 'Unauthorized');
        });

        test('Invalid token format returns 401', async () => {
            const response = await request(app)
                .get('/api/users')
                .set('Authorization', 'InvalidFormat')
                .expect(401);

            expect(response.body).toHaveProperty('error', 'Unauthorized');
        });

        test('Auth routes are accessible without token', async () => {
            // Auth service not running, so expect 503
            const response = await request(app)
                .post('/api/auth/login')
                .send({ email: 'test@example.com', password: 'password' });

            // Either 503 (service down) or proxied response
            expect([200, 503]).toContain(response.status);
        });
    });

    describe('404 Handling', () => {
        test('Unknown routes return 404', async () => {
            const response = await request(app)
                .get('/unknown-route')
                .expect('Content-Type', /json/)
                .expect(404);

            expect(response.body).toHaveProperty('error', 'Not Found');
        });
    });

    describe('Request ID', () => {
        test('Response includes X-Request-ID header', async () => {
            const response = await request(app)
                .get('/health')
                .expect(200);

            expect(response.headers).toHaveProperty('x-request-id');
        });

        test('Preserves incoming X-Request-ID', async () => {
            const requestId = 'test-request-id-123';

            const response = await request(app)
                .get('/health')
                .set('X-Request-ID', requestId)
                .expect(200);

            expect(response.headers['x-request-id']).toBe(requestId);
        });
    });
});
