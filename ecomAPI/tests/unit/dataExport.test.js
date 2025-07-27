const request = require('supertest');
const app = require('../../src/server');
const db = require('../../src/models');

describe('Data Export Controller', () => {
    let authToken;
    let adminToken;
    let kolUser;
    let adminUser;

    beforeAll(async () => {
        // Create test users
        kolUser = await db.User.create({
            firstName: 'Test',
            lastName: 'KOL',
            email: 'testkol@example.com',
            password: 'hashedpassword',
            is_kol: true,
            kol_status: 'approved',
            kol_tier: 'standard',
            kol_commission_rate: 0.05,
            total_sales: 5000
        });

        adminUser = await db.User.create({
            firstName: 'Test',
            lastName: 'Admin',
            email: 'testadmin@example.com',
            password: 'hashedpassword',
            roleId: 'R1'
        });

        // Mock JWT tokens (in real tests, you'd generate proper tokens)
        authToken = 'mock-kol-token';
        adminToken = 'mock-admin-token';
    });

    afterAll(async () => {
        // Clean up test data
        await db.User.destroy({ where: { email: ['testkol@example.com', 'testadmin@example.com'] } });
    });

    describe('GET /api/affiliate/export-performance', () => {
        it('should export KOL performance data in CSV format', async () => {
            const response = await request(app)
                .get('/api/affiliate/export-performance?format=csv')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.headers['content-type']).toContain('text/csv');
            expect(response.headers['content-disposition']).toContain('attachment');
            expect(response.headers['content-disposition']).toContain('my_performance_data_');
        });

        it('should export KOL performance data in Excel format', async () => {
            const response = await request(app)
                .get('/api/affiliate/export-performance?format=excel')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.headers['content-type']).toContain('spreadsheetml.sheet');
            expect(response.headers['content-disposition']).toContain('attachment');
            expect(response.headers['content-disposition']).toContain('my_performance_data_');
        });

        it('should return error for unsupported format', async () => {
            const response = await request(app)
                .get('/api/affiliate/export-performance?format=pdf')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(400);

            expect(response.body.errCode).toBe(3);
            expect(response.body.errMessage).toContain('Unsupported format');
        });

        it('should require authentication', async () => {
            await request(app)
                .get('/api/affiliate/export-performance')
                .expect(401);
        });
    });

    describe('GET /api/affiliate/export-data (Admin)', () => {
        it('should export affiliate data in CSV format for admin', async () => {
            const response = await request(app)
                .get('/api/affiliate/export-data?format=csv')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.headers['content-type']).toContain('text/csv');
            expect(response.headers['content-disposition']).toContain('attachment');
            expect(response.headers['content-disposition']).toContain('affiliate_data_');
        });

        it('should export affiliate data in Excel format for admin', async () => {
            const response = await request(app)
                .get('/api/affiliate/export-data?format=excel')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.headers['content-type']).toContain('spreadsheetml.sheet');
            expect(response.headers['content-disposition']).toContain('attachment');
            expect(response.headers['content-disposition']).toContain('affiliate_data_');
        });
    });

    describe('GET /api/affiliate/export-kol-performance (Admin)', () => {
        it('should export KOL performance summary for admin', async () => {
            const response = await request(app)
                .get('/api/affiliate/export-kol-performance?format=csv')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.headers['content-type']).toContain('text/csv');
            expect(response.headers['content-disposition']).toContain('attachment');
            expect(response.headers['content-disposition']).toContain('kol_performance_');
        });
    });
});