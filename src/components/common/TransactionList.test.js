import { afterEach, describe, expect, it } from 'vitest'
import { createApp } from 'vue'
import TransactionList from './TransactionList.vue'

const RouterLink = {
  props: ['to'],
  template: '<a><slot /></a>',
}

let app
let host

afterEach(() => {
  app?.unmount()
  host?.remove()
})

describe('TransactionList', () => {
  it('긴 거래명은 두 줄로 제한하고 금액은 한 줄로 유지한다', () => {
    host = document.createElement('div')
    document.body.appendChild(host)
    app = createApp(TransactionList, {
      transactions: [{
        id: 'tx-1',
        date: '2026-08-24',
        title: '아이펫유 제니쥬 밸런스케어 강아지 유산균 영양제 장건강 구강 피부 건강 60정',
        subtitle: '기타',
        amount: -361000,
      }],
    })
    app.component('RouterLink', RouterLink)
    app.mount(host)

    const title = [...host.querySelectorAll('p')].find((element) =>
      element.textContent.includes('아이펫유 제니쥬'),
    )
    const amount = host.querySelector('[data-testid="transaction-amount"]')

    expect(title?.classList.contains('line-clamp-2')).toBe(true)
    expect(title?.parentElement?.classList.contains('min-w-0')).toBe(true)
    expect(amount?.textContent).toBe('-361,000원')
    expect(amount?.classList.contains('shrink-0')).toBe(true)
    expect(amount?.classList.contains('whitespace-nowrap')).toBe(true)
  })
})
