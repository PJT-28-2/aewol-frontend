import { defineStore } from 'pinia'
import { USE_MOCK_DATA } from '@/mocks/config'

const MOCK_NOTIFICATIONS = [
  { id: 1, type: 'PAYMENT', title: '포리의 병원비가 기록됐어요', message: '24시 우리동물병원 · 42,000원', createdAt: '2026-08-18T15:24:00', read: false },
  { id: 2, type: 'BUDGET', title: '이번 달 병원비 예산을 확인해주세요', message: '설정한 예산의 80%를 사용했어요.', createdAt: '2026-08-17T09:10:00', read: false },
  { id: 3, type: 'CARE', title: '새로운 돌봄 기록이 도착했어요', message: '엄마님이 포리의 산책 기록을 남겼어요.', createdAt: '2026-08-16T19:30:00', read: true },
]

export const useNotificationStore = defineStore('notification', {
  state: () => ({
    notifications: USE_MOCK_DATA ? MOCK_NOTIFICATIONS.map((item) => ({ ...item })) : [],
    unreadCount: USE_MOCK_DATA ? MOCK_NOTIFICATIONS.filter((item) => !item.read).length : 0,
    _ws: null,
  }),

  actions: {
    connect() {
      // WebSocket placeholder — replace URL with actual endpoint
      const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:8080/ws/notifications'
      const token = localStorage.getItem('accessToken')

      if (this._ws) this.disconnect()

      this._ws = new WebSocket(`${wsUrl}?token=${token}`)

      this._ws.onmessage = (event) => {
        try {
          const notification = JSON.parse(event.data)
          this.notifications.unshift(notification)
          this.unreadCount += 1
        } catch {
          // ignore malformed messages
        }
      }

      this._ws.onclose = () => {
        this._ws = null
      }
    },

    disconnect() {
      if (this._ws) {
        this._ws.close()
        this._ws = null
      }
    },

    markAsRead(id) {
      const item = this.notifications.find((notification) => notification.id === id)
      if (item && !item.read) {
        item.read = true
        this.unreadCount = Math.max(0, this.unreadCount - 1)
      }
    },

    markAllAsRead() {
      this.notifications.forEach((notification) => { notification.read = true })
      this.unreadCount = 0
    },
  },
})
