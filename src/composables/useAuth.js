import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useMemberStore } from '@/stores/member'

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
    if (!authStore.isAuthenticated) {
      return false
    }

    try {
      authStore.user = await useMemberStore().fetchProfile()
      return true
    } catch {
      authStore.clearSession()
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
