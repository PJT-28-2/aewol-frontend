import api from '@/api';
// baseURL(axios 인스턴스)이 이미 /api를 포함하므로 아래 경로에는 /api를 다시 붙이지 않는다

/**
 * FAQ 목록 조회
 * GET /api/support/faqs
 * result: [{ faqId, question }]  ※ 답변은 상세 조회에서 받아옴
 */
export function getFaqs() {
  return api.get('/support/faqs');
}

/**
 * FAQ 상세 조회 (아코디언 펼칠 때 호출)
 * GET /api/support/faqs/{faqId}
 * result: { faqId, question, answer }
 */
export function getFaqDetail(faqId) {
  return api.get(`/support/faqs/${faqId}`);
}

/**
 * 1:1 문의 등록
 * POST /api/support/inquiries
 * multipart/form-data: category, title, content, replyEmail, attachments(선택, 최대 3개, 파일당 10MB, jpg/jpeg/png/pdf만 허용)
 * result: { inquiryId, inquiryNumber }
 */
export function submitInquiry(formData) {
  // FormData를 넘기면 Axios(브라우저)가 Content-Type과 boundary를 자동으로 설정해요.
  // 여기서 'multipart/form-data'만 직접 지정하면 boundary가 빠져서
  // 서버가 파일을 못 읽거나 400/빈 첨부로 처리될 수 있어 헤더를 아예 지정하지 않아요.
  return api.post('/support/inquiries', formData);
}

/**
 * 문의 목록 조회
 * GET /api/support/inquiries
 * result: [{ inquiryId, title, status, createdAt }]
 */
export function getMyInquiries() {
  return api.get('/support/inquiries');
}

/**
 * 문의 상세 조회
 * GET /api/support/inquiries/{inquiryId}
 */
export function getInquiryDetail(inquiryId) {
  return api.get(`/support/inquiries/${inquiryId}`);
}