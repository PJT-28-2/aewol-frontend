import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { usePetMemoryStore } from './petMemory'

describe('usePetMemoryStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    window.localStorage.clear()
  })

  it('샘플 추억을 기본 목록에 넣지 않는다', () => {
    const store = usePetMemoryStore()
    expect(store.memories).toEqual([])
  })

  it('저장해 둔 사용자 기록만 복구한다', () => {
    window.localStorage.setItem('aewolPetMemories', JSON.stringify([
      { id: 'sample-1', petName: '소로' },
      { id: 'memory-1', petName: '보리', petId: '1' },
    ]))
    setActivePinia(createPinia())
    const store = usePetMemoryStore()
    expect(store.memories).toEqual([{ id: 'memory-1', petName: '보리', petId: '1' }])
  })
})
