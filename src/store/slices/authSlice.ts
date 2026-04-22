import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import { authApi } from '../../api/auth';
import type { User, LoginCredentials, RegisterData, Role } from '../../types';
import type { FooterSettings } from '../../api/auth';

// Асинхронные действия для настроек - теперь работают с реальным API
export const fetchFooterSettings = createAsyncThunk(
    'auth/fetchFooterSettings',
    async () => {
        const response = await authApi.getFooterSettings();
        return response.data;
    }
);

export const updateFooterSettings = createAsyncThunk(
    'auth/updateFooterSettings',
    async (settings: FooterSettings) => {
        const response = await authApi.updateFooterSettings(settings);
        return response.data;
    }
);


interface AuthState {
    user: User | null;
    token: string | null;
    refreshToken: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
    footerSettings: FooterSettings | null;
}

const initialState: AuthState = {
    user: JSON.parse(localStorage.getItem('user') || 'null'),
    token: localStorage.getItem('token'),
    refreshToken: localStorage.getItem('refreshToken'),
    isAuthenticated: !!localStorage.getItem('token'),
    isLoading: false,
    error: null,
    footerSettings: null,
};

export const login = createAsyncThunk(
    'auth/login',
    async (credentials: LoginCredentials, { rejectWithValue }) => {  // ← добавьте rejectWithValue
        try {
            const response = await authApi.login(credentials);
            return response.data;
        } catch (error: any) {
            // Извлекаем сообщение из ответа сервера
            const message = error.response?.data?.message
                || error.response?.data?.error
                || error.message
                || 'Ошибка входа';
            return rejectWithValue(message);  // ← возвращаем как payload
        }
    }
);

export const register = createAsyncThunk(
    'auth/register',
    async (data: RegisterData, { rejectWithValue }) => {
        try {
            const response = await authApi.register(data);
            return response.data;
        } catch (error: any) {
            const message = error.response?.data?.message
                || error.response?.data?.error
                || error.message
                || 'Ошибка регистрации';
            return rejectWithValue(message);
        }
    }
);

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        logout: (state) => {
            state.user = null;
            state.token = null;
            state.refreshToken = null;  // ← ДОБАВЛЕНО
            state.isAuthenticated = false; // ← ДОБАВЛЕНО
            localStorage.removeItem('token');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');
        },


        setCredentials: (state, action: PayloadAction<{
            token: string;
            refreshToken: string;
            user: { role: Role; fullName: string; email: string };
        }>) => {
            state.token = action.payload.token;
            state.refreshToken = action.payload.refreshToken;
            state.user = action.payload.user;
            state.isAuthenticated = true;
            state.error = null;

            // Сохраняем в localStorage
            localStorage.setItem('token', action.payload.token);
            localStorage.setItem('refreshToken', action.payload.refreshToken);
            localStorage.setItem('user', JSON.stringify(action.payload.user));
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(login.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(login.fulfilled, (state, action) => {
                state.isLoading = false;
                const user: User = {
                    email: action.payload.email,
                    fullName: action.payload.fullName,
                    role: action.payload.role,
                };
                state.user = user;
                state.token = action.payload.accessToken;
                state.refreshToken = action.payload.refreshToken;  // ← ДОБАВЛЕНО
                state.isAuthenticated = true;                     // ← ДОБАВЛЕНО

                localStorage.setItem('token', action.payload.accessToken);
                localStorage.setItem('user', JSON.stringify(user));
                localStorage.setItem('refreshToken', action.payload.refreshToken);
            })
            .addCase(login.rejected, (state, action) => {
                state.isLoading = false;
                state.error = (action.payload as string) || 'Ошибка входа';  // ← используем payload, не error
                state.isAuthenticated = false;
            })
            .addCase(register.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(register.fulfilled, (state, action) => {
                state.isLoading = false;
                const user: User = {
                    email: action.payload.email,
                    fullName: action.payload.fullName,
                    role: action.payload.role,
                };
                state.user = user;
                state.token = action.payload.accessToken;
                state.refreshToken = action.payload.refreshToken;  // ← ДОБАВЛЕНО
                state.isAuthenticated = true;                     // ← ДОБАВЛЕНО

                localStorage.setItem('token', action.payload.accessToken);
                localStorage.setItem('user', JSON.stringify(user));
                localStorage.setItem('refreshToken', action.payload.refreshToken);
            })
            .addCase(register.rejected, (state, action) => {
                state.isLoading = false;
                state.error = (action.payload as string) || 'Ошибка регистрации';
                state.isAuthenticated = false;
            })

            .addCase(fetchFooterSettings.fulfilled, (state, action) => {
                state.footerSettings = action.payload;
            })
            .addCase(updateFooterSettings.fulfilled, (state, action) => {
                state.footerSettings = action.payload;
            });

    },
});


export const { logout, setCredentials } = authSlice.actions;
export default authSlice.reducer;