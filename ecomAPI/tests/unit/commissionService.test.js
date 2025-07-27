const { calculateCommission } = require('../../src/services/commissionService');

describe('CommissionService', () => {
  describe('calculateCommission', () => {
    test('should return 5% commission rate for low tier', () => {
      const commissionCalculator = calculateCommission({ totalSales: 15000, tier: 'low' });
      const commission = commissionCalculator(1000);
      expect(commission).toBe(50); // 5% of 1000
    });

    test('should return 10% commission rate for high tier', () => {
      const commissionCalculator = calculateCommission({ totalSales: 150000, tier: 'high' });
      const commission = commissionCalculator(1000);
      expect(commission).toBe(100); // 10% of 1000
    });

    test('should return 10% commission rate for sales >= 100000', () => {
      const commissionCalculator = calculateCommission({ totalSales: 100000, tier: 'low' });
      const commission = commissionCalculator(1000);
      expect(commission).toBe(100); // 10% of 1000
    });

    test('should return 5% commission rate for sales >= 10000 but < 100000', () => {
      const commissionCalculator = calculateCommission({ totalSales: 50000, tier: 'low' });
      const commission = commissionCalculator(1000);
      expect(commission).toBe(50); // 5% of 1000
    });

    test('should return 5% commission rate for sales < 10000', () => {
      const commissionCalculator = calculateCommission({ totalSales: 5000, tier: 'low' });
      const commission = commissionCalculator(1000);
      expect(commission).toBe(50); // 5% of 1000
    });
  });
}); 