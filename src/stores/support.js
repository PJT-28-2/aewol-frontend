import { defineStore } from 'pinia';
import { getFaqs, getFaqDetail, submitInquiry, getMyInquiries, getInquiryDetail } from '@/api/support';
import { USE_MOCK_DATA } from '@/mocks/config';
import {
  MOCK_FAQS,
  MOCK_FAQ_ANSWERS,
  MOCK_FAQ_RELATED,
  MOCK_INQUIRIES,
  MOCK_INQUIRY_ANSWERS,
} from '@/mocks/support';

export const useSupportStore = defineStore('support', {
  state: () => ({
    // [{ faqId, category, question, answer? }] — answer는 상세 조회 후 채워짐
    faqs: [],
    myInquiries: [],
    // mock 모드에서 MOCK_INQUIRIES 시드를 이미 채웠는지 여부.
    // myInquiries.length로 판단하면, 문의를 하나 제출한 뒤(길이가 0이 아니게 됨)
    // 다음 조회에서 시드 데이터가 영영 안 채워지는 버그가 있어서 별도 플래그로 관리해요.
    myInquiriesSeeded: false,
    lastSubmittedInquiry: null,
    isLoading: false,
    error: null,
  }),

  actions: {
    // mock 모드에서 MOCK_INQUIRIES 기본 시드를 한 번만 채워요.
    // submitInquiry/fetchMyInquiries 어느 쪽이 먼저 호출되든 항상 기본 시드가 유지돼요.
    _ensureMockInquiriesSeeded() {
      if (this.myInquiriesSeeded) return;
      this.myInquiries = [...this.myInquiries, ...MOCK_INQUIRIES];
      this.myInquiriesSeeded = true;
    },
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

      this.error = null;
      try {
        const { data } = await getFaqDetail(faqId);
        faq.answer = data.result.answer;
      } catch (err) {
        this.error = err;
        throw err;
      }
    },

    /**
     * FAQ 상세 화면 진입 시 호출. 질문/답변 + 연관 질문 목록을 함께 반환해요.
     * ⚠️ relatedFaqIds는 현재 API 명세에 없어서 mock에서만 채워짐 — 실제 연동 시 상세 API 응답에 추가 필요.
     * fetchFaqs/ensureFaqAnswer가 실패하면 그대로 throw돼서 여기서 따로 안 잡음 —
     * 호출하는 화면(FaqDetail.vue)에서 try/catch로 처리해요.
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
        this._ensureMockInquiriesSeeded();
        const now = new Date();
        const dateStr = now.toISOString().slice(0, 10).replaceAll('-', '');
        const mockResult = {
          inquiryId: Date.now(),
          inquiryNumber: `AEW-${dateStr}-${Math.floor(Math.random() * 9000 + 1000)}`,
        };
        this.lastSubmittedInquiry = mockResult;
        this.myInquiries = [
          {
            inquiryId: mockResult.inquiryId,
            category,
            title,
            content,
            status: 'PENDING',
            createdAt: now.toISOString(),
          },
          ...this.myInquiries,
        ];
        return mockResult;
      }

      const formData = new FormData();
      formData.append('category', category);
      formData.append('title', title);
      formData.append('content', content);
      formData.append('replyEmail', email);
      (images ?? []).forEach((file) => formData.append('attachments', file));

      const { data } = await submitInquiry(formData);
      this.lastSubmittedInquiry = data.result;
      return data.result;
    },

    // GET /api/support/inquiries — API 연동 전엔 USE_MOCK_DATA로 바로 목데이터 사용
    async fetchMyInquiries() {
      if (USE_MOCK_DATA) {
        this._ensureMockInquiriesSeeded();
        return;
      }
      this.isLoading = true;
      this.error = null;
      try {
        const { data } = await getMyInquiries();
        this.myInquiries = data.result ?? [];
      } catch (err) {
        this.error = err;
        throw err;
      } finally {
        this.isLoading = false;
      }
    },

    /**
     * 문의 상세 화면 진입 시 호출.
     * ⚠️ mock 모드에서는 목록에 없는 inquiryId(새로고침으로 seed가 초기화된 경우 등)면 null을 반환해요.
     */
    async fetchInquiryDetail(inquiryId) {
      const numericId = Number(inquiryId);

      if (USE_MOCK_DATA) {
        this._ensureMockInquiriesSeeded();
        const inquiry = this.myInquiries.find((i) => i.inquiryId === numericId);
        if (!inquiry) return null;
        return {
          ...inquiry,
          answer: inquiry.status === 'ANSWERED' ? MOCK_INQUIRY_ANSWERS[numericId] ?? null : null,
        };
      }

      const { data } = await getInquiryDetail(inquiryId);
      return data.result;
    },
  },
});