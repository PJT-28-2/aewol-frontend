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
    // 백엔드가 한 번에 10개씩(page 0부터) 내려줘서, 11번째 이후 문의를 보려면
    // page/hasNext를 직접 관리하고 "더보기"로 다음 페이지를 이어붙여야 해요.
    inquiriesPage: 0,
    inquiriesHasNext: false,
    isLoadingMoreInquiries: false,
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
        // ⚠️ 백엔드 faqId는 String이에요(memberId/accountId/inquiryId 등 이 앱은 ID를
        // 전부 String으로 다루는 컨벤션 — 여기서 Number로 바꾸지 않아요). fetchFaqDetail에서
        // 섣불리 Number(faqId)로 비교했다가 실제 API 모드에서 전부 매칭 실패했던 회귀가
        // 있었어요(2026-08-12) — 그 쪽에서 mock/real 모드를 나눠 처리해요.
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
     *
     * ⚠️ route.params.faqId는 항상 String이에요. mock 데이터(mocks/support.js)는
     * faqId를 숫자 리터럴로 두고 있어서 mock 모드에서만 Number로 맞춰 비교해요.
     * 실제 API는 faqId를 String으로 내려줘서(이 앱 전체 ID 컨벤션) 그대로 비교하면 돼요 —
     * 여기서 Number(faqId)로 통일해버리면 실제 API 모드에서 전부 매칭 실패해요(2026-08-12 회귀).
     */
    async fetchFaqDetail(faqId) {
      if (this.faqs.length === 0) {
        await this.fetchFaqs();
      }
      const lookupId = USE_MOCK_DATA ? Number(faqId) : faqId;
      await this.ensureFaqAnswer(lookupId);

      const faq = this.faqs.find((f) => f.faqId === lookupId);
      const relatedIds = USE_MOCK_DATA ? MOCK_FAQ_RELATED[lookupId] ?? [] : [];
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
    // 화면 진입/새로고침 시 첫 페이지(0)부터 다시 불러와요 — 이어서 더 보려면
    // loadMoreInquiries()를 따로 호출하세요.
    async fetchMyInquiries() {
      if (USE_MOCK_DATA) {
        this._ensureMockInquiriesSeeded();
        this.inquiriesHasNext = false;
        return;
      }
      this.isLoading = true;
      this.error = null;
      try {
        const { data } = await getMyInquiries(0);
        // ⚠️ 백엔드 응답이 배열이 아니라 { inquiries: [...], hasNext } 객체예요
        // (InquiryListResponse, api_명세서.md 예시 기준). data.result를 그대로 배열에
        // 넣으면 Vue의 v-for가 객체 속성(inquiries 배열 자체, hasNext 불리언)을 각각
        // "항목"으로 순회해버려서 카드는 개수만 맞고 제목/날짜가 전부 비는 버그가 있었음(2026-08-11).
        this.myInquiries = data.result?.inquiries ?? [];
        this.inquiriesHasNext = data.result?.hasNext ?? false;
        this.inquiriesPage = 0;
      } catch (err) {
        this.error = err;
        throw err;
      } finally {
        this.isLoading = false;
      }
    },

    // "더보기" — 다음 페이지를 이어붙여요. mock 모드에선 페이지네이션을 흉내내지 않고
    // _ensureMockInquiriesSeeded로 이미 전부 들어있으니 hasNext가 항상 false라 호출될 일이 없어요.
    async loadMoreInquiries() {
      if (USE_MOCK_DATA || !this.inquiriesHasNext || this.isLoadingMoreInquiries) return;
      this.isLoadingMoreInquiries = true;
      this.error = null;
      try {
        const nextPage = this.inquiriesPage + 1;
        const { data } = await getMyInquiries(nextPage);
        this.myInquiries = [...this.myInquiries, ...(data.result?.inquiries ?? [])];
        this.inquiriesHasNext = data.result?.hasNext ?? false;
        this.inquiriesPage = nextPage;
      } catch (err) {
        this.error = err;
        throw err;
      } finally {
        this.isLoadingMoreInquiries = false;
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