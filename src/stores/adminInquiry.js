import { defineStore } from 'pinia'
import {
  getAdminInquiries,
  getAdminInquiry,
  saveAdminInquiryAnswer,
} from '@/api/adminInquiry'

export const useAdminInquiryStore = defineStore('adminInquiry', {
  state: () => ({
    inquiries: [],
    selectedInquiry: null,
    statusFilter: '',
    page: 0,
    hasNext: false,
    isLoading: false,
    isLoadingMore: false,
    isSaving: false,
    error: null,
  }),

  actions: {
    async fetchInquiries(status = this.statusFilter) {
      this.isLoading = true
      this.error = null
      this.statusFilter = status
      try {
        const { data } = await getAdminInquiries({ status, page: 0 })
        this.inquiries = data.result?.inquiries ?? []
        this.hasNext = data.result?.hasNext ?? false
        this.page = 0
      } catch (error) {
        this.error = error
        throw error
      } finally {
        this.isLoading = false
      }
    },

    async loadMore() {
      if (!this.hasNext || this.isLoadingMore) return
      this.isLoadingMore = true
      this.error = null
      try {
        const nextPage = this.page + 1
        const { data } = await getAdminInquiries({
          status: this.statusFilter,
          page: nextPage,
        })
        this.inquiries = [...this.inquiries, ...(data.result?.inquiries ?? [])]
        this.hasNext = data.result?.hasNext ?? false
        this.page = nextPage
      } catch (error) {
        this.error = error
        throw error
      } finally {
        this.isLoadingMore = false
      }
    },

    async fetchInquiry(inquiryId) {
      this.isLoading = true
      this.error = null
      try {
        const { data } = await getAdminInquiry(inquiryId)
        this.selectedInquiry = data.result
        return data.result
      } catch (error) {
        this.error = error
        throw error
      } finally {
        this.isLoading = false
      }
    },

    async saveAnswer(inquiryId, answer) {
      this.isSaving = true
      this.error = null
      try {
        const { data } = await saveAdminInquiryAnswer(inquiryId, answer)
        this.selectedInquiry = data.result
        const listItem = this.inquiries.find((item) => item.inquiryId === inquiryId)
        if (listItem) listItem.status = 'ANSWERED'
        return data.result
      } catch (error) {
        this.error = error
        throw error
      } finally {
        this.isSaving = false
      }
    },
  },
})
