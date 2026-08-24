import { defineStore } from 'pinia'
import { notificationApi } from '@/api/notification'
import { beginSessionTask, isCurrentSession } from '@/utils/sessionEpoch'

const errorMessage = (error, fallback) => error.response?.data?.message || fallback
const unwrapResult = (response) => response?.data?.result ?? response?.data ?? response

export const useNotificationStore = defineStore('notification', {
  state: () => ({
    notifications: [],
    unreadCount: 0,
    page: 0,
    hasNext: false,
    isLoading: false,
    isLoadingMore: false,
    isMarkingAll: false,
    error: '',
    actionError: '',
    initialized: false,
  }),

  actions: {
    async fetchNotifications({ page = 0, size = 20, append = false } = {}) {
      const epoch = beginSessionTask()
      if (append) this.isLoadingMore = true
      else this.isLoading = true
      if (append) this.actionError = ''
      else this.error = ''

      try {
        const result = unwrapResult(await notificationApi.getNotifications({ page, size }))
        if (!isCurrentSession(epoch)) return
        const items = Array.isArray(result?.notifications) ? result.notifications : []
        this.notifications = append ? [...this.notifications, ...items] : items
        this.unreadCount = Number(result?.unreadCount ?? 0)
        this.page = Number(result?.page ?? page)
        this.hasNext = Boolean(result?.hasNext)
        this.initialized = true
      } catch (error) {
        if (!isCurrentSession(epoch)) throw error
        const message = errorMessage(error, '알림을 불러오지 못했어요. 다시 시도해 주세요.')
        if (append) this.actionError = message
        else this.error = message
        throw error
      } finally {
        if (isCurrentSession(epoch)) {
          this.isLoading = false
          this.isLoadingMore = false
        }
      }
    },

    async fetchUnreadCount() {
      const epoch = beginSessionTask()
      try {
        const result = unwrapResult(await notificationApi.getUnreadCount())
        if (!isCurrentSession(epoch)) return
        this.unreadCount = Number(result?.unreadCount ?? 0)
      } catch (error) {
        if (!isCurrentSession(epoch)) return
        // 배지는 홈의 부가 정보라 홈 화면 전체를 실패시키지 않는다.
        console.error('[notification] 읽지 않은 알림 수를 불러오지 못했습니다.', error)
      }
    },

    async loadMore() {
      if (!this.hasNext || this.isLoading || this.isLoadingMore) return
      return this.fetchNotifications({ page: this.page + 1, size: 20, append: true })
    },

    async markAsRead(notificationId) {
      const item = this.notifications.find((notification) => notification.notificationId === notificationId)
      if (!item || item.read) return

      this.actionError = ''
      try {
        await notificationApi.markAsRead(notificationId)
        item.read = true
        item.readAt ||= new Date().toISOString()
        this.unreadCount = Math.max(0, this.unreadCount - 1)
      } catch (error) {
        this.actionError = errorMessage(error, '알림을 읽음 처리하지 못했어요.')
        throw error
      }
    },

    async markAllAsRead() {
      if (!this.unreadCount || this.isMarkingAll) return

      this.isMarkingAll = true
      this.actionError = ''
      try {
        await notificationApi.markAllAsRead()
        const readAt = new Date().toISOString()
        this.notifications.forEach((notification) => {
          notification.read = true
          notification.readAt ||= readAt
        })
        this.unreadCount = 0
      } catch (error) {
        this.actionError = errorMessage(error, '알림을 모두 읽음 처리하지 못했어요.')
        throw error
      } finally {
        this.isMarkingAll = false
      }
    },

    reset() {
      this.$reset()
    },
  },
})
