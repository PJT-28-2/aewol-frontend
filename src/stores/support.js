import { defineStore } from 'pinia';
import { getFaqs, getFaqDetail, submitInquiry, getMyInquiries, getInquiryDetail } from '@/api/support';
import { MOCK_FAQS, MOCK_FAQ_ANSWERS, MOCK_FAQ_RELATED, MOCK_INQUIRIES, USE_MOCK_DATA } from '@/utils/mockData';

export const useSupportStore = defineStore('support', {
  state: () => ({
    // [{ faqId, category, question, answer? }] — answer는 상세 조회 후 채워짐
    faqs: [],
    myInquiries: [],
    lastSubmittedInquiry: null,
    isLoading: false,
    error: null,
  }),

  actions: {
    // GET /api/support/faqs — API 연동 전엔 USE_MOCK_DATA로 바로 목데이터 사용
    // ⚠️ 실제 API 응답에 category 필드가 없다면 카테고리 필터/뱃지 표시를 위해 추가가 필요해요.
    async fetchFaqs() {
      if (USE_MOCK_DATA) {
        this.faqs = MOCK_FAQS.map((faq) => ({ ...faq, answer: null }));
        return;
      }
      this.isLoading = true;
      this.error = null;
      try {
        const { data } = await getFaqs();
        this.faqs = (data.result ?? []).map((faq) => ({ ...faq, answer: faq.answer ?? null }));
      } catch (err) {
        this.error = err;
        throw err;
      } finally {
        this.isLoading = false;
      }
    },

    /** 아코디언을 펼치거나 상세 화면 진입 시 호출 — 답변을 아직 안 받아왔으면 상세 API로 채움 */
    async ensureFaqAnswer(faqId) {
      const faq = this.faqs.find((f) => f.faqId === faqId);
      if (!faq || faq.answer) return;

      if (USE_MOCK_DATA) {
        faq.answer = MOCK_FAQ_ANSWERS[faqId] ?? '답변 준비 중이에요.';
        return;
      }
      const { data } = await getFaqDetail(faqId);
      faq.answer = data.result.answer;
    },

    /**
     * FAQ 상세 화면 진입 시 호출. 질문/답변 + 연관 질문 목록을 함께 반환해요.
     * ⚠️ relatedFaqIds는 현재 API 명세에 없어서 mock에서만 채워짐 — 실제 연동 시 상세 API 응답에 추가 필요.
     */
    async fetchFaqDetail(faqId) {
      const numericId = Number(faqId);
      if (this.faqs.length === 0) {
        await this.fetchFaqs();
      }
      await this.ensureFaqAnswer(numericId);

      const faq = this.faqs.find((f) => f.faqId === numericId);
      const relatedIds = USE_MOCK_DATA ? MOCK_FAQ_RELATED[numericId] ?? [] : [];
      const relatedFaqs = relatedIds
        .map((id) => this.faqs.find((f) => f.faqId === id))
        .filter(Boolean);

      return { faq, relatedFaqs };
    },

    async submitInquiry({ category, title, content, email, images }) {
      if (USE_MOCK_DATA) {
        const now = new Date();
        const dateStr = now.toISOString().slice(0, 10).replaceAll('-', '');
        const mockResult = {
          inquiryId: Date.now(),
          inquiryNumber: `AEW-${dateStr}-${Math.floor(Math.random() * 9000 + 1000)}`,
          submittedAt: now.toISOString(),
        };
        this.lastSubmittedInquiry = mockResult;
        this.myInquiries = [
          { inquiryId: mockResult.inquiryId, title, status: 'PENDING', createdAt: now.toISOString() },
          ...this.myInquiries,
        ];
        return mockResult;
      }

      const formData = new FormData();
      formData.append('category', category);
      formData.append('title', title);
      formData.append('content', content);
      formData.append('email', email);
      (images ?? []).forEach((file) => formData.append('images', file));

      const { data } = await submitInquiry(formData);
      this.lastSubmittedInquiry = data.result;
      return data.result;
    },

    // GET /api/support/inquiries — API 연동 전엔 USE_MOCK_DATA로 바로 목데이터 사용
    async fetchMyInquiries() {
      if (USE_MOCK_DATA) {
        if (this.myInquiries.length === 0) {
          this.myInquiries = MOCK_INQUIRIES;
        }
        return;
      }
      this.isLoading = true;
      try {
        const { data } = await getMyInquiries();
        this.myInquiries = data.result ?? [];
      } finally {
        this.isLoading = false;
      }
    },

    async fetchInquiryDetail(inquiryId) {
      const { data } = await getInquiryDetail(inquiryId);
      return data.result;
    },
  },
});