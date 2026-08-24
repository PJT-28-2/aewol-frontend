import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import {
  THEME_STORAGE_KEY,
  initializeTheme,
  useThemeStore,
} from './theme'

describe('useThemeStore', () => {
  beforeEach(() => {
    window.localStorage.clear()
    document.documentElement.removeAttribute('data-theme')
    document.documentElement.style.removeProperty('color-scheme')
    setActivePinia(createPinia())
  })

  it('저장된 설정이 없으면 라이트 모드로 초기화한다', () => {
    expect(initializeTheme()).toBe('light')
    expect(document.documentElement.dataset.theme).toBe('light')
    expect(document.documentElement.style.colorScheme).toBe('light')
  })

  it('다크 모드를 선택하면 DOM과 localStorage에 함께 반영한다', () => {
    const store = useThemeStore()

    store.setTheme('dark')

    expect(store.isDark).toBe(true)
    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(document.documentElement.style.colorScheme).toBe('dark')
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark')
  })

  it('저장된 다크 모드를 앱 초기화 시 복원한다', () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, 'dark')

    expect(initializeTheme()).toBe('dark')
    expect(document.documentElement.dataset.theme).toBe('dark')
  })

  it('유효하지 않은 저장값은 라이트 모드로 안전하게 대체한다', () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, 'unknown')

    expect(initializeTheme()).toBe('light')
    expect(document.documentElement.dataset.theme).toBe('light')
  })
})
