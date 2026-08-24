import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useAdminInquiryStore } from './adminInquiry'
import {
  getAdminInquiries,
  getAdminInquiry,
  saveAdminInquiryAnswer,
} from '@/api/adminInquiry'

vi.mock('@/api/adminInquiry', () => ({
  getAdminInquiries: vi.fn(),
  getAdminInquiry: vi.fn(),
  saveAdminInquiryAnswer: vi.fn(),
}))

describe('useAdminInquiryStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('상태 필터로 관리자 문의 첫 페이지를 조회한다', async () => {
    const inquiries = [{ inquiryId: '25', title: '문의', status: 'WAITING' }]
    getAdminInquiries.mockResolvedValue({
      data: { result: { inquiries, hasNext: true } },
    })

    const store = useAdminInquiryStore()
    await store.fetchInquiries('WAITING')

    expect(getAdminInquiries).toHaveBeenCalledWith({ status: 'WAITING', page: 0 })
    expect(store.inquiries).toEqual(inquiries)
    expect(store.statusFilter).toBe('WAITING')
    expect(store.hasNext).toBe(true)
  })

  it('문의 상세를 조회해 선택 상태에 저장한다', async () => {
    const inquiry = { inquiryId: '25', title: '문의', status: 'WAITING', answer: null }
    getAdminInquiry.mockResolvedValue({ data: { result: inquiry } })

    const store = useAdminInquiryStore()
    const result = await store.fetchInquiry('25')

    expect(result).toEqual(inquiry)
    expect(store.selectedInquiry).toEqual(inquiry)
  })

  it('답변을 저장하면 상세와 목록 상태를 ANSWERED로 동기화한다', async () => {
    const answered = { inquiryId: '25', title: '문의', status: 'ANSWERED', answer: '처리했습니다.' }
    saveAdminInquiryAnswer.mockResolvedValue({ data: { result: answered } })

    const store = useAdminInquiryStore()
    store.inquiries = [{ inquiryId: '25', title: '문의', status: 'WAITING' }]
    const result = await store.saveAnswer('25', '처리했습니다.')

    expect(saveAdminInquiryAnswer).toHaveBeenCalledWith('25', '처리했습니다.')
    expect(result).toEqual(answered)
    expect(store.selectedInquiry).toEqual(answered)
    expect(store.inquiries[0].status).toBe('ANSWERED')
  })
})
