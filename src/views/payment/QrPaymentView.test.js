import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, nextTick } from 'vue'
import { createPinia, setActivePinia } from 'pinia'

const mocks = vi.hoisted(() => ({
  fetchWallet: vi.fn(),
  fetchPets: vi.fn(),
  startCamera: vi.fn(),
  push: vi.fn(),
  replace: vi.fn(),
  query: {},
}))

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: mocks.push, replace: mocks.replace }),
  useRoute: () => ({ query: mocks.query }),
}))

vi.mock('@/api/transaction', () => ({
  transactionApi: { createPayment: vi.fn() },
}))

vi.mock('@/composables/useQrScanner', () => ({
  FILE_DECODE_ERROR_MESSAGE: 'decode error',
  useQrScanner: () => ({
    videoRef: { value: null },
    isCameraOn: { value: false },
    isCameraStarting: { value: false },
    cameraError: { value: '' },
    startCamera: mocks.startCamera,
    stopCamera: vi.fn(),
    decodeImageFile: vi.fn(),
  }),
}))

vi.mock('@/stores/wallet', () => ({
  useWalletStore: () => ({
    wallet: { totalBalance: 100000 },
    fetchWallet: mocks.fetchWallet,
  }),
}))

vi.mock('@/stores/auth', () => ({
  useAuthStore: () => ({
    accessToken: 'test-token',
  }),
}))

vi.mock('@/stores/pet', () => ({
  usePetStore: () => ({
    pets: [{ id: '9001', name: '보리' }],
    representativePetId: '9001',
    fetchPets: mocks.fetchPets,
  }),
}))

import QrPaymentView from './QrPaymentView.vue'

let app
let host

const flush = async () => {
  await Promise.resolve()
  await nextTick()
}

const mountView = async () => {
  host = document.createElement('div')
  document.body.appendChild(host)
  app = createApp(QrPaymentView)
  app.use(createPinia())
  app.mount(host)
  await flush()
}

describe('QrPaymentView', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    mocks.fetchWallet.mockResolvedValue({})
    mocks.fetchPets.mockResolvedValue([])
    mocks.query = {}
    vi.clearAllMocks()
  })

  afterEach(() => {
    app?.unmount()
    host?.remove()
  })

  it('시연용 포리 이름 대신 실제 반려동물 이름을 보여준다', async () => {
    await mountView()

    expect(host.textContent).toContain('보리의 애월 지갑')
    expect(host.textContent).not.toContain('포리의 애월 지갑')
  })

  it('마켓에서 열리면 스캔 없이 결제 확인 화면을 보여준다', async () => {
    mocks.query = { merchant: '멍냥마켓', amount: '51800' }

    await mountView()

    expect(mocks.startCamera).not.toHaveBeenCalled()
    expect(host.querySelector('h1').textContent.trim()).toBe('결제')
    expect(host.textContent).toContain('멍냥마켓')
    expect(host.textContent).toContain('51,800원')
    expect(host.textContent).toContain('취소')
    expect(host.textContent).not.toContain('다시 스캔하기')
  })

  it('결제 쿼리가 없으면 카메라를 연다', async () => {
    await mountView()

    expect(mocks.startCamera).toHaveBeenCalledTimes(1)
    expect(host.querySelector('h1').textContent.trim()).toBe('QR 결제')
  })

  it('내 바코드를 고르면 시연용 결제 코드를 보여준다', async () => {
    await mountView()
    const barcodeTab = [...host.querySelectorAll('button')]
      .find((button) => button.textContent.includes('내 바코드'))
    barcodeTab.click()
    await nextTick()

    expect(host.textContent).toContain('매장 직원에게 이 바코드를 보여주세요')
    expect(host.textContent).toContain('시연용이라 실제 결제는 되지 않아요')
    expect(host.querySelector('[aria-label="결제 바코드"]')).not.toBeNull()
    expect(host.querySelector('[aria-label="결제 QR"]')).not.toBeNull()
  })
})
