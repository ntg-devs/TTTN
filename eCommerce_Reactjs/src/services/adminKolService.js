import axios from "../axios";

/**
 * Get all KOL applications with filtering and pagination
 * @param {Object} params - Query parameters
 * @param {string} params.status - Filter by status (optional)
 * @param {number} params.page - Page number (default: 1)
 * @param {number} params.limit - Items per page (default: 10)
 * @returns {Promise<Object>} - Response object with applications list
 */
const getAllKolApplications = (params = {}) => {
    const { status, page = 1, limit = 10 } = params;
    let queryParams = `page=${page}&limit=${limit}`;
    
    if (status) {
        queryParams += `&status=${status}`;
    }
    
    return axios.get(`/api/admin/kol/applications?${queryParams}`);
};

/**
 * Get KOL application details by ID
 * @param {string} id - Application ID
 * @returns {Promise<Object>} - Response object with application details
 */
const getKolApplicationDetails = (id) => {
    return axios.get(`/api/admin/kol/applications/${id}`);
};

/**
 * Approve KOL application
 * @param {string} id - Application ID
 * @param {Object} data - Approval data
 * @param {string} data.reason - Reason for approval
 * @param {number} data.total_followers - Total followers count
 * @returns {Promise<Object>} - Response object
 */
const approveKolApplication = (id, data = {}) => {
    return axios.put(`/api/admin/kol/applications/${id}/approve`, data);
};

/**
 * Reject KOL application
 * @param {string} id - Application ID
 * @param {Object} data - Rejection data
 * @param {string} data.reason - Reason for rejection
 * @returns {Promise<Object>} - Response object
 */
const rejectKolApplication = (id, data) => {
    return axios.put(`/api/admin/kol/applications/${id}/reject`, data);
};

export {
    getAllKolApplications,
    getKolApplicationDetails,
    approveKolApplication,
    rejectKolApplication
};