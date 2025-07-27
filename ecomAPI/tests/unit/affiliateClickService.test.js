const { createAffiliateClick } = require('../../src/services/affiliateClickService');

// Mock database
jest.mock('../../src/models', () => ({
  AffiliateClick: {
    create: jest.fn()
  }
}));

const db = require('../../src/models');

describe('AffiliateClickService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createAffiliateClick', () => {
    test('should create affiliate click with correct data', async () => {
      const mockClickData = {
        id: 1,
        link_id: 123,
        kolId: 456,
        product_id: 789,
        ip: '192.168.1.1',
        user_agent: 'Mozilla/5.0',
        clicked_at: new Date()
      };

      db.AffiliateClick.create.mockResolvedValue(mockClickData);

      const result = await createAffiliateClick({
        linkId: 123,
        kolId: 456,
        productId: 789,
        ip: '192.168.1.1',
        userAgent: 'Mozilla/5.0'
      });

      expect(db.AffiliateClick.create).toHaveBeenCalledWith({
        link_id: 123,
        kolId: 456,
        product_id: 789,
        ip: '192.168.1.1',
        user_agent: 'Mozilla/5.0',
        clicked_at: expect.any(Date)
      });

      expect(result).toEqual(mockClickData);
    });

    test('should handle database errors', async () => {
      const error = new Error('Database connection failed');
      db.AffiliateClick.create.mockRejectedValue(error);

      await expect(createAffiliateClick({
        linkId: 123,
        kolId: 456,
        productId: 789,
        ip: '192.168.1.1',
        userAgent: 'Mozilla/5.0'
      })).rejects.toThrow('Database connection failed');
    });
  });
}); 