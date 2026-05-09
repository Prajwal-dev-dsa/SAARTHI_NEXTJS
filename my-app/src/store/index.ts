import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice";
import themeReducer from "./themeSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    theme: themeReducer,
  },
});

// These types are standard Redux Toolkit boilerplate to help TypeScript understand our store
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
