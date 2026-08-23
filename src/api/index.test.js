import { beforeEach, describe, expect, it, vi } from 'vitest'
import axios from 'axios'
import { createPinia, setActivePinia } from 'pinia'
import api from './index'
import { useAuthStore } from '@/stores/auth'

const response = (config, data = {}) => ({
  data,
  status: 200,
  statusText: 'OK',
  headers: {},
  config,
})

const unauthorized = (config) =>
  Promise.reject({ config, response: { status: 401 } })

describe('auth request interceptor', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('attaches Authorization header for a valid access token', async () => {
    localStorage.setItem('accessToken', 'valid-access-token')
    const adapter = vi.fn((config) => Promise.resolve(response(config)))

    await api.get('/protected', { adapter })

    expect(adapter.mock.calls[0][0].headers.Authorization).toBe(
      'Bearer valid-access-token',
    )
  })

  it.each(['undefined', 'null', '   '])(
    'does not attach Authorization header for malformed access token %j',
    async (accessToken) => {
      localStorage.setItem('accessToken', accessToken)
      const adapter = vi.fn((config) => Promise.resolve(response(config)))

      await api.get('/protected', {
        headers: { Authorization: 'Bearer stale-token' },
        adapter,
      })

      expect(adapter.mock.calls[0][0].headers.Authorization).toBeUndefined()
    },
  )
})

