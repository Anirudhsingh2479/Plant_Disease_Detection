import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axiosInstance from '../../api/axiosInstance';

export const checkAuth = createAsyncThunk(
    'auth/checkAuth',
    async (_, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.get('/auth/me');
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Not authenticated');
        }
    },
);

export const loginUser = createAsyncThunk(
    'auth/loginUser',
    async (credentials, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.post('/auth/login', credentials);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Login Failed');
        }
    },
);

export const registerUser = createAsyncThunk(
    'auth/registerUser',
    async (userData, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.post('/auth/signup', userData);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Registration Failed');
        }
    },
);

export const verifyEmailToken = createAsyncThunk(
    'auth/verifyEmailToken',
    async (token, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.get(`/auth/verify/${encodeURIComponent(token)}`);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Email verification failed');
        }
    },
);

export const refreshTokenThunk = createAsyncThunk(
    'auth/refreshToken',
    async (_, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.post('/auth/refresh');
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Token refresh failed');
        }
    },
);

export const logoutUser = createAsyncThunk(
    'auth/logoutUser',
    async () => {
        try {
            await axiosInstance.post('/auth/logout');
        } catch {
            // Ignore network errors on logout to ensure client resets state regardless
        }
    },
);

const extractUser = (payload) => payload?.result?.user || payload?.user || null;

const authSlice = createSlice({
    name: 'auth',
    initialState: {
        user: null,
        isLoading: false,
        authChecked: false,
        error: null,
    },
    reducers: {
        clearAuthError: (state) => {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
        .addCase(checkAuth.pending, (state) => {
            state.isLoading = true;
        })
        .addCase(checkAuth.fulfilled, (state, action) => {
            state.isLoading = false;
            state.authChecked = true;
            state.user = extractUser(action.payload);
            state.error = null;
        })
        .addCase(checkAuth.rejected, (state) => {
            state.isLoading = false;
            state.authChecked = true;
            state.user = null;
        })
        .addCase(loginUser.pending, (state) => {
            state.isLoading = true;
            state.error = null;
        })
        .addCase(loginUser.fulfilled, (state, action) => {
            state.isLoading = false;
            state.authChecked = true;
            state.user = extractUser(action.payload);
            state.error = null;
        })
        .addCase(loginUser.rejected, (state, action) => {
            state.isLoading = false;
            state.authChecked = true;
            state.user = null;
            state.error = action.payload || 'Login Failed';
        })
        .addCase(registerUser.pending, (state) => {
            state.isLoading = true;
            state.error = null;
        })
        .addCase(registerUser.fulfilled, (state) => {
            state.isLoading = false;
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
            state.authChecked = true;
            state.user = extractUser(action.payload);
            state.error = null;
        })
        .addCase(verifyEmailToken.rejected, (state, action) => {
            state.isLoading = false;
            state.authChecked = true;
            state.user = null;
            state.error = action.payload || 'Email verification failed';
        })
        .addCase(refreshTokenThunk.rejected, (state) => {
            state.user = null;
        })
        .addCase(logoutUser.fulfilled, (state) => {
            state.user = null;
            state.authChecked = true;
            state.error = null;
        });
    },
});

export const { clearAuthError } = authSlice.actions;
export default authSlice.reducer;
