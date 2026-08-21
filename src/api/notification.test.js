import { afterEach, describe, expect, it, vi } from 'vitest'
import api from './index'
import { notificationApi } from './notification'

vi.mock('./index', () => ({
  default: {
    get: vi.fn(),
    patch: vi.fn(),
  },
}))

describe('notificationApi', () => {
  afterEach(() => vi.clearAllMocks())

  it('알림 목록과 읽지 않은 개수를 조회한다', async () => {
    await notificationApi.getNotifications({ page: 1, size: 20 })
    await notificationApi.getUnreadCount()

    expect(api.get).toHaveBeenNthCalledWith(1, '/users/me/notifications', {
      params: { page: 1, size: 20 },
    })
    expect(api.get).toHaveBeenNthCalledWith(2, '/users/me/notifications/unread-count')
  })

  it('한 건과 전체 알림을 읽음 처리한다', async () => {
    await notificationApi.markAsRead('17')
    await notificationApi.markAllAsRead()

    expect(api.patch).toHaveBeenNthCalledWith(1, '/users/me/notifications/17/read')
    expect(api.patch).toHaveBeenNthCalledWith(2, '/users/me/notifications/read-all')
  })
})
