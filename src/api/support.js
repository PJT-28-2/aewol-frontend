import api from '@/api';

/**
 * FAQ 목록 조회
 * GET /api/support/faqs
 * result: [{ faqId, question }]  ※ 답변은 상세 조회에서 받아옴
 */
export function getFaqs() {
  return api.get('/api/support/faqs');
}

/**
 * FAQ 상세 조회 (아코디언 펼칠 때 호출)
 * GET /api/support/faqs/{faqId}
 * result: { faqId, question, answer }
 */
export function getFaqDetail(faqId) {
  return api.get(`/api/support/faqs/${faqId}`);
}

/**
 * 1:1 문의 등록
 * POST /api/support/inquiries
 * multipart/form-data: category, title, content, email, images(최대 3장)
 * result: { inquiryId, inquiryNumber, submittedAt }
 */
export function submitInquiry(formData) {
  return api.post('/api/support/inquiries', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}

/**
 * 문의 목록 조회
 * GET /api/support/inquiries
 * result: [{ inquiryId, title, status, createdAt }]
 */
export function getMyInquiries() {
  return api.get('/api/support/inquiries');
}

/**
 * 문의 상세 조회
 * GET /api/support/inquiries/{inquiryId}
 */
export function getInquiryDetail(inquiryId) {
  return api.get(`/api/support/inquiries/${inquiryId}`);
}
