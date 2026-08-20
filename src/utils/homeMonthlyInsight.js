const INSIGHT_CATEGORY_LABELS = {
  HOSPITAL: '의료',
  FOOD: '사료',
  SNACK: '간식',
  GROOMING: '미용',
  INSURANCE: '보험',
  SUPPLIES: '용품',
  DONATION: '기부',
  ETC: '기타',
}

const CHART_COLOR_TOKENS = [
  '--color-chart-leaf',
  '--color-chart-teal',
  '--color-chart-amber',
  '--color-chart-sage',
  '--color-chart-lilac',
]

const GROUP_PURCHASE_CATEGORY = {
  FOOD: '사료',
  SNACK: '간식',
  SUPPLIES: '용품',
}

const MIN_ELAPSED_DAYS = 5

export function insightCategoryLabel(category) {
  return INSIGHT_CATEGORY_LABELS[category] ?? INSIGHT_CATEGORY_LABELS.ETC
}

export function toInsightCategories(rawItems = []) {
  return rawItems
    .map((entry) => ({
      key: entry.category ?? 'ETC',
      label: insightCategoryLabel(entry.category),
      amount: Number(entry.amount ?? 0),
    }))
    .filter((item) => item.amount > 0)
    .sort((a, b) => b.amount - a.amount)
}

export function collapseChartCategories(list, limit = 4) {
  if (list.length <= limit) return list
  const visibleCount = Math.max(1, limit - 1)
  const visible = list.slice(0, visibleCount)
  const otherAmount = list
    .slice(visibleCount)
    .reduce((sum, item) => sum + item.amount, 0)
  return [
    ...visible,
    { key: 'OTHER', label: INSIGHT_CATEGORY_LABELS.ETC, amount: otherAmount },
  ]
}

export function withPercentages(list) {
  const total = list.reduce((sum, item) => sum + item.amount, 0)
  const items = list.map((item) => ({
    ...item,
    percentage: total ? Math.round((item.amount / total) * 100) : 0,
  }))

  if (total && items.length > 1) {
    const othersTotal = items
      .slice(0, -1)
      .reduce((sum, item) => sum + item.percentage, 0)
    items[items.length - 1].percentage = 100 - othersTotal
  }

  return items
}

export function withChartColors(list) {
  return list.map((item, index) => ({
    ...item,
    colorToken: CHART_COLOR_TOKENS[index % CHART_COLOR_TOKENS.length],
  }))
}

export function daysInMonth(date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
}

export function remainingDays(date) {
  return daysInMonth(date) - date.getDate()
}

export function projectMonthEnd(soFar, date) {
  const elapsed = date.getDate()
  const total = daysInMonth(date)
  if (soFar <= 0 || elapsed < MIN_ELAPSED_DAYS || elapsed >= total) return null
  return Math.round((soFar * total) / elapsed)
}

export function groupPurchaseCategory(txnKey) {
  return GROUP_PURCHASE_CATEGORY[txnKey] ?? null
}

const FOLLOW_UP_ORDER = {
  GROUP_PURCHASE: 0,
  INSURANCE: 1,
  SUPPORT: 2,
  DONATION: 3,
}

/** 도넛에 나온 지출 항목을 공동구매·보험·정책 지원·기부로 잇는다. 큰 비중부터 붙인다. */
export function spendingFollowUps(categories = []) {
  const followUps = []
  const gpItem = categories.find((item) => groupPurchaseCategory(item.key))
  if (gpItem) {
    followUps.push({
      type: 'GROUP_PURCHASE',
      sortAmount: gpItem.amount,
      category: gpItem,
      gpCategory: groupPurchaseCategory(gpItem.key),
    })
  }

  const insuranceItem = categories.find((item) => item.key === 'INSURANCE')
  const hospitalItem = categories.find((item) => item.key === 'HOSPITAL')
  if (insuranceItem || hospitalItem) {
    const source = insuranceItem && hospitalItem
      ? (insuranceItem.amount >= hospitalItem.amount ? insuranceItem : hospitalItem)
      : (insuranceItem ?? hospitalItem)
    followUps.push({
      type: 'INSURANCE',
      sortAmount: source.amount,
      category: source,
      fromInsurance: Boolean(insuranceItem),
      fromHospital: Boolean(hospitalItem),
    })
  }

  if (hospitalItem) {
    followUps.push({
      type: 'SUPPORT',
      sortAmount: hospitalItem.amount,
      category: hospitalItem,
    })
  }

  const donationItem = categories.find((item) => item.key === 'DONATION')
  if (donationItem) {
    followUps.push({
      type: 'DONATION',
      sortAmount: donationItem.amount,
      category: donationItem,
    })
  }

  return followUps.sort((a, b) => (
    b.sortAmount - a.sortAmount
    || FOLLOW_UP_ORDER[a.type] - FOLLOW_UP_ORDER[b.type]
  ))
}

export function followUpCopy(followUp, extras = {}) {
  if (!followUp) return null
  const { type, category, fromInsurance } = followUp
  const { petName = '반려동물', programCount = 0, programTitle = '' } = extras

  if (type === 'GROUP_PURCHASE') {
    return {
      title: `${category.label} 공동구매 추천`,
      ctaLabel: null,
      ctaPath: null,
    }
  }

  if (type === 'INSURANCE') {
    if (fromInsurance) {
      return {
        title: '보험료, 한번 비교해 보세요',
        body: `보험이 ${category.percentage}%(${formatWon(category.amount)}원)예요. 시뮬레이터로 손익분기를 확인해 보세요.`,
        ctaLabel: '보험료 시뮬레이션 하러 가기',
        ctaPath: '/insurance/simulator',
      }
    }
    return {
      title: '의료비, 보험으로 대비하기',
      body: `의료가 ${category.percentage}%(${formatWon(category.amount)}원)예요. 청구와 보험 비교를 이어서 해보세요.`,
      ctaLabel: '보험 확인하기',
      ctaPath: '/insurance',
    }
  }

  if (type === 'SUPPORT') {
    if (!programCount) return null
    return {
      title: '받을 수 있는 정책 지원',
      body: `${petName}가 지금 신청할 수 있는 지원이 ${programCount}건 있어요.${programTitle ? ` '${programTitle}'부터 확인해 보세요.` : ''}`,
      ctaLabel: '지원사업 보기',
      ctaPath: '/support-programs',
    }
  }

  if (type === 'DONATION') {
    return {
      title: '기부 이어가기',
      body: `이번 달 기부가 ${category.percentage}%예요. 짜투리지갑에서 이어서 기부할 수 있어요.`,
      ctaLabel: '기부하기',
      ctaPath: '/donation',
    }
  }

  return null
}

export function discountPercent(unitPrice, groupPrice) {
  if (!unitPrice || unitPrice <= groupPrice) return null
  return Math.round((1 - groupPrice / unitPrice) * 100)
}

export function formatWon(amount) {
  return Number(amount).toLocaleString('ko-KR')
}

export function changeRateText(changeRate) {
  const rate = Number(changeRate ?? 0)
  if (rate === 0) return null
  return `${rate > 0 ? '+' : ''}${rate}%`
}
