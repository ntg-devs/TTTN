import axios from "../axios";

/**
 * Register a user as a KOL
 * @param {Object} data - Registration data
 * @param {Object} data.socialMediaLinks - Social media links
 * @param {Object} data.identificationDocument - Identification document details
 * @returns {Promise<Object>} - Response object
 */
const registerKol = (data) => {
    return axios.post(`/api/kol/register`, data);
};

/**
 * Get KOL application status
 * @returns {Promise<Object>} - Response object with status information
 */
const getKolStatus = () => {
    return axios.get(`/api/kol/status`);
};

/**
 * Get KOL profile information
 * @returns {Promise<Object>} - Response object with KOL profile data
 */
const getKolProfile = () => {
    return axios.get(`/api/kol/profile`);
};

/**
 * Update KOL profile information
 * @param {Object} data - Profile data to update
 * @returns {Promise<Object>} - Response object
 */
const updateKolProfile = (data) => {
    return axios.put(`/api/kol/profile`, data);
};

export {
    registerKol,
    getKolStatus,
    getKolProfile,
    updateKolProfile
};