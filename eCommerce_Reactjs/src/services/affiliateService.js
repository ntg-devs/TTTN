import axios from "../axios";

/**
 * Get products available for KOL promotion
 * @param {Object} params - Query parameters
 * @param {string} params.search - Search term (optional)
 * @param {string} params.category - Category filter (optional)
 * @param {number} params.page - Page number (default: 1)
 * @param {number} params.limit - Items per page (default: 12)
 * @returns {Promise<Object>} - Response object with products list
 */
const getProducts = (params = {}) => {
    const { search, category, page = 1, limit = 12 } = params;
    let queryParams = `page=${page}&limit=${limit}`;
    
    if (search) {
        queryParams += `&search=${encodeURIComponent(search)}`;
    }
    
    if (category) {
        queryParams += `&category=${category}`;
    }
    
    return axios.get(`/api/products?${queryParams}`);
};

/**
 * Generate affiliate link for a product
 * @param {Object} data - Link generation data
 * @param {string} data.productId - Product ID
 * @returns {Promise<Object>} - Response object with generated link
 */
const generateAffiliateLink = (data) => {
    return axios.post(`/api/affiliate/links`, data);
};

/**
 * Get KOL's affiliate links
 * @param {Object} params - Query parameters
 * @param {number} params.page - Page number (default: 1)
 * @param {number} params.limit - Items per page (default: 10)
 * @returns {Promise<Object>} - Response object with affiliate links
 */
const getAffiliateLinks = (params = {}) => {
    const { page = 1, limit = 10 } = params;
    const queryParams = `page=${page}&limit=${limit}`;
    
    return axios.get(`/api/affiliate/links?${queryParams}`);
};

/**
 * Get statistics for a specific affiliate link
 * @param {string} linkId - Affiliate link ID
 * @returns {Promise<Object>} - Response object with link statistics
 */
const getLinkStats = (linkId) => {
    return axios.get(`/api/affiliate/links/${linkId}/stats`);
};

/**
 * Get KOL dashboard data
 * @param {Object} params - Query parameters
 * @param {string} params.startDate - Start date for filtering (optional)
 * @param {string} params.endDate - End date for filtering (optional)
 * @returns {Promise<Object>} - Response object with dashboard data
 */
const getDashboardData = (params = {}) => {
    const { startDate, endDate } = params;
    let queryParams = '';
    
    if (startDate) {
        queryParams += `startDate=${startDate}`;
    }
    
    if (endDate) {
        queryParams += `${queryParams ? '&' : ''}endDate=${endDate}`;
    }
    
    const url = `/api/affiliate/dashboard${queryParams ? `?${queryParams}` : ''}`;
    return axios.get(url);
};
/**
 * Get product detail by short code
 * @param {string} shortCode - Short code
 * @returns {Promise<Object>} - Response object with product detail
 */
const getProductDetailByShortCode = (shortCode) => {
    return axios.get(`/api/aff/${shortCode}`);
};

export {
    getProducts,
    generateAffiliateLink,
    getAffiliateLinks,
    getLinkStats,
    getDashboardData,
    getProductDetailByShortCode
};