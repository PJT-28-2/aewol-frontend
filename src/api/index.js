import axios from 'axios'
import { getActivePinia } from 'pinia'
import { isValidToken } from '@/utils/token'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true,
})

// Request interceptor — attach Bearer token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken')
    if (config.skipAuth) {
      if (!config.useExplicitAuthorization) {
        delete config.headers.Authorization
      }
    } else if (token) {
      config.headers.Authorization = `Bearer ${token}`
    } else {
      delete config.headers.Authorization
    }
    return config
  },
  (error) => Promise.reject(error),
)

// Response interceptor — handle 401 with token refresh
let isRefreshing = false
let failedQueue = []

const syncAccessToken = async (accessToken) => {
  const { useAuthStore } = await import('@/stores/auth')
  useAuthStore().accessToken = accessToken
}

const clearAuthSession = async () => {
  if (getActivePinia()) {
    const { useAuthStore } = await import('@/stores/auth')
    useAuthStore().clearSession()
    return
  }

  localStorage.removeItem('accessToken')
  localStorage.removeItem('refreshToken')
  window.sessionStorage.removeItem('profileEditPasswordVerified')
  window.sessionStorage.removeItem('kakaoOAuthState')
}

const processQueue = (error, token = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error)
    } else {
      resolve(token)
    }
  })
  failedQueue = []
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.skipAuthRefresh
    ) {
      if (isRefreshing) {
        originalRequest._retry = true
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`
          return api(originalRequest)
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const refreshToken = localStorage.getItem('refreshToken')
        if (!refreshToken) {
          throw new Error('No refresh token')
        }
        const { data } = await axios.post(
          `${import.meta.env.VITE_API_BASE_URL}/auth/refresh`,
          null,
          { headers: { Authorization: `Bearer ${refreshToken}` }, withCredentials: true },
        )

        const result = data.result ?? data
        const newAccessToken = result?.accessToken
        if (!isValidToken(newAccessToken)) {
          throw new Error('Invalid refresh response')
        }

        localStorage.setItem('accessToken', newAccessToken)
        await syncAccessToken(newAccessToken)
        if (isValidToken(result.refreshToken)) {
          localStorage.setItem('refreshToken', result.refreshToken)
        }

        processQueue(null, newAccessToken)

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
        return api(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError, null)
        await clearAuthSession()
        window.location.href = '/login'
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  },
)

export default api
