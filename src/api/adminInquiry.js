import api from '@/api'

export function getAdminInquiries({ status, page = 0, size = 10 } = {}) {
  return api.get('/admin/inquiries', {
    params: {
      ...(status ? { status } : {}),
      page,
      size,
    },
  })
}

export function getAdminInquiry(inquiryId) {
  return api.get(`/admin/inquiries/${inquiryId}`)
}

export function saveAdminInquiryAnswer(inquiryId, answer) {
  return api.put(`/admin/inquiries/${inquiryId}/answer`, { answer })
}
