import { acceptHMRUpdate, defineStore } from 'pinia'

const STORAGE_KEY = 'aewolPetMemories'

function loadSavedMemories() {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '[]')
    if (!Array.isArray(parsed)) return []
    return parsed.filter((memory) => memory && !String(memory.id).startsWith('sample-'))
  } catch {
    return []
  }
}

export const usePetMemoryStore = defineStore('petMemory', {
  state: () => ({
    memories: loadSavedMemories(),
  }),

  actions: {
    addMemory(memory) {
      const entry = {
        ...memory,
        id: `memory-${Date.now()}`,
        petId: String(memory.petId),
        createdAt: new Date().toISOString(),
      }

      this.memories.unshift(entry)

      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(this.memories))
      } catch {
        // 큰 이미지로 저장 공간이 부족해도 현재 실행 중인 기록은 유지한다.
      }

      return entry
    },
  },
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(usePetMemoryStore, import.meta.hot))
}
