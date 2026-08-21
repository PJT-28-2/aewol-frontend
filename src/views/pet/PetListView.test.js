import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, nextTick } from 'vue'
import { createPinia, setActivePinia } from 'pinia'

const mocks = vi.hoisted(() => ({
  query: {},
  push: vi.fn(),
  fetchPets: vi.fn(),
  setRepresentativePet: vi.fn(),
}))

vi.mock('vue-router', () => ({
  useRoute: () => ({ query: mocks.query }),
  useRouter: () => ({ push: mocks.push, replace: vi.fn() }),
}))

// storeToRefs는 진짜 Pinia 스토어를 요구한다. 평범한 객체나 reactive로는 state를
// 못 읽어 pets가 undefined가 된다.
const PETS = [
  { id: '9001', name: '보리', species: 'DOG', breed: '푸들', birthDate: '2020-01-01' },
  { id: '9002', name: '나비', species: 'CAT', breed: '샴', birthDate: '2021-01-01' },
]

vi.mock('@/stores/pet', async () => {
  const { defineStore } = await import('pinia')
  return {
    usePetStore: defineStore('pet', {
      state: () => ({ pets: PETS, representativePetId: '9002' }),
      actions: {
        fetchPets: mocks.fetchPets,
        setRepresentativePet: mocks.setRepresentativePet,
      },
    }),
  }
})

import PetListView from './PetListView.vue'

// <router-link>는 라우터 플러그인이 전역 등록하는 컴포넌트라 vue-router 모듈 mock으로는
// 대체되지 않는다. 앱에 직접 등록해야 하고, to를 href로 펼쳐 경로와 query를 검사한다.
const RouterLinkStub = {
  props: ['to'],
  template: '<a :href="href"><slot /></a>',
  computed: {
    href() {
      if (typeof this.to === 'string') return this.to
      const query = new URLSearchParams(this.to.query ?? {}).toString()
      return query ? `${this.to.path}?${query}` : this.to.path
    },
  },
}

let app
let host

// onMounted가 fetchPets를 await한 뒤에야 로딩 분기가 풀린다. 마이크로태스크를 넉넉히 돌린다.
const flush = async () => {
  for (let i = 0; i < 12; i += 1) await Promise.resolve()
  await nextTick()
}

const mountView = async () => {
  host = document.createElement('div')
  document.body.appendChild(host)
  app = createApp(PetListView)
  app.use(createPinia())
  app.component('RouterLink', RouterLinkStub)
  app.mount(host)
  await flush()
}

const diaryLink = () =>
  [...host.querySelectorAll('a')].find((a) => a.getAttribute('href')?.startsWith('/share/diary'))

describe('PetListView 육아일기 진입', () => {
  beforeEach(async () => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    mocks.query = {}
    mocks.fetchPets.mockResolvedValue(undefined)
    await mountView()
  })

  afterEach(() => {
    app?.unmount()
    host?.remove()
  })

  // petId를 빼면 ShareDiaryView가 pets[0]으로 떨어져, 여러 마리일 때 지금 고른
  // 반려동물이 아닌 첫 번째 일기가 열린다.
  it('선택한 반려동물의 petId를 실어 일기 화면으로 보낸다', () => {
    expect(diaryLink()?.getAttribute('href')).toBe('/share/diary?petId=9002')
  })

  it('대표 반려동물이 첫 번째가 아니어도 그 반려동물을 가리킨다', () => {
    expect(diaryLink()?.getAttribute('href')).not.toBe('/share/diary?petId=9001')
  })
})
