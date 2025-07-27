const db = require('../models');
const { Op } = require('sequelize');

/**
 * Handle multi-product attribution for affiliate clicks
 * POST /api/affiliate/multi-attribution
 */
const handleMultiProductAttribution = async (req, res) => {
    try {
        const { kolId, productIds, sessionId, clickData } = req.body;
        
        if (!kolId || !productIds || !Array.isArray(productIds) || productIds.length === 0) {
            return res.status(400).json({
                errCode: 1,
                errMessage: 'Missing required parameters: kolId and productIds array'
            });
        }
        
        // Store attribution data in session or temporary storage
        // This would typically be stored in Redis or a similar session store
        const attributionData = {
            kolId,
            productIds,
            sessionId,
            clickData,
            timestamp: new Date(),
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
        };
        
        // For now, we'll store it in a simple object (in production, use Redis)
        if (!global.attributionStore) {
            global.attributionStore = new Map();
        }
        
        global.attributionStore.set(sessionId, attributionData);
        
        return res.status(200).json({
            errCode: 0,
            errMessage: 'Multi-product attribution stored successfully',
            data: {
                sessionId,
                attributedProducts: productIds.length
            }
        });
    } catch (error) {
        console.error('Error handling multi-product attribution:', error);
        return res.status(500).json({
            errCode: -1,
            errMessage: 'Error from server'
        });
    }
};

/**
 * Clear attribution data after order completion
 * POST /api/affiliate/clear-attribution
 */
const clearAttributionAfterOrder = async (req, res) => {
    try {
        const { sessionId, orderId } = req.body;
        
        if (!sessionId || !orderId) {
            return res.status(400).json({
                errCode: 1,
                errMessage: 'Missing required parameters: sessionId and orderId'
            });
        }
        
        // Clear attribution data from storage
        if (global.attributionStore && global.attributionStore.has(sessionId)) {
            const attributionData = global.attributionStore.get(sessionId);
            
            // Here you would typically:
            // 1. Process the attribution data
            // 2. Create commission transactions for each attributed product
            // 3. Clear the session data
            
            // For now, just clear the data
            global.attributionStore.delete(sessionId);
            
            return res.status(200).json({
                errCode: 0,
                errMessage: 'Attribution data cleared successfully',
                data: {
                    sessionId,
                    orderId,
                    clearedAt: new Date()
                }
            });
        } else {
            return res.status(404).json({
                errCode: 2,
                errMessage: 'Attribution data not found for session'
            });
        }
    } catch (error) {
        console.error('Error clearing attribution data:', error);
        return res.status(500).json({
            errCode: -1,
            errMessage: 'Error from server'
        });
    }
};

module.exports = {
    handleMultiProductAttribution,
    clearAttributionAfterOrder
}; 