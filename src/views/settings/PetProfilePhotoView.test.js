import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, nextTick } from 'vue'
import { createPinia, setActivePinia } from 'pinia'

const mocks = vi.hoisted(() => ({
  replace: vi.fn(),
  generateCharacter: vi.fn(),
  fetchPets: vi.fn(),
}))

vi.mock('vue-router', () => ({
  useRoute: () => ({ query: {}, params: {} }),
  useRouter: () => ({ push: vi.fn(), replace: mocks.replace, back: vi.fn() }),
  RouterLink: { props: ['to'], template: '<a><slot /></a>' },
}))

vi.mock('@/api/pet', () => ({
  petApi: { generateCharacter: mocks.generateCharacter },
}))

vi.mock('@/stores/pet', () => ({
  usePetStore: () => ({
    pets: [{ id: '9001', name: '보리', species: 'DOG', profileImg: null, characterImg: null }],
    representativePetId: '9001',
    fetchPets: mocks.fetchPets,
  }),
}))

import PetProfilePhotoView from './PetProfilePhotoView.vue'

let app
let host

const flush = async () => {
  await Promise.resolve()
  await Promise.resolve()
  await nextTick()
}

const mountView = () => {
  host = document.createElement('div')
  document.body.appendChild(host)
  app = createApp(PetProfilePhotoView)
  app.use(createPinia())
  app.mount(host)
}

const findButtonByText = (text) =>
  [...host.querySelectorAll('button')].find((button) => button.textContent.includes(text))

describe('PetProfilePhotoView 기본 캐릭터로 건너뛰기', () => {
  beforeEach(async () => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    mocks.fetchPets.mockResolvedValue(undefined)
    mountView()
    await flush()
  })

  afterEach(() => {
    app?.unmount()
    host?.remove()
  })

  // 회의 피드백: "사진 안 넣고 싶을 때는? → 우리 기본 캐릭터 넣어주기"
  it('업로드 단계에서 사진 없이 넘어가는 선택지를 준다', () => {
    expect(findButtonByText('사진 없이 기본 캐릭터 쓰기')).toBeTruthy()
  })

  // 표시단이 빈 값을 종별 기본 캐릭터로 폴백하므로 생성도 저장도 필요 없다.
  // 여기서 생성 API를 부르면 요금과 일일 한도를 쓸데없이 소모한다.
  it('건너뛰면 캐릭터 생성 API를 부르지 않는다', async () => {
    findButtonByText('사진 없이 기본 캐릭터 쓰기').click()
    await flush()

    expect(mocks.generateCharacter).not.toHaveBeenCalled()
  })

  it('건너뛰면 다음 화면으로 이동한다', async () => {
    findButtonByText('사진 없이 기본 캐릭터 쓰기').click()
    await flush()

    expect(mocks.replace).toHaveBeenCalledWith('/home')
  })
})
