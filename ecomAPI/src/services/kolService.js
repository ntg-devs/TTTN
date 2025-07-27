import db from "../models/index";
import emailService from "./emailService";
const { Op } = require("sequelize");

// KOL Tier Configuration
const KOL_TIERS = {
    GOLD: {
        name: 'gold',
        minFollowers: 100000,
        commissionRate: 10.00
    },
    STANDARD: {
        name: 'standard', 
        minFollowers: 10000,
        commissionRate: 5.00
    },
    BRONZE: {
        name: 'bronze',
        minFollowers: 0,
        commissionRate: 3.00
    }
};

// Email Templates
const EMAIL_TEMPLATES = {
    pending: (fullName) => ({
        subject: 'KOL Application Received | PTITSHOP',
        body: `
            <h3>Hello ${fullName}!</h3>
            <p>Thank you for applying to become a Key Opinion Leader (KOL) with PTITSHOP.</p>
            <p>Your application has been received and is currently under review by our team.</p>
            <p>We will notify you once a decision has been made regarding your application.</p>
            <p>Thank you for your interest in our KOL program!</p>
            <div>Best regards,</div>
            <div>PTITSHOP Team</div>
        `
    }),
    approved: (fullName) => ({
        subject: 'KOL Application Approved | PTITSHOP',
        body: `
            <h3>Congratulations ${fullName}!</h3>
            <p>We are pleased to inform you that your application to become a Key Opinion Leader (KOL) with PTITSHOP has been approved!</p>
            <p>You now have access to our KOL dashboard where you can:</p>
            <ul>
                <li>Browse products available for promotion</li>
                <li>Generate unique affiliate links</li>
                <li>Track your performance and earnings</li>
            </ul>
            <p>Your initial commission rate is set at 5%. This rate will increase to 10% once you generate 10,000 or more sales.</p>
            <p>Thank you for partnering with us!</p>
            <div>Best regards,</div>
            <div>PTITSHOP Team</div>
        `
    }),
    rejected: (fullName, reason) => ({
        subject: 'KOL Application Status | PTITSHOP',
        body: `
            <h3>Hello ${fullName},</h3>
            <p>Thank you for your interest in becoming a Key Opinion Leader (KOL) with PTITSHOP.</p>
            <p>After careful review, we regret to inform you that we are unable to approve your application at this time.</p>
            ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
            <p>You are welcome to apply again in the future with updated information.</p>
            <p>Thank you for your understanding.</p>
            <div>Best regards,</div>
            <div>PTITSHOP Team</div>
        `
    })
};

/**
 * Helper function to determine KOL tier based on follower count
 * @param {number} totalFollowers - Total number of followers
 * @returns {Object} - KOL tier configuration
 */
function determineKolTier(totalFollowers) {
    if (totalFollowers >= KOL_TIERS.GOLD.minFollowers) {
        return KOL_TIERS.GOLD;
    } else if (totalFollowers >= KOL_TIERS.STANDARD.minFollowers) {
        return KOL_TIERS.STANDARD;
    } else {
        return KOL_TIERS.BRONZE;
    }
}

/**
 * Helper function to prepare user update data for KOL approval
 * @param {string} status - Application status
 * @param {number} totalFollowers - Total number of followers
 * @returns {Object} - Update data object
 */
function prepareUserUpdateData(status, totalFollowers) {
    const updateData = {
        kol_status: status
    };

    if (status === 'approved') {
        const tier = determineKolTier(totalFollowers);
        updateData.is_kol = true;
        updateData.total_followers = totalFollowers;
        updateData.kol_tier = tier.name;
        updateData.kol_commission_rate = tier.commissionRate;
    }

    return updateData;
}

/**
 * Helper function to validate KOL application data
 * @param {Object} data - Application data
 * @returns {Object|null} - Error object if validation fails, null if valid
 */
function validateKolApplicationData(data) {
    const { userId, socialMediaLinks, identificationDocument } = data;
    
    if (!userId) {
        return { errCode: 1, errMessage: 'User ID is required' };
    }
    
    if (!socialMediaLinks || Object.keys(socialMediaLinks).length === 0) {
        return { errCode: 2, errMessage: 'At least one social media link is required' };
    }
    
    if (!identificationDocument || !identificationDocument.type || !identificationDocument.number) {
        return { errCode: 3, errMessage: 'Valid identification document is required' };
    }
    
    return null;
}

