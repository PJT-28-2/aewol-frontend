import { defineStore } from 'pinia'

export const THEME_STORAGE_KEY = 'aewol-theme'
const THEMES = new Set(['light', 'dark'])

export function readStoredTheme() {
  const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY)
  return THEMES.has(storedTheme) ? storedTheme : 'light'
}

export function applyTheme(theme) {
  const safeTheme = THEMES.has(theme) ? theme : 'light'
  document.documentElement.dataset.theme = safeTheme
  document.documentElement.style.colorScheme = safeTheme
  return safeTheme
}

export function initializeTheme() {
  return applyTheme(readStoredTheme())
}

export const useThemeStore = defineStore('theme', {
  state: () => ({
    theme: readStoredTheme(),
  }),

  getters: {
    isDark: (state) => state.theme === 'dark',
  },

  actions: {
    setTheme(theme) {
      this.theme = applyTheme(theme)
      window.localStorage.setItem(THEME_STORAGE_KEY, this.theme)
    },

    toggle() {
      this.setTheme(this.isDark ? 'light' : 'dark')
    },
  },
})
