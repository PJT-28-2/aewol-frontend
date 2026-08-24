import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { notificationApi } from '@/api/notification'
import { bumpSessionEpoch } from '@/utils/sessionEpoch'
import { useNotificationStore } from './notification'

vi.mock('@/api/notification', () => ({
  notificationApi: {
    getNotifications: vi.fn(),
    getUnreadCount: vi.fn(),
    markAsRead: vi.fn(),
    markAllAsRead: vi.fn(),
  },
}))

const unread = {
  notificationId: '1',
  title: '새 알림',
  message: '내용',
  read: false,
  readAt: null,
  createdAt: '2026-08-20T10:00:00',
}

describe('useNotificationStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('서버 목록과 페이지 상태를 저장한다', async () => {
    notificationApi.getNotifications.mockResolvedValue({
      data: { result: { notifications: [unread], unreadCount: 3, page: 0, hasNext: true } },
    })
    const store = useNotificationStore()

    await store.fetchNotifications()

    expect(notificationApi.getNotifications).toHaveBeenCalledWith({ page: 0, size: 20 })
    expect(store.notifications).toEqual([unread])
    expect(store.unreadCount).toBe(3)
    expect(store.hasNext).toBe(true)
    expect(store.initialized).toBe(true)
  })

  it('추가 목록 조회가 실패해도 기존 목록을 유지한다', async () => {
    notificationApi.getNotifications.mockRejectedValue(new Error('network'))
    const store = useNotificationStore()
    store.notifications = [{ ...unread }]
    store.page = 0
    store.hasNext = true

    await expect(store.loadMore()).rejects.toThrow('network')

    expect(store.notifications).toEqual([unread])
    expect(store.error).toBe('')
    expect(store.actionError).toBe('알림을 불러오지 못했어요. 다시 시도해 주세요.')
    expect(store.isLoadingMore).toBe(false)
  })

  it('읽음 API가 성공한 뒤에만 로컬 상태를 바꾼다', async () => {
    notificationApi.markAsRead.mockResolvedValue({ data: { result: null } })
    const store = useNotificationStore()
    store.notifications = [{ ...unread }]
    store.unreadCount = 1

    await store.markAsRead('1')

    expect(store.notifications[0].read).toBe(true)
    expect(store.unreadCount).toBe(0)
  })

  it('읽음 API가 실패하면 기존 상태를 유지한다', async () => {
    notificationApi.markAsRead.mockRejectedValue(new Error('network'))
    const store = useNotificationStore()
    store.notifications = [{ ...unread }]
    store.unreadCount = 1

    await expect(store.markAsRead('1')).rejects.toThrow('network')

    expect(store.notifications[0].read).toBe(false)
    expect(store.unreadCount).toBe(1)
    expect(store.actionError).toBe('알림을 읽음 처리하지 못했어요.')
  })

  it('전체 읽음 처리 후 목록과 개수를 함께 갱신한다', async () => {
    notificationApi.markAllAsRead.mockResolvedValue({ data: { result: null } })
    const store = useNotificationStore()
    store.notifications = [{ ...unread }, { ...unread, notificationId: '2' }]
    store.unreadCount = 2

    await store.markAllAsRead()

    expect(store.notifications.every((item) => item.read)).toBe(true)
    expect(store.unreadCount).toBe(0)
  })

  it('홈 배지용 읽지 않은 개수를 조회한다', async () => {
    notificationApi.getUnreadCount.mockResolvedValue({ data: { result: { unreadCount: 7 } } })
    const store = useNotificationStore()

    await store.fetchUnreadCount()

    expect(store.unreadCount).toBe(7)
  })

  it('세션이 바뀐 뒤에 도착한 읽지 않은 개수는 반영하지 않는다', async () => {
    let resolveCount
    notificationApi.getUnreadCount.mockReturnValue(
      new Promise((resolve) => {
        resolveCount = resolve
      }),
    )
    const store = useNotificationStore()
    const pending = store.fetchUnreadCount()
    bumpSessionEpoch()
    resolveCount({ data: { result: { unreadCount: 99 } } })
    await pending

    expect(store.unreadCount).toBe(0)
  })
})