/**
 * Helper function to prepare social media links for database
 * @param {Object} socialMediaLinks - Social media links object
 * @returns {Object} - Database-ready social media links
 */
function prepareSocialMediaLinks(socialMediaLinks) {
    return {
        facebook_link: socialMediaLinks.facebook || null,
        instagram_link: socialMediaLinks.instagram || null,
        tiktok_link: socialMediaLinks.tiktok || null,
        youtube_link: socialMediaLinks.youtube || null,
        twitter_link: socialMediaLinks.twitter || null,
        other_link: socialMediaLinks.other || null
    };
}

/**
 * KOL Service
 * Handles business logic for KOL-related operations
 */
const kolService = {
    /**
     * Get all KOL applications with filtering and pagination
     * @param {Object} options - Query options
     * @param {string} options.status - Filter by status (optional)
     * @param {number} options.page - Page number for pagination
     * @param {number} options.limit - Number of items per page
     * @returns {Promise<Object>} - Response object with applications list and pagination info
     */
    getAllApplications: async (options) => {
        try {
            const { status, page = 1, limit = 10 } = options;
            
            // Build where clause for filtering
            const whereClause = {};
            if (status) {
                whereClause.status = status;
            }
            
            // Calculate offset for pagination
            const offset = (page - 1) * limit;
            
            // Get total count for pagination
            const totalCount = await db.KolRequest.count({
                where: whereClause
            });
            
            // Get applications with pagination
            const applications = await db.KolRequest.findAll({
                where: whereClause,
                limit: limit,
                offset: offset,
                order: [['createdAt', 'DESC']],
                attributes: [
                    'id', 
                    'userId', 
                    'status', 
                    'createdAt', 
                    'updatedAt', 
                    'reviewedBy', 
                    'reviewDate'
                ]
            });
            
            // Get user information for each application
            const applicationData = await Promise.all(applications.map(async (app) => {
                const user = await db.User.findOne({
                    where: { id: app.userId },
                    attributes: ['id', 'email', 'firstName', 'lastName', 'phoneNumber', 'image']
                });
                
                // Convert image buffer to base64 if exists
                let userImage = null;
                if (user && user.image) {
                    userImage = new Buffer(user.image, 'base64').toString('binary');
                }
                
                return {
                    id: app.id,
                    status: app.status,
                    createdAt: app.createdAt,
                    updatedAt: app.updatedAt,
                    reviewedBy: app.reviewedBy,
                    reviewDate: app.reviewDate,
                    user: user ? {
                        id: user.id,
                        email: user.email,
                        firstName: user.firstName,
                        lastName: user.lastName,
                        phoneNumber: user.phoneNumber,
                        image: userImage
                    } : null
                };
            }));
            
            // Calculate pagination info
            const totalPages = Math.ceil(totalCount / limit);
            
            return {
                errCode: 0,
                errMessage: 'KOL applications retrieved successfully',
                data: {
                    applications: applicationData,
                    pagination: {
                        totalItems: totalCount,
                        totalPages: totalPages,
                        currentPage: page,
                        limit: limit
                    }
                }
            };
        } catch (error) {
            console.error('Error in getAllApplications service:', error);
            return {
                errCode: -1,
                errMessage: 'Error from server'
            };
        }
    },
    /**
     * Get KOL application details by ID
     * @param {string} applicationId - KOL application ID
     * @returns {Promise<Object>} - Response object with application details
     */
    getApplicationDetails: async (applicationId) => {
        try {
            if (!applicationId) {
                return {
                    errCode: 1,
                    errMessage: 'Missing required parameter'
                };
            }
            
            // Find the KOL request
            const kolRequest = await db.KolRequest.findOne({
                where: { id: applicationId }
            });
            
            if (!kolRequest) {
                return {
                    errCode: 2,
                    errMessage: 'KOL application not found'
                };
            }
            
            // Find the user associated with the application
            const user = await db.User.findOne({
                where: { id: kolRequest.userId },
                attributes: ['id', 'email', 'firstName', 'lastName', 'phoneNumber', 'image', 'kol_status']
            });
            
            if (!user) {
                return {
                    errCode: 3,
                    errMessage: 'User not found'
                };
            }
            
            // Convert image buffer to base64 if exists
            let userImage = null;
            if (user.image) {
                userImage = new Buffer(user.image, 'base64').toString('binary');
            }
            
            // Return complete application details
            return {
                errCode: 0,
                errMessage: 'KOL application details retrieved successfully',
                data: {
                    application: {
                        id: kolRequest.id,
                        status: kolRequest.status,
                        socialMediaLinks: kolRequest.socialMediaLinks,
                        identificationDocument: kolRequest.identificationDocument,
                        createdAt: kolRequest.createdAt,
                        updatedAt: kolRequest.updatedAt,
                        reviewedBy: kolRequest.reviewedBy,
                        reviewDate: kolRequest.reviewDate,
                        reason: kolRequest.reason
                    },
                    user: {
                        id: user.id,
                        email: user.email,
                        firstName: user.firstName,
                        lastName: user.lastName,
                        phoneNumber: user.phoneNumber,
                        image: userImage,
                        kolStatus: user.kol_status
                    }
                }
            };
        } catch (error) {
            console.error('Error in getApplicationDetails service:', error);
            return {
                errCode: -1,
                errMessage: 'Error from server'
            };
        }
    },
    /**
     * Register a user as a KOL
     * @param {Object} data - Registration data
     * @param {number} data.userId - User ID
     * @param {Object} data.socialMediaLinks - Social media links
     * @param {Object} data.identificationDocument - Identification document details
     * @returns {Promise<Object>} - Response object
     */
    registerKol: async (data) => {
        try {
            const { userId, socialMediaLinks, identificationDocument } = data;
            
            // Check if user exists
            const user = await db.User.findOne({
                where: { id: userId }
            });
            
            if (!user) {
                return {
                    errCode: 1,
                    errMessage: 'User not found'
                };
            }
            
            // Check if user already has a pending or approved KOL request
            const existingRequest = await db.KolRequest.findOne({
                where: {
                    userId: userId,
                    status: {
                        [Op.in]: ['pending', 'approved']
                    }
                }
            });
            
            if (existingRequest) {
                return {
                    errCode: 2,
                    errMessage: existingRequest.status === 'pending' 
                        ? 'You already have a pending KOL application' 
                        : 'You are already approved as a KOL'
                };
            }
            
            // Create new KOL request
            const newKolRequest = await db.KolRequest.create({
                userId: userId,
                status: 'pending',
                socialMediaLinks: socialMediaLinks,
                identificationDocument: identificationDocument,
                createdAt: new Date(),
                updatedAt: new Date()
            });
            
            // Update user's KOL status
            await db.User.update({
                kol_status: 'pending',
                facebook_link: socialMediaLinks.facebook || null,
                instagram_link: socialMediaLinks.instagram || null,
                tiktok_link: socialMediaLinks.tiktok || null,
                youtube_link: socialMediaLinks.youtube || null,
                twitter_link: socialMediaLinks.twitter || null,
                other_link: socialMediaLinks.other || null
            }, {
                where: { id: userId }
            });
            
            // Send notification email
            await kolService.sendStatusNotification(user, 'pending');
            
            return {
                errCode: 0,
                errMessage: 'KOL application submitted successfully',
                data: {
                    id: newKolRequest.id,
                    status: newKolRequest.status,
                    createdAt: newKolRequest.createdAt
                }
            };
        } catch (error) {
            console.error('Error in registerKol service:', error);
            return {
                errCode: -1,
                errMessage: 'Error from server'
            };
        }
    },

    /**
     * Update KOL application status
     * @param {Object} data - Status update data
     * @param {number} data.requestId - KOL request ID
     * @param {string} data.status - New status ('approved' or 'rejected')
     * @param {string} data.reason - Reason for rejection (required if status is 'rejected')
     * @param {number} data.reviewerId - ID of the staff member reviewing the application
     * @returns {Promise<Object>} - Response object
     */
    updateApplicationStatus: async (data) => {
        try {
            const { requestId, status, reason, reviewerId, total_followers } = data;
            
            // Validate input
            if (!requestId || !status || !reviewerId) {
                return {
                    errCode: 1,
                    errMessage: 'Missing required parameters'
                };
            }
            
            if (status === 'rejected' && !reason) {
                return {
                    errCode: 2,
                    errMessage: 'Reason is required for rejection'
                };
            }
            
            // Find the KOL request
            const kolRequest = await db.KolRequest.findOne({
                where: { id: requestId }
            });
            
            if (!kolRequest) {
                return {
                    errCode: 3,
                    errMessage: 'KOL application not found'
                };
            }
            
            // Find the user
            const user = await db.User.findOne({
                where: { id: kolRequest.userId }
            });
            
            if (!user) {
                return {
                    errCode: 4,
                    errMessage: 'User not found'
                };
            }
            
            // Update KOL request status
            await db.KolRequest.update({
                status: status,
                reason: status === 'rejected' ? reason : null,
                reviewedBy: reviewerId,
                reviewDate: new Date(),
                updatedAt: new Date()
            }, {
                where: { id: requestId }
            });
            
            // Update user's KOL status
            const updateData = prepareUserUpdateData(status, total_followers);
            
            await db.User.update(updateData, {
                where: { id: kolRequest.userId }
            });
            
            // Send notification email
            await kolService.sendStatusNotification(user, status, reason);
            
            return {
                errCode: 0,
                errMessage: `KOL application ${status} successfully`,
                data: {
                    id: kolRequest.id,
                    status: status,
                    updatedAt: new Date()
                }
            };
        } catch (error) {
            console.error('Error in updateApplicationStatus service:', error);
            return {
                errCode: -1,
                errMessage: 'Error from server'
            };
        }
    },

    /**
     * Get KOL application status
     * @param {number} userId - User ID
     * @returns {Promise<Object>} - Response object with status information
     */
    getApplicationStatus: async (userId) => {
        try {
            if (!userId) {
                return {
                    errCode: 1,
                    errMessage: 'Missing required parameter'
                };
            }
            
            // Find the user
            const user = await db.User.findOne({
                where: { id: userId }
            });
            
            if (!user) {
                return {
                    errCode: 2,
                    errMessage: 'User not found'
                };
            }
            
            // Find the latest KOL request
            const kolRequest = await db.KolRequest.findOne({
                where: { userId: userId },
                order: [['createdAt', 'DESC']]
            });
            
            if (!kolRequest) {
                return {
                    errCode: 3,
                    errMessage: 'No KOL application found',
                    data: {
                        hasApplied: false
                    }
                };
            }
            
            return {
                errCode: 0,
                errMessage: 'KOL application status retrieved successfully',
                data: {
                    hasApplied: true,
                    status: kolRequest.status,
                    applicationDate: kolRequest.createdAt,
                    reviewDate: kolRequest.reviewDate,
                    reason: kolRequest.reason,
                    socialMediaLinks: kolRequest.socialMediaLinks,
                    identificationDocument: kolRequest.identificationDocument
                }
            };
        } catch (error) {
            console.error('Error in getApplicationStatus service:', error);
            return {
                errCode: -1,
                errMessage: 'Error from server'
            };
        }
    },

    /**
     * Send notification email based on application status
     * @param {Object} user - User object
     * @param {string} status - Application status
     * @param {string} reason - Reason for rejection (optional)
     * @returns {Promise<void>}
     */
    sendStatusNotification: async (user, status, reason = null) => {
        try {
            // Prepare email data based on status
            const fullName = `${user.firstName} ${user.lastName}`;
            
            // Get email template for the status
            const emailTemplate = EMAIL_TEMPLATES[status];
            if (!emailTemplate) {
                return; // Don't send email for unknown status
            }
            
            const emailData = status === 'rejected' 
                ? emailTemplate(fullName, reason)
                : emailTemplate(fullName);
            
            // Send email notification
            await emailService.sendSimpleEmail({
                type: 'kolStatus',
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                subject: emailData.subject,
                htmlContent: emailData.body
            });
            
        } catch (error) {
            console.error('Error sending notification email:', error);
            // Don't throw error, just log it - we don't want to fail the main operation
        }
    }
};

module.exports = kolService;