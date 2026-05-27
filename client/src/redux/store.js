import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';

const AUTH_STORAGE_KEY = 'authState';

const store = configureStore({
  reducer: {
    auth: authReducer, // Make sure there is no 'e' here!
  },
});

store.subscribe(() => {
  const { auth } = store.getState();

  try {
    localStorage.setItem(
      AUTH_STORAGE_KEY,
      JSON.stringify({
        user: auth.user,
        token: auth.token,
      }),
    );
  } catch {
    // Ignore storage failures so auth flow still works in memory.
  }
});

export default store;