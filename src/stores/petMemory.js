import { acceptHMRUpdate, defineStore } from 'pinia'
import dogMemoryImage from '@/assets/images/pet-poodle-home-mascot-v2.png'
import catMemoryImage from '@/assets/images/pet-siamese-home-mascot-v2.png'

const STORAGE_KEY = 'aewolPetMemories'

const sampleMemories = [
  {
    id: 'sample-1',
    petId: '1',
    petName: '소로',
    authorId: 'current-user',
    authorName: '김애월',
    imageUrl: dogMemoryImage,
    description: '산책하다가 좋아하는 풀숲에서 한참 냄새를 맡았어요.',
    createdAt: '2026-08-09T19:24:00+09:00',
  },
  {
    id: 'sample-2',
    petId: '2',
    petName: '나비',
    authorId: 'member-jiwon',
    authorName: '이지원',
    imageUrl: catMemoryImage,
    description: '창가에 앉아 햇볕을 쬐며 느긋하게 쉬는 중이에요.',
    createdAt: '2026-08-09T14:10:00+09:00',
  },
  {
    id: 'sample-3',
    petId: '1',
    petName: '소로',
    authorId: 'member-minsu',
    authorName: '박민수',
    imageUrl: dogMemoryImage,
    description: '간식 봉투 소리를 듣고 제일 먼저 달려온 날!',
    createdAt: '2026-08-09T09:42:00+09:00',
  },
  {
    id: 'sample-4',
    petId: '2',
    petName: '나비',
    authorId: 'current-user',
    authorName: '김애월',
    imageUrl: catMemoryImage,
    description: '아침부터 장난감 쥐를 물고 와서 같이 놀아달라고 했어요.',
    createdAt: '2026-08-08T21:12:00+09:00',
  },
  {
    id: 'sample-5',
    petId: '1',
    petName: '소로',
    authorId: 'member-jiwon',
    authorName: '이지원',
    imageUrl: dogMemoryImage,
    description: '비가 그치자마자 짧게 동네 한 바퀴를 산책했어요.',
    createdAt: '2026-08-08T18:35:00+09:00',
  },
  {
    id: 'sample-6',
    petId: '2',
    petName: '나비',
    authorId: 'member-minsu',
    authorName: '박민수',
    imageUrl: catMemoryImage,
    description: '새로 꺼낸 담요가 마음에 드는지 하루 종일 꼭 붙어 있었어요.',
    createdAt: '2026-08-08T10:05:00+09:00',
  },
  {
    id: 'sample-7',
    petId: '1',
    petName: '소로',
    authorId: 'current-user',
    authorName: '김애월',
    imageUrl: dogMemoryImage,
    description: '밥을 다 먹고 빈 그릇 앞에서 한참 더 기다리던 귀여운 순간.',
    createdAt: '2026-08-07T20:18:00+09:00',
  },
  {
    id: 'sample-8',
    petId: '2',
    petName: '나비',
    authorId: 'member-jiwon',
    authorName: '이지원',
    imageUrl: catMemoryImage,
    description: '창문 밖 새를 발견하고 꼬리를 살랑살랑 흔들었어요.',
    createdAt: '2026-08-07T15:26:00+09:00',
  },
  {
    id: 'sample-9',
    petId: '1',
    petName: '소로',
    authorId: 'member-minsu',
    authorName: '박민수',
    imageUrl: dogMemoryImage,
    description: '낮잠에서 깨자마자 가족들에게 차례로 인사하러 왔어요.',
    createdAt: '2026-08-07T08:48:00+09:00',
  },
]

function loadSavedMemories() {
  try {
    return JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '[]')
  } catch {
    return []
  }
}

export const usePetMemoryStore = defineStore('petMemory', {
  state: () => ({
    memories: [...loadSavedMemories(), ...sampleMemories],
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
        const savedMemories = this.memories.filter(({ id }) => !String(id).startsWith('sample-'))
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(savedMemories))
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