describe('auth refresh interceptor', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    window.history.replaceState({}, '', '/login')
    setActivePinia(createPinia())
    vi.restoreAllMocks()
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('stores valid rotated tokens, syncs Pinia, and retries the request', async () => {
    localStorage.setItem('accessToken', 'expired-access')
    localStorage.setItem('refreshToken', 'old-refresh')
    const store = useAuthStore()
    const adapter = vi.fn((config) =>
      config.headers.Authorization === 'Bearer new-access'
        ? Promise.resolve(response(config, { ok: true }))
        : unauthorized(config),
    )
    vi.spyOn(axios, 'post').mockResolvedValue({
      data: { result: { accessToken: 'new-access', refreshToken: 'new-refresh' } },
    })

    const result = await api.get('/protected', { adapter })

    expect(result.data).toEqual({ ok: true })
    expect(axios.post).toHaveBeenCalledOnce()
    expect(localStorage.getItem('accessToken')).toBe('new-access')
    expect(localStorage.getItem('refreshToken')).toBe('new-refresh')
    expect(store.accessToken).toBe('new-access')
    expect(adapter).toHaveBeenCalledTimes(2)
  })

  it.each([
    { name: 'missing access token', result: { refreshToken: 'new-refresh' } },
    { name: 'non-string access token', result: { accessToken: 123, refreshToken: 'new-refresh' } },
    { name: 'blank access token', result: { accessToken: '   ', refreshToken: 'new-refresh' } },
    { name: 'undefined sentinel access token', result: { accessToken: 'undefined', refreshToken: 'new-refresh' } },
    { name: 'null sentinel access token', result: { accessToken: 'null', refreshToken: 'new-refresh' } },
  ])('fails closed for a 200 response with $name', async ({ result }) => {
    localStorage.setItem('accessToken', 'expired-access')
    localStorage.setItem('refreshToken', 'old-refresh')
    const store = useAuthStore()
    store.accessToken = 'expired-access'
    vi.spyOn(axios, 'post').mockResolvedValue({ data: { result } })

    await expect(api.get('/protected', { adapter: unauthorized })).rejects.toThrow(
      'Invalid refresh response',
    )

    expect(localStorage.getItem('accessToken')).toBeNull()
    expect(localStorage.getItem('refreshToken')).toBeNull()
    expect(store.accessToken).toBeNull()
  })

  it('cleans up storage and Pinia when refresh fails', async () => {
    localStorage.setItem('accessToken', 'expired-access')
    localStorage.setItem('refreshToken', 'old-refresh')
    const store = useAuthStore()
    store.accessToken = 'expired-access'
    const refreshError = new Error('refresh failed')
    vi.spyOn(axios, 'post').mockRejectedValue(refreshError)

    await expect(api.get('/protected', { adapter: unauthorized })).rejects.toBe(refreshError)

    expect(localStorage.getItem('accessToken')).toBeNull()
    expect(localStorage.getItem('refreshToken')).toBeNull()
    expect(store.accessToken).toBeNull()
  })

  it.each([undefined, 'undefined', 'null', '   '])(
    'does not call refresh API for malformed refresh token %j',
    async (refreshToken) => {
      localStorage.setItem('accessToken', 'expired-access')
      localStorage.setItem('refreshToken', 'initial-refresh-token')
      const store = useAuthStore()
      if (refreshToken === undefined) {
        localStorage.removeItem('refreshToken')
      } else {
        localStorage.setItem('refreshToken', refreshToken)
      }
      store.accessToken = 'expired-access'
      const refreshSpy = vi
        .spyOn(axios, 'post')
        .mockRejectedValue(new Error('refresh API must not be called'))

      await expect(
        api.get('/protected', { adapter: unauthorized }),
      ).rejects.toThrow('No valid refresh token')

      expect(refreshSpy).not.toHaveBeenCalled()
      expect(localStorage.getItem('accessToken')).toBeNull()
      expect(localStorage.getItem('refreshToken')).toBeNull()
      expect(store.accessToken).toBeNull()
    },
  )

  it.each([
    { name: 'malformed', refreshToken: 'undefined' },
    { name: 'missing', refreshToken: undefined },
  ])(
    'rejects every concurrent 401 for a $name refresh token without retaining queue state',
    async ({ refreshToken }) => {
      localStorage.setItem('accessToken', 'expired-access')
      localStorage.setItem('refreshToken', 'initial-refresh-token')
      const store = useAuthStore()
      if (refreshToken === undefined) {
        localStorage.removeItem('refreshToken')
      } else {
        localStorage.setItem('refreshToken', refreshToken)
      }
      store.accessToken = 'expired-access'
      const refreshSpy = vi
        .spyOn(axios, 'post')
        .mockRejectedValue(new Error('refresh API must not be called'))

      const results = await Promise.allSettled([
        api.get('/one', { adapter: unauthorized }),
        api.get('/two', { adapter: unauthorized }),
      ])

      expect(results.map(({ status }) => status)).toEqual([
        'rejected',
        'rejected',
      ])
      expect(results.map(({ reason }) => reason.message)).toEqual([
        'No valid refresh token',
        'No valid refresh token',
      ])
      expect(refreshSpy).not.toHaveBeenCalled()
      expect(localStorage.getItem('accessToken')).toBeNull()
      expect(localStorage.getItem('refreshToken')).toBeNull()
      expect(store.accessToken).toBeNull()

      const nextResult = await Promise.allSettled([
        api.get('/next', { adapter: unauthorized }),
      ])

      expect(nextResult[0].status).toBe('rejected')
      expect(nextResult[0].reason.message).toBe('No valid refresh token')
      expect(refreshSpy).not.toHaveBeenCalled()
    },
  )

  it('rejects a 401 queued while refresh failure cleanup is still running', async () => {
    localStorage.setItem('accessToken', 'expired-access')
    localStorage.setItem('refreshToken', 'undefined')
    const store = useAuthStore()
    store.accessToken = 'expired-access'
    const originalClearSession = store.clearSession.bind(store)
    let signalCleanupStarted
    let releaseCleanup
    let signalSecondUnauthorized
    const cleanupStarted = new Promise((resolve) => {
      signalCleanupStarted = resolve
    })
    const cleanupGate = new Promise((resolve) => {
      releaseCleanup = resolve
    })
    const secondUnauthorized = new Promise((resolve) => {
      signalSecondUnauthorized = resolve
    })
    vi.spyOn(store, 'clearSession').mockImplementation(async () => {
      signalCleanupStarted()
      await cleanupGate
      originalClearSession()
    })
    const refreshSpy = vi
      .spyOn(axios, 'post')
      .mockRejectedValue(new Error('refresh API must not be called'))
    const adapter = vi.fn((config) => {
      if (config.url === '/two') {
        signalSecondUnauthorized()
      }
      return unauthorized(config)
    })

    const firstRequest = api.get('/one', { adapter })
    await cleanupStarted
    const secondRequest = api.get('/two', { adapter })
    await secondUnauthorized
    await Promise.resolve()
    await Promise.resolve()
    releaseCleanup()

    const results = await Promise.allSettled([firstRequest, secondRequest])

    expect(results.map(({ status }) => status)).toEqual([
      'rejected',
      'rejected',
    ])
    expect(results.map(({ reason }) => reason.message)).toEqual([
      'No valid refresh token',
      'No valid refresh token',
    ])
    expect(refreshSpy).not.toHaveBeenCalled()
    expect(localStorage.getItem('accessToken')).toBeNull()
    expect(localStorage.getItem('refreshToken')).toBeNull()
    expect(store.accessToken).toBeNull()
  })

  it('cleans up storage directly when Pinia is not active', async () => {
    localStorage.setItem('accessToken', 'expired-access')
    localStorage.setItem('refreshToken', 'old-refresh')
    sessionStorage.setItem('profileEditPasswordVerified', 'true')
    sessionStorage.setItem('kakaoOAuthState', 'state')
    setActivePinia(undefined)
    const refreshError = new Error('refresh failed')
    vi.spyOn(axios, 'post').mockRejectedValue(refreshError)

    await expect(api.get('/protected', { adapter: unauthorized })).rejects.toBe(refreshError)

    expect(localStorage.getItem('accessToken')).toBeNull()
    expect(localStorage.getItem('refreshToken')).toBeNull()
    expect(sessionStorage.getItem('profileEditPasswordVerified')).toBeNull()
    expect(sessionStorage.getItem('kakaoOAuthState')).toBeNull()
  })

  it('preserves the refresh failure and rejects queued requests when cleanup fails', async () => {
    localStorage.setItem('accessToken', 'expired-access')
    localStorage.setItem('refreshToken', 'old-refresh')
    const store = useAuthStore()
    const cleanupError = new Error('cleanup failed')
    vi.spyOn(store, 'clearSession').mockImplementation(() => {
      throw cleanupError
    })
    const refreshError = new Error('refresh failed')
    let rejectRefresh
    let signalRefreshStarted
    let signalSecondUnauthorized
    const refreshStarted = new Promise((resolve) => {
      signalRefreshStarted = resolve
    })
    const secondUnauthorized = new Promise((resolve) => {
      signalSecondUnauthorized = resolve
    })
    vi.spyOn(axios, 'post').mockImplementation(
      () => new Promise((_, reject) => {
        rejectRefresh = reject
        signalRefreshStarted()
      }),
    )
    const adapter = vi.fn((config) => {
      if (config.url === '/two') {
        signalSecondUnauthorized()
      }
      return unauthorized(config)
    })

    const requests = [
      api.get('/one', { adapter }),
      api.get('/two', { adapter }),
    ]
    await refreshStarted
    await secondUnauthorized
    await Promise.resolve()
    await Promise.resolve()
    rejectRefresh(refreshError)

    const results = await Promise.allSettled(requests)

    expect(results.map(({ status }) => status)).toEqual([
      'rejected',
      'rejected',
    ])
    expect(results.map(({ reason }) => reason)).toEqual([
      refreshError,
      refreshError,
    ])
    expect(axios.post).toHaveBeenCalledOnce()
  })

  it('refreshes once for concurrent 401s and replays every queued request', async () => {
    localStorage.setItem('accessToken', 'expired-access')
    localStorage.setItem('refreshToken', 'old-refresh')
    let resolveRefresh
    vi.spyOn(axios, 'post').mockReturnValue(new Promise((resolve) => {
      resolveRefresh = resolve
    }))
    const adapter = vi.fn((config) =>
      config.headers.Authorization === 'Bearer new-access'
        ? Promise.resolve(response(config, config.url))
        : unauthorized(config),
    )

    const requests = [api.get('/one', { adapter }), api.get('/two', { adapter })]
    await Promise.resolve()
    resolveRefresh({ data: { result: { accessToken: 'new-access' } } })

    const results = await Promise.all(requests)

    expect(axios.post).toHaveBeenCalledOnce()
    expect(results.map(({ data }) => data)).toEqual(['/one', '/two'])
    expect(adapter).toHaveBeenCalledTimes(4)
  })
})
