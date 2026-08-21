import { defineStore } from 'pinia';
import { getFaqs, getFaqDetail, submitInquiry, getMyInquiries, getInquiryDetail } from '@/api/support';

export const useSupportStore = defineStore('support', {
  state: () => ({
    // [{ faqId, category, question, answer? }] — answer는 상세 조회 후 채워짐
    faqs: [],
    myInquiries: [],
    // mock 모드에서 MOCK_INQUIRIES 시드를 이미 채웠는지 여부.
    // myInquiries.length로 판단하면, 문의를 하나 제출한 뒤(길이가 0이 아니게 됨)
    // 다음 조회에서 시드 데이터가 영영 안 채워지는 버그가 있어서 별도 플래그로 관리해요.
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
    // ⚠️ 실제 API 응답에 category 필드가 없다면 카테고리 필터/뱃지 표시를 위해 추가가 필요해요.
    async fetchFaqs() {
      this.isLoading = true;
      this.error = null;
      try {
        const { data } = await getFaqs();
        // ⚠️ 백엔드 faqId는 String이에요 — 여기서 Number로 바꾸지 않아요.
        // 자세한 이유는 fetchFaqDetail() 위 주석 참고.
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
     * ⚠️ ID 타입 관련 설명(fetchFaqs()에서도 참조): route.params.faqId는 항상 String이에요.
     * mock 데이터(mocks/support.js)는 faqId를 숫자 리터럴로 두고 있어서 mock 모드에서만
     * Number로 맞춰 비교해요. 실제 API는 faqId를 String으로 내려줘서(이 앱 전체 ID 컨벤션)
     * 그대로 비교하면 돼요 — 여기서 Number(faqId)로 통일해버리면 실제 API 모드에서
     * 전부 매칭 실패해요(2026-08-12 회귀).
     */
    async fetchFaqDetail(faqId) {
      if (this.faqs.length === 0) {
        await this.fetchFaqs();
      }
      const lookupId = faqId;
      await this.ensureFaqAnswer(lookupId);

      const faq = this.faqs.find((f) => f.faqId === lookupId);
      const relatedIds = [];
      const relatedFaqs = relatedIds
        .map((id) => this.faqs.find((f) => f.faqId === id))
        .filter(Boolean);

      return { faq, relatedFaqs };
    },

    async submitInquiry({ category, title, content, email, images }) {

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
    // 화면 진입/새로고침 시 첫 페이지(0)부터 다시 불러와요 — 이어서 더 보려면
    // loadMoreInquiries()를 따로 호출하세요.
    async fetchMyInquiries() {
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
    async loadMoreInquiries() {
      if (!this.inquiriesHasNext || this.isLoadingMoreInquiries) return;
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
     */
    async fetchInquiryDetail(inquiryId) {
      const { data } = await getInquiryDetail(inquiryId);
      return data.result;
    },
  },
});