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
  // FormData를 넘기면 Axios(브라우저)가 Content-Type과 boundary를 자동으로 설정해요.
  // 여기서 'multipart/form-data'만 직접 지정하면 boundary가 빠져서
  // 서버가 파일을 못 읽거나 400/빈 첨부로 처리될 수 있어 헤더를 아예 지정하지 않아요.
  return api.post('/api/support/inquiries', formData);
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