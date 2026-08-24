import { describe, expect, it } from 'vitest'
import {
  mergeDashboardCategories,
  sortByPercentageDescending,
  withWholePercentages,
} from './dashboardCategories'

describe('dashboardCategories', () => {
  it('ETC와 null 문자열 카테고리를 하나로 합친다', () => {
    const result = mergeDashboardCategories([
      { category: 'ETC', amount: 2000, petBreakdown: [{ petId: 1, petName: '포리', amount: 2000 }] },
      { category: 'null', amount: 24000, petBreakdown: [{ petId: 1, petName: '포리', amount: 24000 }] },
    ])

    expect(result).toEqual([{
      key: 'ETC',
      amount: 26000,
      petBreakdown: [{ petId: '1', petName: '포리', amount: 26000 }],
    }])
  })

  it('API 코드와 화면 코드를 모두 유효한 화면 카테고리로 정규화한다', () => {
    const result = mergeDashboardCategories([
      { category: 'HOSPITAL', amount: 1000 },
      { category: 'MEDICAL', amount: 2000 },
      { category: 'TOY', amount: 3000 },
      { category: 'SUPPLIES', amount: 4000 },
    ])

    expect(result.map(({ key, amount }) => ({ key, amount }))).toEqual([
      { key: 'MEDICAL', amount: 3000 },
      { key: 'SUPPLIES', amount: 7000 },
    ])
  })

  it('합계 100%를 유지하면서 3,000원 항목을 1%로 표시한다', () => {
    const result = withWholePercentages([
      { amount: 26000 },
      { amount: 109000 },
      { amount: 55000 },
      { amount: 73600 },
      { amount: 3000 },
    ])

    expect(result.map((item) => item.percentage)).toEqual([10, 41, 21, 27, 1])
    expect(result.reduce((sum, item) => sum + item.percentage, 0)).toBe(100)
  })

  it('퍼센트가 높은 항목부터 정렬한다', () => {
    const result = sortByPercentageDescending([
      { key: 'ETC', amount: 26000, percentage: 10 },
      { key: 'FOOD', amount: 109000, percentage: 41 },
      { key: 'SUPPLIES', amount: 3000, percentage: 1 },
      { key: 'MEDICAL', amount: 73600, percentage: 28 },
    ])

    expect(result.map((item) => item.key)).toEqual(['FOOD', 'MEDICAL', 'ETC', 'SUPPLIES'])
  })
})
