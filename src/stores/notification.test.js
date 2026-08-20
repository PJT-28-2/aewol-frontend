import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useNotificationStore } from './notification'

describe('useNotificationStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    window.localStorage.clear()
  })

  it('목 모드가 아니면 알림 목록을 비워 둔다', () => {
    const store = useNotificationStore()
    expect(store.notifications).toEqual([])
    expect(store.unreadCount).toBe(0)
  })

  it('connect는 access token을 URL에 넣지 않는다', () => {
    window.localStorage.setItem('accessToken', 'secret-token')
    const websocket = vi.fn(function FakeWebSocket(url) {
      this.url = url
      this.close = vi.fn()
    })
    vi.stubGlobal('WebSocket', websocket)

    const store = useNotificationStore()
    store.connect()

    expect(websocket).toHaveBeenCalledTimes(1)
    expect(websocket.mock.calls[0][0]).not.toContain('secret-token')
    expect(websocket.mock.calls[0][0]).not.toContain('token=')
    vi.unstubAllGlobals()
  })
})
