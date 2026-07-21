import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'

export function useAuth() {
  const authStore = useAuthStore()

  const isAuthenticated = computed(() => authStore.isAuthenticated)
  const user = computed(() => authStore.user)

  async function login(email, password) {
    return authStore.login(email, password)
  }

  async function logout() {
    return authStore.logout()
  }

  async function checkAuth() {
    const token = localStorage.getItem('accessToken')
    if (!token) {
      return false
    }

    try {
      await authStore.fetchUser()
      return true
    } catch {
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      authStore.$reset()
      return false
    }
  }

  return {
    isAuthenticated,
    user,
    login,
    logout,
    checkAuth,
  }
}
