import api from './index'

export const adminDiaryReportApi = {
  getReports(params) {
    return api.get('/admin/diary-reports', { params })
  },

  getReport(reportId) {
    return api.get(`/admin/diary-reports/${reportId}`)
  },

  resolve(reportId, data) {
    return api.put(`/admin/diary-reports/${reportId}/resolution`, data)
  },
}
