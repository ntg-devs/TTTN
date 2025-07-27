/**
 * Utility functions for handling affiliate attribution
 */

// Key for storing affiliate attribution in localStorage
const AFFILIATE_ATTRIBUTION_KEY = 'affiliate_attribution';

// Attribution expiry time (24 hours in milliseconds)
const ATTRIBUTION_EXPIRY_TIME = 24 * 60 * 60 * 1000;

/**
 * Store affiliate attribution data
 * @param {string} kolId - The KOL ID from the URL
 * @param {string} affiliateId - The affiliate link ID
 * @param {string} productId - The product ID being viewed
 * @param {string} shortCode - The short code used
 */
export const storeAffiliateAttribution = (kolId, affiliateId, productId, shortCode = null) => {
    try {
        const attributionData = {
            kolId: parseInt(kolId),
            affiliateId: parseInt(affiliateId),
            productId: parseInt(productId),
            shortCode,
            timestamp: Date.now(),
            expiresAt: Date.now() + ATTRIBUTION_EXPIRY_TIME
        };
        
        localStorage.setItem(AFFILIATE_ATTRIBUTION_KEY, JSON.stringify(attributionData));
        
        // Also store in sessionStorage as backup
        sessionStorage.setItem(AFFILIATE_ATTRIBUTION_KEY, JSON.stringify(attributionData));
        
        console.log('Affiliate attribution stored:', attributionData);
    } catch (error) {
        console.error('Error storing affiliate attribution:', error);
    }
};

/**
 * Get current affiliate attribution data
 * @returns {Object|null} Attribution data or null if expired/not found
 */
export const getAffiliateAttribution = () => {
    try {
        // Try localStorage first, then sessionStorage
        let attributionData = localStorage.getItem(AFFILIATE_ATTRIBUTION_KEY);
        if (!attributionData) {
            attributionData = sessionStorage.getItem(AFFILIATE_ATTRIBUTION_KEY);
        }
        
        if (!attributionData) {
            return null;
        }
        
        const parsedData = JSON.parse(attributionData);
        
        // Check if attribution has expired
        if (Date.now() > parsedData.expiresAt) {
            clearAffiliateAttribution();
            return null;
        }
        
        return parsedData;
    } catch (error) {
        console.error('Error getting affiliate attribution:', error);
        return null;
    }
};

/**
 * Clear affiliate attribution data
 */
export const clearAffiliateAttribution = () => {
    try {
        localStorage.removeItem(AFFILIATE_ATTRIBUTION_KEY);
        sessionStorage.removeItem(AFFILIATE_ATTRIBUTION_KEY);
    } catch (error) {
        console.error('Error clearing affiliate attribution:', error);
    }
};

/**
 * Check if there's valid affiliate attribution
 * @returns {boolean} True if valid attribution exists
 */
export const hasValidAttribution = () => {
    const attribution = getAffiliateAttribution();
    return attribution !== null;
};

/**
 * Extract affiliate code from URL parameters
 * @param {URLSearchParams} searchParams - URL search parameters
 * @returns {string|null} Affiliate code or null if not found
 */
export const extractAffiliateCode = (searchParams) => {
    // Check for common affiliate parameter names
    const affiliateParams = ['ref', 'affiliate', 'aff', 'kol'];
    
    for (const param of affiliateParams) {
        const value = searchParams.get(param);
        if (value) {
            return value;
        }
    }
    
    return null;
};