import { defineStore } from 'pinia'
import { adminDiaryReportApi } from '@/api/adminDiaryReport'

const unwrap = (response) => response.data?.result

export const useAdminDiaryReportStore = defineStore('adminDiaryReport', {
  state: () => ({
    reports: [],
    selectedReport: null,
    status: 'PENDING',
    page: 0,
    size: 20,
    hasNext: false,
    isLoading: false,
    isSubmitting: false,
    error: '',
    operationError: '',
  }),

  actions: {
    async fetchReports({ page = this.page, status = this.status } = {}) {
      this.isLoading = true
      this.error = ''
      try {
        const result = unwrap(await adminDiaryReportApi.getReports({
          page,
          size: this.size,
          ...(status ? { status } : {}),
        }))
        this.reports = result?.reports ?? []
        this.page = Number(result?.page ?? page)
        this.hasNext = Boolean(result?.hasNext)
        this.status = status
      } catch (error) {
        this.reports = []
        this.error = error.response?.data?.message || '신고 목록을 불러오지 못했습니다.'
      } finally {
        this.isLoading = false
      }
    },

    async fetchReport(reportId) {
      this.isLoading = true
      this.error = ''
      this.operationError = ''
      try {
        this.selectedReport = unwrap(await adminDiaryReportApi.getReport(reportId))
        return this.selectedReport
      } catch (error) {
        this.selectedReport = null
        this.error = error.response?.data?.message || '신고 내용을 불러오지 못했습니다.'
        return null
      } finally {
        this.isLoading = false
      }
    },

    async resolveReport(reportId, resolution, adminNote) {
      if (this.isSubmitting) return false
      this.isSubmitting = true
      this.operationError = ''
      try {
        const result = unwrap(await adminDiaryReportApi.resolve(reportId, {
          resolution,
          adminNote: adminNote?.trim() || null,
        }))
        this.selectedReport = result
        this.reports = this.reports.map((report) =>
          report.diaryId === result.diaryId
            ? { ...report, status: result.status, resolution: result.resolution }
            : report,
        )
        return true
      } catch (error) {
        this.operationError = error.response?.data?.message || '신고를 처리하지 못했습니다.'
        return false
      } finally {
        this.isSubmitting = false
      }
    },
  },
})
