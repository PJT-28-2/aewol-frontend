import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

vi.mock('@/api/share', () => ({
  shareApi: {
    getPets: vi.fn(),
    getMembers: vi.fn(),
    getContributions: vi.fn(),
    getLogs: vi.fn(),
  },
}))

import { shareApi } from '@/api/share'
import { useShareStore } from './share'

const wrap = (result) => ({ data: { result } })

describe('useShareStore - 가족 색상 배정', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    shareApi.getLogs.mockResolvedValue(wrap([]))
  })

  it('같은 가족은 아바타와 기여도에서 같은 색을 쓴다', async () => {
    shareApi.getMembers.mockResolvedValue(wrap([
      { id: '9001', name: '김애월' },
      { id: '9002', name: '이지원' },
    ]))
    shareApi.getContributions.mockResolvedValue(wrap([
      { id: '9002', name: '이지원', percentage: 60 },
      { id: '9001', name: '김애월', percentage: 40 },
    ]))

    const store = useShareStore()
    await store.fetchSharedCare('p1')

    const avatarOf = (id) => store.members.find((m) => m.id === id).avatarClass
    const dotOf = (id) => store.contributions.find((c) => c.id === id).toneClass

    expect(dotOf('9001')).toBe(avatarOf('9001'))
    expect(dotOf('9002')).toBe(avatarOf('9002'))
  })

  it('가족마다 서로 다른 색을 받는다', async () => {
    shareApi.getMembers.mockResolvedValue(wrap([
      { id: '1', name: '가' },
      { id: '2', name: '나' },
      { id: '3', name: '다' },
    ]))
    shareApi.getContributions.mockResolvedValue(wrap([]))

    const store = useShareStore()
    await store.fetchSharedCare('p1')

    const colors = store.members.map((m) => m.avatarClass)
    expect(new Set(colors).size).toBe(3)
  })

  // 지출이 없는 가족은 기여도 응답에서 통째로 빠진다. 예전에는 색을 배열 순번으로
  // 매겨서, 그 한 명이 빠지면 뒤 사람들의 색이 전부 한 칸씩 밀렸다.
  it('기여도 목록에서 빠진 가족이 있어도 나머지 색이 밀리지 않는다', async () => {
    shareApi.getMembers.mockResolvedValue(wrap([
      { id: '1', name: '가' },
      { id: '2', name: '나' },
      { id: '3', name: '다' },
    ]))
    shareApi.getContributions.mockResolvedValue(wrap([
      { id: '3', name: '다', percentage: 100 },
    ]))

    const store = useShareStore()
    await store.fetchSharedCare('p1')

    const third = store.members.find((m) => m.id === '3')
    expect(store.contributions[0].toneClass).toBe(third.avatarClass)
  })

  it('도넛 차트가 쓰는 색 토큰도 아바타와 같은 값이다', async () => {
    shareApi.getMembers.mockResolvedValue(wrap([{ id: '1', name: '가' }]))
    shareApi.getContributions.mockResolvedValue(wrap([
      { id: '1', name: '가', percentage: 100 },
    ]))

    const store = useShareStore()
    await store.fetchSharedCare('p1')

    expect(store.contributions[0].colorToken).toBe(store.members[0].colorToken)
    expect(store.contributions[0].colorToken).toMatch(/^--color-chart-/)
  })
})

describe('useShareStore - 일기 작성 권한', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    shareApi.getLogs.mockResolvedValue(wrap([]))
    shareApi.getContributions.mockResolvedValue(wrap([]))
  })

  it('대표 보호자(ADMIN)와 MANAGER만 일기를 쓸 수 있다', async () => {
    shareApi.getMembers.mockResolvedValue(wrap([
      { id: '9001', name: '김애월', role: 'ADMIN' },
      { id: '9002', name: '이지원', role: 'MANAGER' },
      { id: '9003', name: '박보기', role: 'VIEWER' },
    ]))

    const store = useShareStore()
    await store.fetchSharedCare('p1')

    expect(store.canWriteDiary('9001')).toBe(true)
    expect(store.canWriteDiary('9002')).toBe(true)
    expect(store.canWriteDiary('9003')).toBe(false)
    expect(store.canWriteDiary(null)).toBe(false)
  })

  it('기여도 조회가 실패해도 멤버 목록과 작성 권한은 유지한다', async () => {
    shareApi.getMembers.mockResolvedValue(wrap([
      { id: '9001', name: '김애월', role: 'ADMIN' },
    ]))
    shareApi.getContributions.mockRejectedValue(new Error('contribution failed'))

    const store = useShareStore()
    await store.fetchSharedCare('p1')

    expect(store.members.map((member) => member.id)).toEqual(['9001'])
    expect(store.contributions).toEqual([])
    expect(store.canWriteDiary('9001')).toBe(true)
    expect(store.error).toBe('')
  })
})
