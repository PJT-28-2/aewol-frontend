import { afterEach, describe, expect, it, vi } from 'vitest'
import { createApp, nextTick, ref } from 'vue'
import RecommendedProductCarousel from './RecommendedProductCarousel.vue'

const product = (id) => ({
  id,
  productName: `상품 ${id}`,
  currentQuantity: 1,
  targetQuantity: 10,
  dDay: 'D-3',
  groupPrice: 1000,
  unitPrice: 1200,
  image: `https://cdn.example.com/products/${id}.webp`,
})

describe('RecommendedProductCarousel', () => {
  let app
  let host

  afterEach(() => {
    app?.unmount()
    host?.remove()
    vi.useRealTimers()
  })

  const mountCarousel = (products) => {
    host = document.createElement('div')
    document.body.appendChild(host)
    app = createApp({
      components: { RecommendedProductCarousel },
      setup: () => ({ products }),
      template: '<RecommendedProductCarousel :products="products" />',
    })
    app.component('RouterLink', {
      props: ['to'],
      template: '<a :href="to"><slot /></a>',
    })
    app.mount(host)
  }

  it('추천 상품의 썸네일을 표시한다', () => {
    mountCarousel([product(1)])

    const thumbnail = host.querySelector('[data-testid="recommended-product-thumbnail"] img')
    expect(thumbnail?.getAttribute('src')).toBe('https://cdn.example.com/products/1.webp')
    expect(thumbnail?.getAttribute('alt')).toBe('')
  })

  it('썸네일을 불러오지 못하면 공동구매 아이콘을 표시한다', async () => {
    mountCarousel([product(1)])

    host.querySelector('[data-testid="recommended-product-thumbnail"] img')
      .dispatchEvent(new Event('error'))
    await nextTick()

    const thumbnail = host.querySelector('[data-testid="recommended-product-thumbnail"]')
    expect(thumbnail.querySelector('img')).toBeNull()
    expect(thumbnail.querySelector('svg')).toBeTruthy()
  })

  it('상품 목록이 바뀌면 첫 상품으로 돌아가고 자동 전환을 다시 설정한다', async () => {
    vi.useFakeTimers()
    const products = ref([product(1), product(2), product(3)])
    mountCarousel(products)

    vi.advanceTimersByTime(7000)
    await nextTick()
    expect(host.querySelector('[style*="translateX"]')?.style.transform).toBe('translateX(-200%)')

    products.value = [product(4), product(5)]
    await nextTick()
    expect(host.querySelector('[style*="translateX"]')?.style.transform).toBe('translateX(-0%)')

    vi.advanceTimersByTime(3500)
    await nextTick()
    expect(host.querySelector('[style*="translateX"]')?.style.transform).toBe('translateX(-100%)')
  })

  it('사용자가 자동 넘김을 일시정지하고 다시 재생할 수 있다', async () => {
    vi.useFakeTimers()
    const products = ref([product(1), product(2)])
    mountCarousel(products)

    host.querySelector('[aria-label="추천 상품 자동 넘김 일시정지"]').click()
    vi.advanceTimersByTime(7000)
    await nextTick()
    expect(host.querySelector('[style*="translateX"]')?.style.transform).toBe('translateX(-0%)')

    host.querySelector('[aria-label="추천 상품 자동 넘김 재생"]').click()
    vi.advanceTimersByTime(3500)
    await nextTick()
    expect(host.querySelector('[style*="translateX"]')?.style.transform).toBe('translateX(-100%)')
  })
})
