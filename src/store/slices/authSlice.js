import { createSlice } from '@reduxjs/toolkit';

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    userRole: null,
    isLoading: false,
    isInitialized: false, // Nuovo stato per tracciare se abbiamo controllato il localStorage
    error: null,
  },
  reducers: {
    loginStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    loginSuccess: (state, action) => {
      state.isLoading = false;
      state.user = action.payload;
      state.userRole = action.payload?.role || null;
      state.error = null;
    },
    loginFailure: (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
    },
    logout: (state) => {
      state.user = null;
      state.userRole = null;
      state.error = null;
    },
    checkStoredUser: (state, action) => {
      state.isInitialized = true; // Segna come inizializzato
      if (action.payload) {
        state.user = action.payload;
        state.userRole = action.payload?.role || null;
      }
    },
    setInitialized: (state) => {
      state.isInitialized = true; // Action per segnare come inizializzato anche senza utente
    },
  },
});

export const { loginStart, loginSuccess, loginFailure, logout, checkStoredUser, setInitialized } = authSlice.actions;
export default authSlice.reducer;