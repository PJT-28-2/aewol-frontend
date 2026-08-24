import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, nextTick } from 'vue'
import { createPinia, setActivePinia } from 'pinia'

const mocks = vi.hoisted(() => ({
  fetchWallet: vi.fn(),
  fetchPets: vi.fn(),
  startCamera: vi.fn(),
}))

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: vi.fn() }),
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
    wallet: { totalBalance: 10000 },
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

describe('QrPaymentView 지갑 라벨', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    mocks.fetchWallet.mockResolvedValue({})
    mocks.fetchPets.mockResolvedValue([])
    host = document.createElement('div')
    document.body.appendChild(host)
    app = createApp(QrPaymentView)
    app.use(createPinia())
    app.mount(host)
  })

  afterEach(() => {
    app?.unmount()
    host?.remove()
  })

  it('시연용 포리 이름 대신 실제 반려동물 이름을 보여준다', async () => {
    await Promise.resolve()
    await nextTick()
    expect(host.textContent).toContain('보리의 애월 지갑')
    expect(host.textContent).not.toContain('포리의 애월 지갑')
  })

  it('내 바코드를 고르면 시연용 결제 코드를 보여준다', async () => {
    await Promise.resolve()
    await nextTick()
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
