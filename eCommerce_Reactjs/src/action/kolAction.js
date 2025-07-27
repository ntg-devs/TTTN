import { getKolStatus } from '../services/kolService';

// Action Types
export const FETCH_KOL_STATUS_START = 'FETCH_KOL_STATUS_START';
export const FETCH_KOL_STATUS_SUCCESS = 'FETCH_KOL_STATUS_SUCCESS';
export const FETCH_KOL_STATUS_FAILURE = 'FETCH_KOL_STATUS_FAILURE';
export const SET_KOL_STATUS = 'SET_KOL_STATUS';
export const CLEAR_KOL_STATUS = 'CLEAR_KOL_STATUS';

// Action Creators
export const fetchKolStatusStart = () => ({
    type: FETCH_KOL_STATUS_START
});

export const fetchKolStatusSuccess = (data) => ({
    type: FETCH_KOL_STATUS_SUCCESS,
    payload: data
});

export const fetchKolStatusFailure = (error) => ({
    type: FETCH_KOL_STATUS_FAILURE,
    payload: error
});

export const setKolStatus = (status) => ({
    type: SET_KOL_STATUS,
    payload: status
});

export const clearKolStatus = () => ({
    type: CLEAR_KOL_STATUS
});

// Thunk Action Creator
export const fetchKolStatus = () => {
    return async (dispatch, getState) => {
        // Check if we already have KOL status and it's not loading
        const { kol } = getState();
        if (kol.kolStatus && !kol.isLoading) {
            return; // Already have data, don't fetch again
        }

        try {
            dispatch(fetchKolStatusStart());
            const response = await getKolStatus();
            
            if (response && response.errCode === 0) {
                dispatch(fetchKolStatusSuccess(response.data));
            } else {
                dispatch(fetchKolStatusFailure(response?.errMessage || 'Failed to fetch KOL status'));
            }
        } catch (error) {
            console.error('Error fetching KOL status:', error);
            dispatch(fetchKolStatusFailure('Error fetching KOL status'));
        }
    };
}; 