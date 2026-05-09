import { createSlice } from "@reduxjs/toolkit";

interface ThemeState {
  mode: "dark" | "light";
}

// Our application is currently dark by default, so we start there!
const initialState: ThemeState = {
  mode: "dark",
};

const themeSlice = createSlice({
  name: "theme",
  initialState,
  reducers: {
    toggleTheme: (state) => {
      state.mode = state.mode === "dark" ? "light" : "dark";
    },
    // Useful for setting the theme explicitly if we save their preference in localStorage later
    setTheme: (state, action) => {
      state.mode = action.payload;
    },
  },
});

export const { toggleTheme, setTheme } = themeSlice.actions;
export default themeSlice.reducer;
