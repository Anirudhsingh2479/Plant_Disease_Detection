import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../api/axiosInstance'; // Ensure path is correct

const AUTH_STORAGE_KEY = 'authState';

const loadPersistedAuthState = () => {
    try {
        const persistedAuth = localStorage.getItem(AUTH_STORAGE_KEY);

        if (!persistedAuth) {
            return { user: null, token: null };
        }

        const parsedAuth = JSON.parse(persistedAuth);

        return {
            user: parsedAuth.user || null,
            token: parsedAuth.token || null,
        };
    } catch {
        localStorage.removeItem(AUTH_STORAGE_KEY);
        return { user: null, token: null };
    }
};

const persistedAuthState = loadPersistedAuthState();

export const loginUser = createAsyncThunk(
    'auth/loginUser', 
    async (credentials, { rejectWithValue }) => {
        try {
            // FIXED: response spelling
            const response = await axiosInstance.post('/auth/login', credentials);
            return response.data;
        } catch(error) {
            return rejectWithValue(error.response?.data?.message || 'Login Failed');
        }
    }
);

export const registerUser = createAsyncThunk(
    'auth/registerUser',
    async (userData, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.post('/auth/signup', userData);
            // REMOVED auto-login logic. We just return the response 
            // so the user is forced to log in on the next screen.
            return response.data;
        } catch(error) {
            return rejectWithValue(error.response?.data?.message || 'Registration Failed');
        }
    }
);

export const verifyEmailToken = createAsyncThunk(
    'auth/verifyEmailToken',
    async (token, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.get(`/auth/verify/${encodeURIComponent(token)}`);
            return response.data;
        } catch(error) {
            return rejectWithValue(error.response?.data?.message || 'Email verification failed');
        }
    }
);

const authSlice = createSlice({
    name: 'auth',
    // FIXED: initialState spelling
    initialState: {
        user: persistedAuthState.user,
        token: persistedAuthState.token,
        isLoading: false,
        error: null,
    },
    reducers: {
        logout: (state) => {
            state.user = null;
            state.token = null;
            state.error = null;
            axiosInstance.post('/auth/logout').catch(() => {});
        },
    },
    extraReducers: (builder) => {
        builder
        .addCase(loginUser.pending, (state) => {
            // FIXED: period instead of comma
            state.isLoading = true;
            state.error = null;
        })
        .addCase(loginUser.fulfilled, (state, action) => {

           
            state.isLoading = false;
             console.log("WHAT DID THE BACKEND SEND?", action.payload);
            state.user = action.payload.result.user;
            state.token = action.payload.result.token;
        })
        .addCase(loginUser.rejected, (state, action) => {
            state.isLoading = false;
            state.error = action.payload || 'Login Failed';
        })
        .addCase(registerUser.pending, (state) => {
            state.isLoading = true;
            state.error = null;
        })
        .addCase(registerUser.fulfilled, (state) => {
            state.isLoading = false;
            // Note: We are NOT setting state.token here, because we want 
            // them to navigate to the login page first.
        })
        .addCase(registerUser.rejected, (state, action) => {
            state.isLoading = false;
            state.error = action.payload || 'Registration Failed';
        })
        .addCase(verifyEmailToken.pending, (state) => {
            state.isLoading = true;
            state.error = null;
        })
        .addCase(verifyEmailToken.fulfilled, (state, action) => {
            state.isLoading = false;
            state.user = action.payload.result.user;
            state.token = action.payload.result.token;
        })
        .addCase(verifyEmailToken.rejected, (state, action) => {
            state.isLoading = false;
            state.error = action.payload || 'Email verification failed';
        });
    },
});

export const { logout } = authSlice.actions;
// FIXED: reducer instead of reducers
export default authSlice.reducer;