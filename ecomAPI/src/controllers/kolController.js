import kolService from '../services/kolService';

const kolController = {
    /**
     * Get all KOL applications with filtering and pagination (for admin)
     * GET /api/admin/kol/applications
     */
    getAllApplications: async (req, res) => {
        try {
            // Get query parameters for filtering and pagination
            const { status, page, limit } = req.query;
            
            // Call service to get applications
            const response = await kolService.getAllApplications({
                status,
                page: parseInt(page) || 1,
                limit: parseInt(limit) || 10
            });
            
            return res.status(200).json(response);
        } catch (error) {
            console.error('Error getting KOL applications:', error);
            return res.status(500).json({
                errCode: -1,
                errMessage: 'Error from server'
            });
        }
    },
    
    /**
     * Get KOL application details by ID (for admin)
     * GET /api/admin/kol/applications/:id
     */
    getApplicationDetails: async (req, res) => {
        try {
            // Get application ID from URL params
            const applicationId = req.params.id;
            
            if (!applicationId) {
                return res.status(400).json({
                    errCode: 1,
                    errMessage: 'Missing application ID'
                });
            }
            
            // Call service to get application details
            const response = await kolService.getApplicationDetails(applicationId);
            
            return res.status(200).json(response);
        } catch (error) {
            console.error('Error getting KOL application details:', error);
            return res.status(500).json({
                errCode: -1,
                errMessage: 'Error from server'
            });
        }
    },

    /**
     * Handle KOL registration
     * POST /api/kol/register
     */
    handleKolRegistration: async (req, res) => {
        try {
            // Get data from request body
            const { 
                socialMediaLinks, 
                identificationDocument 
            } = req.body;
            
            // Get user ID from JWT token (set by middleware)
            const userId = req.user.id;
            
            if (!userId) {
                return res.status(401).json({
                    errCode: 1,
                    errMessage: 'User not authenticated'
                });
            }
            
            // Validate required fields
            if (!socialMediaLinks || Object.keys(socialMediaLinks).length === 0) {
                return res.status(400).json({
                    errCode: 2,
                    errMessage: 'Social media links are required'
                });
            }
            
            if (!identificationDocument || !identificationDocument.documentType || !identificationDocument.documentNumber) {
                return res.status(400).json({
                    errCode: 3,
                    errMessage: 'Identification document details are required'
                });
            }
            
            // Call service to handle registration
            const response = await kolService.registerKol({
                userId,
                socialMediaLinks,
                identificationDocument
            });
            
            return res.status(200).json(response);
        } catch (error) {
            console.error('Error in KOL registration:', error);
            return res.status(500).json({
                errCode: -1,
                errMessage: 'Error from server'
            });
        }
    },

    /**
     * Handle KOL application status update (for admin)
     * PUT /api/admin/kol/applications/:id/approve or /api/admin/kol/applications/:id/reject
     */
    handleUpdateApplicationStatus: async (req, res) => {
        try {
            // Get request ID from URL params
            const requestId = req.params.id;
            
            // Get status from URL path (approve or reject)
            const status = req.path.endsWith('/approve') ? 'approved' : 'rejected';
            
            // Get reason from request body (required for rejection)
            const { reason, total_followers } = req.body || {};
            
            // Get admin ID from JWT token
            const reviewerId = req.user.id;
            
            // Call service to update status
            const response = await kolService.updateApplicationStatus({
                requestId,
                status,
                reason,
                reviewerId,
                total_followers
            });
            
            return res.status(200).json(response);
        } catch (error) {
            console.error('Error updating KOL application status:', error);
            return res.status(500).json({
                errCode: -1,
                errMessage: 'Error from server'
            });
        }
    },

    /**
     * Get KOL application status
     * GET /api/kol/status
     */
    getApplicationStatus: async (req, res) => {
        try {
            // Get user ID from JWT token
            const userId = req.user.id;
            
            if (!userId) {
                return res.status(401).json({
                    errCode: 1,
                    errMessage: 'User not authenticated'
                });
            }
            
            // Call service to get status
            const response = await kolService.getApplicationStatus(userId);
            
            return res.status(200).json(response);
        } catch (error) {
            console.error('Error getting KOL application status:', error);
            return res.status(500).json({
                errCode: -1,
                errMessage: 'Error from server'
            });
        }
    }
};

module.exports = kolController;