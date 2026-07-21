import { defineStore } from 'pinia'

export const useNotificationStore = defineStore('notification', {
  state: () => ({
    notifications: [],
    unreadCount: 0,
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
  },
})
