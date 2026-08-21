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
