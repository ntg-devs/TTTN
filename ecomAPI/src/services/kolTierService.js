const db = require('../models');
const { Op } = require('sequelize');

/**
 * KOL Tier Service
 * Manages KOL tier calculations and updates based on sales performance
 */
const kolTierService = {
  /**
   * Calculate and update total sales for a KOL
   * @param {number} kolId - KOL user ID
   * @returns {Promise<Object>} - Updated sales information
   */
  updateKolTotalSales: async (kolId) => {
    const transaction = await db.sequelize.transaction();
    
    try {
      const user = await db.User.findByPk(kolId, { transaction });
      if (!user || !user.is_kol) {
        await transaction.rollback();
        return {
          errCode: 1,
          errMessage: 'KOL not found or user is not a KOL'
        };
      }

      // Calculate total sales from affiliate orders
      const totalSalesResult = await db.AffiliateOrders.sum('revenue', {
        where: { kolId: kolId },
        transaction
      });

      const totalSales = totalSalesResult || 0;

      // Update user's total sales
      await user.update({
        total_sales: totalSales
      }, { transaction });

      await transaction.commit();

      return {
        errCode: 0,
        errMessage: 'Total sales updated successfully',
        data: {
          kolId,
          totalSales,
          previousTotalSales: user.total_sales || 0
        }
      };
    } catch (error) {
      await transaction.rollback();
      console.error('Error updating KOL total sales:', error);
      return {
        errCode: -1,
        errMessage: 'Error updating total sales'
      };
    }
  },

  /**
   * Update KOL tier based on total sales
   * @param {number} kolId - KOL user ID
   * @param {boolean} recalculateSales - Whether to recalculate total sales first
   * @returns {Promise<Object>} - Tier update result
   */
  updateKolTier: async (kolId, recalculateSales = true) => {
    const transaction = await db.sequelize.transaction();
    
    try {
      const user = await db.User.findByPk(kolId, { transaction });
      if (!user || !user.is_kol) {
        await transaction.rollback();
        return {
          errCode: 1,
          errMessage: 'KOL not found or user is not a KOL'
        };
      }

      let totalSales = user.total_sales || 0;

      // Recalculate total sales if requested
      if (recalculateSales) {
        const salesResult = await kolTierService.updateKolTotalSales(kolId);
        if (salesResult.errCode === 0) {
          totalSales = salesResult.data.totalSales;
        }
      }

      // Get commission rate and tier based on total sales
      const { rate, tier, description } = commissionService.getCommissionRate(totalSales);

      const oldTier = user.kol_tier;
      const oldRate = user.kol_commission_rate;

      // Update user's tier and commission rate
      await user.update({
        kol_tier: tier,
        kol_commission_rate: rate * 100, // Store as percentage (5.00 for 5%)
        total_sales: totalSales
      }, { transaction });

      await transaction.commit();

      // Check if tier changed
      const tierChanged = oldTier !== tier;
      const rateChanged = oldRate !== (rate * 100);

      return {
        errCode: 0,
        errMessage: 'KOL tier updated successfully',
        data: {
          kolId,
          totalSales,
          oldTier,
          newTier: tier,
          oldCommissionRate: oldRate,
          newCommissionRate: rate * 100,
          tierChanged,
          rateChanged,
          description
        }
      };
    } catch (error) {
      await transaction.rollback();
      console.error('Error updating KOL tier:', error);
      return {
        errCode: -1,
        errMessage: 'Error updating KOL tier'
      };
    }
  },

  /**
   * Recalculate tiers for all KOLs
   * @param {Object} options - Options for batch processing
   * @returns {Promise<Object>} - Batch update results
   */
  recalculateAllKolTiers: async (options = {}) => {
    try {
      const { batchSize = 50, logProgress = true } = options;
      
      // Get all KOLs
      const kols = await db.User.findAll({
        where: { is_kol: true },
        attributes: ['id', 'email', 'firstName', 'lastName', 'kol_tier', 'total_sales'],
        order: [['id', 'ASC']]
      });

      if (kols.length === 0) {
        return {
          errCode: 0,
          errMessage: 'No KOLs found to update',
          data: { totalKols: 0, updated: 0, errors: 0 }
        };
      }

      let updated = 0;
      let errors = 0;
      const updateResults = [];

      // Process KOLs in batches
      for (let i = 0; i < kols.length; i += batchSize) {
        const batch = kols.slice(i, i + batchSize);
        
        if (logProgress) {
          console.log(`Processing KOL tier updates: ${i + 1}-${Math.min(i + batchSize, kols.length)} of ${kols.length}`);
        }

        // Process batch
        const batchPromises = batch.map(async (kol) => {
          try {
            const result = await kolTierService.updateKolTier(kol.id, true);
            if (result.errCode === 0) {
              updated++;
              return {
                kolId: kol.id,
                email: kol.email,
                success: true,
                ...result.data
              };
            } else {
              errors++;
              return {
                kolId: kol.id,
                email: kol.email,
                success: false,
                error: result.errMessage
              };
            }
          } catch (error) {
            errors++;
            console.error(`Error updating KOL ${kol.id}:`, error);
            return {
              kolId: kol.id,
              email: kol.email,
              success: false,
              error: error.message
            };
          }
        });

        const batchResults = await Promise.all(batchPromises);
        updateResults.push(...batchResults);

        // Small delay between batches to avoid overwhelming the database
        if (i + batchSize < kols.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      return {
        errCode: 0,
        errMessage: 'KOL tier recalculation completed',
        data: {
          totalKols: kols.length,
          updated,
          errors,
          results: updateResults
        }
      };
    } catch (error) {
      console.error('Error recalculating all KOL tiers:', error);
      return {
        errCode: -1,
        errMessage: 'Error recalculating KOL tiers'
      };
    }
  },

  /**
   * Get KOL tier statistics
   * @returns {Promise<Object>} - Tier distribution statistics
   */
  getKolTierStatistics: async () => {
    try {
      const tierStats = await db.User.findAll({
        where: { is_kol: true },
        attributes: [
          'kol_tier',
          [db.Sequelize.fn('COUNT', db.Sequelize.col('id')), 'count'],
          [db.Sequelize.fn('AVG', db.Sequelize.col('total_sales')), 'avg_sales'],
          [db.Sequelize.fn('SUM', db.Sequelize.col('total_sales')), 'total_sales'],
          [db.Sequelize.fn('MIN', db.Sequelize.col('total_sales')), 'min_sales'],
          [db.Sequelize.fn('MAX', db.Sequelize.col('total_sales')), 'max_sales']
        ],
        group: ['kol_tier'],
        raw: true
      });

      const totalKols = await db.User.count({
        where: { is_kol: true }
      });

      return {
        errCode: 0,
        errMessage: 'KOL tier statistics retrieved successfully',
        data: {
          totalKols,
          tierDistribution: tierStats,
          generatedAt: new Date()
        }
      };
    } catch (error) {
      console.error('Error getting KOL tier statistics:', error);
      return {
        errCode: -1,
        errMessage: 'Error retrieving tier statistics'
      };
    }
  },

  /**
   * Get KOLs eligible for tier upgrade
   * @returns {Promise<Object>} - KOLs that may need tier updates
   */
  getKolsEligibleForUpgrade: async () => {
    try {
      // Find KOLs with standard tier but sales >= 10000
      const eligibleKols = await db.User.findAll({
        where: {
          is_kol: true,
          [Op.or]: [
            {
              kol_tier: 'standard',
              total_sales: { [Op.gte]: 10000 }
            },
            {
              kol_tier: { [Op.is]: null },
              total_sales: { [Op.gte]: 10000 }
            }
          ]
        },
        attributes: ['id', 'email', 'firstName', 'lastName', 'kol_tier', 'total_sales', 'kol_commission_rate'],
        order: [['total_sales', 'DESC']]
      });

      return {
        errCode: 0,
        errMessage: 'Eligible KOLs retrieved successfully',
        data: {
          eligibleCount: eligibleKols.length,
          kols: eligibleKols
        }
      };
    } catch (error) {
      console.error('Error getting eligible KOLs:', error);
      return {
        errCode: -1,
        errMessage: 'Error retrieving eligible KOLs'
      };
    }
  },

  /**
   * Schedule tier recalculation (to be called by cron job)
   * @returns {Promise<Object>} - Scheduled recalculation result
   */
  scheduledTierRecalculation: async () => {
    try {
      console.log('Starting scheduled KOL tier recalculation...');
      
      const result = await kolTierService.recalculateAllKolTiers({
        batchSize: 25,
        logProgress: true
      });

      console.log('Scheduled KOL tier recalculation completed:', {
        totalKols: result.data?.totalKols || 0,
        updated: result.data?.updated || 0,
        errors: result.data?.errors || 0
      });

      return result;
    } catch (error) {
      console.error('Error in scheduled tier recalculation:', error);
      return {
        errCode: -1,
        errMessage: 'Error in scheduled recalculation'
      };
    }
  }
};

module.exports = kolTierService; 