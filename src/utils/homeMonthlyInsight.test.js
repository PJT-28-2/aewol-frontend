import { describe, expect, it } from 'vitest'
import {
  collapseChartCategories,
  discountPercent,
  followUpCopy,
  groupPurchaseCategory,
  insightCategoryLabel,
  projectMonthEnd,
  remainingDays,
  spendingFollowUps,
  toInsightCategories,
  withChartColors,
  withPercentages,
} from './homeMonthlyInsight'

describe('homeMonthlyInsight', () => {
  it('도넛 항목이 많으면 나머지를 기타로 합쳐 전체 비율을 보존한다', () => {
    const categories = toInsightCategories([
      { category: 'FOOD', amount: 40 },
      { category: 'SNACK', amount: 30 },
      { category: 'HOSPITAL', amount: 20 },
      { category: 'GROOMING', amount: 5 },
      { category: 'DONATION', amount: 5 },
    ])

    const chartItems = withPercentages(collapseChartCategories(categories))

    expect(chartItems.map(({ label, amount }) => [label, amount])).toEqual([
      ['사료', 40],
      ['간식', 30],
      ['의료', 20],
      ['기타', 10],
    ])
    expect(chartItems.reduce((sum, item) => sum + item.percentage, 0)).toBe(100)
  })

  it('백엔드 카테고리 코드를 홈 인사이트 라벨로 바꾼다', () => {
    expect(insightCategoryLabel('FOOD')).toBe('사료')
    expect(insightCategoryLabel('INSURANCE')).toBe('보험')
    expect(insightCategoryLabel('HOSPITAL')).toBe('의료')
    expect(insightCategoryLabel('UNKNOWN')).toBe('기타')
  })

  it('금액 큰 순으로 모으고 0원은 뺀다', () => {
    expect(
      toInsightCategories([
        { category: 'SNACK', amount: 8000 },
        { category: 'FOOD', amount: 74000 },
        { category: 'ETC', amount: 0 },
      ]),
    ).toEqual([
      { key: 'FOOD', label: '사료', amount: 74000 },
      { key: 'SNACK', label: '간식', amount: 8000 },
    ])
  })

  it('비율 합이 100이 되게 마지막 항목을 보정한다', () => {
    const items = withPercentages([
      { key: 'FOOD', amount: 74000 },
      { key: 'SNACK', amount: 15700 },
      { key: 'HOSPITAL', amount: 3000 },
    ])

    expect(items.map((item) => item.percentage).reduce((sum, n) => sum + n, 0)).toBe(100)
    expect(items[0].percentage).toBe(80)
  })

  it('큰 비중부터 차트 색을 붙인다', () => {
    expect(withChartColors([{ key: 'FOOD' }, { key: 'SNACK' }]).map((item) => item.colorToken)).toEqual([
      '--color-chart-leaf',
      '--color-chart-teal',
    ])
  })

  it('관측 일수가 짧거나 말일이면 월말 전망을 만들지 않는다', () => {
    expect(projectMonthEnd(92700, new Date(2026, 7, 3))).toBeNull()
    expect(projectMonthEnd(92700, new Date(2026, 7, 31))).toBeNull()
  })

  it('월말 전망과 남은 날을 계산한다', () => {
    expect(projectMonthEnd(92700, new Date(2026, 7, 20))).toBe(143685)
    expect(remainingDays(new Date(2026, 7, 20))).toBe(11)
  })

  it('공동구매 카테고리는 사료·간식·용품만 연결한다', () => {
    expect(groupPurchaseCategory('FOOD')).toBe('사료')
    expect(groupPurchaseCategory('INSURANCE')).toBeNull()
  })

  it('소비 비중 큰 항목부터 공동구매·보험·정책 지원을 잇는다', () => {
    const followUps = spendingFollowUps([
      { key: 'INSURANCE', label: '보험', amount: 85000, percentage: 48 },
      { key: 'FOOD', label: '사료', amount: 74000, percentage: 42 },
      { key: 'HOSPITAL', label: '의료', amount: 4000, percentage: 2 },
    ])

    expect(followUps.map((item) => item.type)).toEqual([
      'INSURANCE',
      'GROUP_PURCHASE',
      'SUPPORT',
    ])
    expect(followUps[1].gpCategory).toBe('사료')
  })

  it('보험 지출이면 시뮬레이터로, 의료 지출이면 지원사업으로 안내한다', () => {
    const insurance = followUpCopy({
      type: 'INSURANCE',
      fromInsurance: true,
      category: { percentage: 48, amount: 85000 },
    })
    expect(insurance.ctaPath).toBe('/insurance/simulator')
    expect(insurance.body).toContain('48%')

    const support = followUpCopy(
      { type: 'SUPPORT', category: { label: '의료', percentage: 2, amount: 4000 } },
      { petName: '보리', programCount: 3, programTitle: '반려동물 진료비 지원' },
    )
    expect(support.ctaPath).toBe('/support-programs')
    expect(support.body).toContain('3건')
    expect(followUpCopy({ type: 'SUPPORT', category: {} }, { programCount: 0 })).toBeNull()
  })

  it('정가 대비 공구가를 할인율로 바꾼다', () => {
    expect(discountPercent(45000, 32000)).toBe(29)
    expect(discountPercent(32000, 32000)).toBeNull()
  })
})
