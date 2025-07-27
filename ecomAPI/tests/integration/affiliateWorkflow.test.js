const request = require('supertest');
const app = require('../../src/server');
const db = require('../../src/models');

describe('Affiliate Workflow Integration Tests', () => {
  let testUser, testProduct, testAffiliateLink;
  let authToken;

  beforeAll(async () => {
    // Setup test data
    testUser = await db.User.create({
      email: 'testkol@example.com',
      password: 'password123',
      firstName: 'Test',
      lastName: 'KOL',
      is_kol: true,
      kol_status: 'approved',
      kol_tier: 'low',
      kol_commission_rate: 0.05
    });

    testProduct = await db.Product.create({
      name: 'Test Product',
      statusId: 'S1',
      categoryId: 'CAT1',
      brandId: 'BRAND1'
    });

    // Login to get auth token
    const loginResponse = await request(app)
      .post('/api/login')
      .send({
        email: 'testkol@example.com',
        password: 'password123'
      });

    authToken = loginResponse.body.data.accessToken;
  });

  afterAll(async () => {
    // Cleanup test data
    await db.AffiliateLink.destroy({ where: { kolId: testUser.id } });
    await db.AffiliateClick.destroy({ where: { kolId: testUser.id } });
    await db.AffiliateOrders.destroy({ where: { kolId: testUser.id } });
    await db.Product.destroy({ where: { id: testProduct.id } });
    await db.User.destroy({ where: { id: testUser.id } });
  });

  describe('Complete Affiliate Workflow', () => {
    test('should create affiliate link successfully', async () => {
      const response = await request(app)
        .post('/api/kol/generate-link')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: testProduct.id
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('shortCode');
      expect(response.body.data).toHaveProperty('shortUrl');
      expect(response.body.data.productName).toBe('Test Product');

      testAffiliateLink = response.body.data;
    });

    test('should record affiliate click when accessing short link', async () => {
      const response = await request(app)
        .get(`/aff/${testAffiliateLink.shortCode}`)
        .set('User-Agent', 'Test Browser');

      expect(response.status).toBe(302); // Redirect status
      expect(response.headers.location).toContain(`/detail-product/${testProduct.id}`);

      // Verify click was recorded
      const clickRecord = await db.AffiliateClick.findOne({
        where: {
          link_id: testAffiliateLink.id,
          kolId: testUser.id,
          product_id: testProduct.id
        }
      });

      expect(clickRecord).toBeTruthy();
      expect(clickRecord.ip).toBeDefined();
      expect(clickRecord.user_agent).toBe('Test Browser');
    });

    test('should get affiliate links list', async () => {
      const response = await request(app)
        .get('/api/kol/links')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].product.name).toBe('Test Product');
      expect(response.body.data[0].clickCount).toBe(1);
    });

    test('should get KOL dashboard stats', async () => {
      const response = await request(app)
        .get('/api/kol/dashboard')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.totalClicks).toBe(1);
      expect(response.body.data.totalOrders).toBe(0); // No orders yet
    });
  });
}); 