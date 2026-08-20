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
      const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:8080/ws'
      if (!localStorage.getItem('accessToken')) return

      if (this._ws) this.disconnect()

      this._ws = new WebSocket(wsUrl)

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
