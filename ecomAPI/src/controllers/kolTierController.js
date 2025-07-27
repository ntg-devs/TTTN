const kolTierService = require('../services/kolTierService');
const schedulerService = require('../services/schedulerService');

/**
 * KOL Tier Controller
 * Handles HTTP requests for KOL tier management
 */
const kolTierController = {
  /**
   * Update a specific KOL's tier
   * POST /api/admin/kol/tier/update
   */
  updateKolTier: async (req, res) => {
    try {
      const { kolId, recalculateSales = true } = req.body;

      if (!kolId) {
        return res.status(400).json({
          errCode: 1,
          errMessage: 'KOL ID is required'
        });
      }

      const result = await kolTierService.updateKolTier(kolId, recalculateSales);
      
      if (result.errCode === 0) {
        return res.status(200).json(result);
      } else {
        return res.status(400).json(result);
      }
    } catch (error) {
      console.error('Error in updateKolTier controller:', error);
      return res.status(500).json({
        errCode: -1,
        errMessage: 'Internal server error'
      });
    }
  },

  /**
   * Recalculate all KOL tiers
   * POST /api/admin/kol/tier/recalculate-all
   */
  recalculateAllTiers: async (req, res) => {
    try {
      const { batchSize = 50 } = req.body;

      const result = await kolTierService.recalculateAllKolTiers({
        batchSize,
        logProgress: true
      });

      if (result.errCode === 0) {
        return res.status(200).json(result);
      } else {
        return res.status(500).json(result);
      }
    } catch (error) {
      console.error('Error in recalculateAllTiers controller:', error);
      return res.status(500).json({
        errCode: -1,
        errMessage: 'Internal server error'
      });
    }
  },

  /**
   * Get KOL tier statistics
   * GET /api/admin/kol/tier/statistics
   */
  getTierStatistics: async (req, res) => {
    try {
      const result = await kolTierService.getKolTierStatistics();

      if (result.errCode === 0) {
        return res.status(200).json(result);
      } else {
        return res.status(500).json(result);
      }
    } catch (error) {
      console.error('Error in getTierStatistics controller:', error);
      return res.status(500).json({
        errCode: -1,
        errMessage: 'Internal server error'
      });
    }
  },

  /**
   * Get KOLs eligible for tier upgrade
   * GET /api/admin/kol/tier/eligible-upgrades
   */
  getEligibleUpgrades: async (req, res) => {
    try {
      const result = await kolTierService.getKolsEligibleForUpgrade();

      if (result.errCode === 0) {
        return res.status(200).json(result);
      } else {
        return res.status(500).json(result);
      }
    } catch (error) {
      console.error('Error in getEligibleUpgrades controller:', error);
      return res.status(500).json({
        errCode: -1,
        errMessage: 'Internal server error'
      });
    }
  },

  /**
   * Manually trigger scheduled tier recalculation
   * POST /api/admin/kol/tier/trigger-scheduled
   */
  triggerScheduledRecalculation: async (req, res) => {
    try {
      const result = await schedulerService.triggerKolTierRecalculation();

      if (result.errCode === 0) {
        return res.status(200).json(result);
      } else {
        return res.status(500).json(result);
      }
    } catch (error) {
      console.error('Error in triggerScheduledRecalculation controller:', error);
      return res.status(500).json({
        errCode: -1,
        errMessage: 'Internal server error'
      });
    }
  },

  /**
   * Get scheduler status
   * GET /api/admin/kol/tier/scheduler-status
   */
  getSchedulerStatus: async (req, res) => {
    try {
      const status = schedulerService.getScheduledTasksStatus();
      
      return res.status(200).json({
        errCode: 0,
        errMessage: 'Scheduler status retrieved successfully',
        data: status
      });
    } catch (error) {
      console.error('Error in getSchedulerStatus controller:', error);
      return res.status(500).json({
        errCode: -1,
        errMessage: 'Internal server error'
      });
    }
  },

  /**
   * Get KOL's current tier and commission info
   * GET /api/kol/tier/info/:kolId
   */
  getKolTierInfo: async (req, res) => {
    try {
      const { kolId } = req.params;

      if (!kolId) {
        return res.status(400).json({
          errCode: 1,
          errMessage: 'KOL ID is required'
        });
      }

      const result = await kolTierService.updateKolTotalSales(parseInt(kolId));
      
      if (result.errCode === 0) {
        // Get updated commission info
        const commissionService = require('../services/commissionService');
        const commissionInfo = await commissionService.getKolCommissionInfo(parseInt(kolId));
        
        return res.status(200).json({
          errCode: 0,
          errMessage: 'KOL tier info retrieved successfully',
          data: {
            salesInfo: result.data,
            commissionInfo: commissionInfo.data
          }
        });
      } else {
        return res.status(400).json(result);
      }
    } catch (error) {
      console.error('Error in getKolTierInfo controller:', error);
      return res.status(500).json({
        errCode: -1,
        errMessage: 'Internal server error'
      });
    }
  }
};

module.exports = kolTierController;