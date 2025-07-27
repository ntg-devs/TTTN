// KOL Reducer
const initialState = {
    kolStatus: null,
    isLoading: false,
    error: null,
    isKol: false
};

const kolReducer = (state = initialState, action) => {
    switch (action.type) {
        case 'FETCH_KOL_STATUS_START':
            return {
                ...state,
                isLoading: true,
                error: null
            };
        
        case 'FETCH_KOL_STATUS_SUCCESS':
            return {
                ...state,
                kolStatus: action.payload,
                isLoading: false,
                error: null,
                isKol: action.payload && action.payload.status === 'approved'
            };
        
        case 'FETCH_KOL_STATUS_FAILURE':
            return {
                ...state,
                isLoading: false,
                error: action.payload
            };
        
        case 'SET_KOL_STATUS':
            return {
                ...state,
                kolStatus: action.payload,
                isKol: action.payload && action.payload.status === 'approved'
            };
        
        case 'CLEAR_KOL_STATUS':
            return {
                ...state,
                kolStatus: null,
                isLoading: false,
                error: null,
                isKol: false
            };
        
        default:
            return state;
    }
};

export default kolReducer; 