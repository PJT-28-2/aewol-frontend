import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

vi.mock('@/api/pet', () => ({
  petApi: {
    getPets: vi.fn(),
    getPet: vi.fn(),
    createPet: vi.fn(),
    updatePet: vi.fn(),
    deletePet: vi.fn(),
  },
}))

import { petApi } from '@/api/pet'
import { usePetStore } from './pet'

const pets = [
  { petId: 1, name: '포리', species: 'DOG' },
  { petId: 2, name: '나비', species: 'CAT', profileImg: '/uploads/nabi.png' },
]

describe('usePetStore', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
    vi.clearAllMocks()
    petApi.getPets.mockResolvedValue({ data: { result: pets } })
  })

  it('대표 반려동물 설정을 로컬 저장소에 유지한다', async () => {
    const store = usePetStore()
    await store.fetchPets()

    store.setRepresentativePet('2')

    expect(store.representativePetId).toBe('2')
    expect(localStorage.getItem('representativePetId')).toBe('2')
  })

  it('저장된 대표 반려동물이 목록에 있으면 다시 조회해도 유지한다', async () => {
    localStorage.setItem('representativePetId', '2')
    setActivePinia(createPinia())
    const store = usePetStore()

    await store.fetchPets()

    expect(store.representativePetId).toBe('2')
    expect(store.pets[1].profileImg).toBe('/uploads/nabi.png')
  })

  it('저장된 대표 반려동물이 없으면 첫 반려동물로 복구한다', async () => {
    localStorage.setItem('representativePetId', 'missing')
    setActivePinia(createPinia())
    const store = usePetStore()

    await store.fetchPets()

    expect(store.representativePetId).toBe('1')
    expect(localStorage.getItem('representativePetId')).toBe('1')
  })
})
