import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useSupportStore } from './support'
import { getMyInquiries } from '@/api/support'

vi.mock('@/api/support', () => ({
  getFaqs: vi.fn(),
  getFaqDetail: vi.fn(),
  submitInquiry: vi.fn(),
  getMyInquiries: vi.fn(),
  getInquiryDetail: vi.fn(),
}))

describe('useSupportStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  // 회귀 테스트: GET /api/support/inquiries는 배열이 아니라
  // { inquiries: [...], hasNext } 객체를 내려준다(InquiryListResponse).
  // data.result를 그대로 배열 자리에 넣으면 Vue의 v-for가 객체 속성(inquiries 배열
  // 자체, hasNext 값)을 각각 항목으로 순회해버려서 카드 제목/날짜가 비는 버그가 있었다.
  it('fetchMyInquiries()는 { inquiries, hasNext } 응답에서 inquiries 배열만 꺼내 담는다', async () => {
    const inquiries = [
      {
        inquiryId: '1',
        title: '정기결제 취소는 어디서 하나요?',
        status: 'ANSWERED',
        createdAt: '2026-07-15',
      },
    ]
    getMyInquiries.mockResolvedValue({
      data: { status: 200, message: 'OK', result: { inquiries, hasNext: false } },
    })

    const store = useSupportStore()
    await store.fetchMyInquiries()

    expect(store.myInquiries).toEqual(inquiries)
  })

  it('fetchMyInquiries()는 result가 비어있으면 빈 배열로 처리한다', async () => {
    getMyInquiries.mockResolvedValue({ data: { status: 200, message: 'OK', result: null } })

    const store = useSupportStore()
    await store.fetchMyInquiries()

    expect(store.myInquiries).toEqual([])
  })
})
