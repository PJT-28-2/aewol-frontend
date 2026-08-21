import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, nextTick } from 'vue'
import { createPinia, setActivePinia } from 'pinia'

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  getNotifications: vi.fn(),
  markAsRead: vi.fn(),
  markAllAsRead: vi.fn(),
}))

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: mocks.push }),
}))

vi.mock('@/api/notification', () => ({
  notificationApi: {
    getNotifications: mocks.getNotifications,
    getUnreadCount: vi.fn(),
    markAsRead: mocks.markAsRead,
    markAllAsRead: mocks.markAllAsRead,
  },
}))

import NotificationInboxView from './NotificationInboxView.vue'

let app
let host

async function flush() {
  for (let i = 0; i < 6; i += 1) await Promise.resolve()
  await nextTick()
}

async function mountView() {
  host = document.createElement('div')
  document.body.appendChild(host)
  app = createApp(NotificationInboxView)
  app.use(createPinia())
  app.mount(host)
  await flush()
}

describe('NotificationInboxView', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    mocks.markAsRead.mockResolvedValue({ data: { result: null } })
    mocks.markAllAsRead.mockResolvedValue({ data: { result: null } })
  })

  afterEach(() => {
    app?.unmount()
    host?.remove()
  })

  it('서버 알림과 읽지 않은 개수를 보여준다', async () => {
    mocks.getNotifications.mockResolvedValue({
      data: {
        result: {
          notifications: [{
            notificationId: '10',
            title: '초대가 도착했어요',
            message: '가족 공유 초대를 확인해 주세요.',
            targetPath: '/share',
            read: false,
            createdAt: '2026-08-20T10:00:00',
          }],
          unreadCount: 1,
          page: 0,
          hasNext: false,
        },
      },
    })

    await mountView()

    expect(host.textContent).toContain('읽지 않은 알림 1개')
    expect(host.textContent).toContain('초대가 도착했어요')
  })

  it('알림을 읽음 처리한 뒤 안전한 내부 경로로 이동한다', async () => {
    mocks.getNotifications.mockResolvedValue({
      data: {
        result: {
          notifications: [{
            notificationId: '10',
            title: '지갑 알림',
            message: '내역을 확인해 주세요.',
            targetPath: '/wallet',
            read: false,
            createdAt: '2026-08-20T10:00:00',
          }],
          unreadCount: 1,
          page: 0,
          hasNext: false,
        },
      },
    })
    await mountView()

    host.querySelector('.grid button').click()
    await flush()

    expect(mocks.markAsRead).toHaveBeenCalledWith('10')
    expect(mocks.push).toHaveBeenCalledWith('/wallet')
  })

  it('읽음 처리에 실패해도 안전한 내부 경로로 이동한다', async () => {
    mocks.getNotifications.mockResolvedValue({
      data: {
        result: {
          notifications: [{
            notificationId: '10',
            title: '지갑 알림',
            message: '내역을 확인해 주세요.',
            targetPath: '/wallet',
            read: false,
            createdAt: '2026-08-20T10:00:00',
          }],
          unreadCount: 1,
          page: 0,
          hasNext: false,
        },
      },
    })
    mocks.markAsRead.mockRejectedValue(new Error('network error'))
    await mountView()

    host.querySelector('.grid button').click()
    await flush()

    expect(mocks.markAsRead).toHaveBeenCalledWith('10')
    expect(mocks.push).toHaveBeenCalledWith('/wallet')
  })

  it('알림이 없으면 빈 상태를 보여준다', async () => {
    mocks.getNotifications.mockResolvedValue({
      data: { result: { notifications: [], unreadCount: 0, page: 0, hasNext: false } },
    })

    await mountView()

    expect(host.textContent).toContain('아직 도착한 알림이 없어요')
  })
})
