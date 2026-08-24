import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, nextTick } from 'vue'
import { createPinia, setActivePinia } from 'pinia'

const mocks = vi.hoisted(() => ({
  getStatus: vi.fn(),
  cancel: vi.fn(),
  leave: vi.fn(),
  isAdmin: false,
  user: null,
  accessToken: null,
  routeQuery: {},
  routeParams: { gpId: '1' },
}))

vi.mock('vue-router', () => ({
  useRoute: () => ({ query: mocks.routeQuery, params: mocks.routeParams }),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
}))

vi.mock('@/api/groupPurchase', () => ({
  groupPurchaseApi: {
    getStatus: mocks.getStatus,
    cancel: mocks.cancel,
    leave: mocks.leave,
  },
}))

vi.mock('@/stores/auth', () => ({
  useAuthStore: () => ({
    isAdmin: mocks.isAdmin,
    user: mocks.user,
    accessToken: mocks.accessToken,
  }),
}))

vi.mock('@/components/common/PinAuthSheet.vue', () => ({
  default: {
    name: 'PinAuthSheet',
    props: ['modelValue', 'description'],
    emits: ['complete', 'update:modelValue'],
    template:
      '<button v-if="modelValue" type="button" data-testid="pin-complete" @click="$emit(\'complete\', \'123456\')">PIN 확인</button>',
  },
}))

import GroupPurchaseStatusView from './GroupPurchaseStatusView.vue'

const statusResult = (overrides = {}) => ({
  memberId: 'member-1',
  productName: '사료 5kg',
  status: 'OPEN',
  currentQuantity: 2,
  targetQuantity: 10,
  deadline: '2099-12-31T23:59:59',
  unitPrice: 30000,
  groupPrice: 25000,
  deliveryDate: '2099-12-31',
  noticeMessage: '결제는 미리 진행돼요',
  participantInfo: null,
  ...overrides,
})

let app
let host

const flush = async () => {
  for (let i = 0; i < 8; i += 1) {
    await Promise.resolve()
    await nextTick()
  }
}

const mountView = async () => {
  host = document.createElement('div')
  document.body.appendChild(host)
  app = createApp(GroupPurchaseStatusView)
  app.use(createPinia())
  app.mount(host)
  await flush()
}

const buttonByLabel = (label) =>
  [...host.querySelectorAll('button')].find((element) => element.textContent.trim() === label)

const unsignedJwt = (payload) => {
  const json = JSON.stringify(payload)
  const base64 = btoa(json).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  return `aaa.${base64}.bbb`
}

describe('GroupPurchaseStatusView 취소 버튼 소유권', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    mocks.isAdmin = false
    mocks.user = null
    mocks.accessToken = null
    mocks.routeQuery = {}
    mocks.routeParams = { gpId: '1' }
    mocks.getStatus.mockResolvedValue({ data: { result: statusResult() } })
    mocks.cancel.mockResolvedValue({ data: { result: {} } })
    mocks.leave.mockResolvedValue({ data: { result: {} } })
  })

  afterEach(() => {
    app?.unmount()
    host?.remove()
  })

  it('작성자 관리자에게는 공동구매 취소 버튼을 보여 준다', async () => {
    mocks.isAdmin = true
    mocks.user = { memberId: 'member-1' }

    await mountView()

    expect(buttonByLabel('공동구매 취소')).toBeTruthy()
    expect(buttonByLabel('참여 취소하기')).toBeUndefined()
  })

  it('작성자가 아닌 관리자에게는 취소 버튼을 숨긴다', async () => {
    mocks.isAdmin = true
    mocks.user = { memberId: 'admin-2' }

    await mountView()

    expect(buttonByLabel('공동구매 취소')).toBeUndefined()
    expect(buttonByLabel('참여 취소하기')).toBeUndefined()
  })

  it('작성자가 아닌 관리자라도 참여 이력이 있으면 참여 취소만 보여 준다', async () => {
    mocks.isAdmin = true
    mocks.user = { memberId: 'admin-2' }
    mocks.getStatus.mockResolvedValue({
      data: {
        result: statusResult({
          participantInfo: { participantId: 10, purchaseQuantity: 1 },
        }),
      },
    })

    await mountView()

    expect(buttonByLabel('공동구매 취소')).toBeUndefined()
    expect(buttonByLabel('참여 취소하기')).toBeTruthy()
  })

  it('참여한 일반 유저에게는 참여 취소 버튼을 보여 준다', async () => {
    mocks.isAdmin = false
    mocks.user = { memberId: 'member-9' }
    mocks.getStatus.mockResolvedValue({
      data: {
        result: statusResult({
          participantInfo: { participantId: 11, purchaseQuantity: 2 },
        }),
      },
    })

    await mountView()

    expect(buttonByLabel('공동구매 취소')).toBeUndefined()
    expect(buttonByLabel('참여 취소하기')).toBeTruthy()
  })

  it('프로필 memberId가 없어도 JWT sub가 작성자면 공동구매 취소를 보여 준다', async () => {
    mocks.isAdmin = true
    mocks.user = null
    mocks.accessToken = unsignedJwt({ sub: 'member-1', role: 'ADMIN' })

    await mountView()

    expect(buttonByLabel('공동구매 취소')).toBeTruthy()
  })

  it('작성자가 PIN을 확인하면 cancel API만 호출한다', async () => {
    mocks.isAdmin = true
    mocks.user = { memberId: 'member-1' }

    await mountView()
    buttonByLabel('공동구매 취소').click()
    await flush()
    host.querySelector('[data-testid="pin-complete"]').click()
    await flush()

    expect(mocks.cancel).toHaveBeenCalledWith('1', '123456')
    expect(mocks.leave).not.toHaveBeenCalled()
  })

  it('참여자가 PIN을 확인하면 leave API만 호출한다', async () => {
    mocks.isAdmin = false
    mocks.user = { memberId: 'member-9' }
    mocks.getStatus.mockResolvedValue({
      data: {
        result: statusResult({
          participantInfo: { participantId: 11, purchaseQuantity: 2 },
        }),
      },
    })

    await mountView()
    buttonByLabel('참여 취소하기').click()
    await flush()
    host.querySelector('[data-testid="pin-complete"]').click()
    await flush()

    expect(mocks.leave).toHaveBeenCalledWith('1', '123456')
    expect(mocks.cancel).not.toHaveBeenCalled()
  })
})
