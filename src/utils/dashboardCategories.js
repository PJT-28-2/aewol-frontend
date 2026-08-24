const UI_CATEGORY_BY_API = {
  HOSPITAL: 'MEDICAL',
  MEDICAL: 'MEDICAL',
  FOOD: 'FOOD',
  GROOMING: 'GROOMING',
  TOY: 'SUPPLIES',
  SUPPLIES: 'SUPPLIES',
  ETC: 'ETC',
}

function normalizeCategoryKey(category) {
  if (category == null || String(category).trim() === '' || String(category).toLowerCase() === 'null') {
    return 'ETC'
  }
  return UI_CATEGORY_BY_API[category] ?? 'ETC'
}

export function mergeDashboardCategories(entries = []) {
  const grouped = new Map()

  entries.forEach((entry) => {
    const key = normalizeCategoryKey(entry.category)
    if (!grouped.has(key)) {
      grouped.set(key, { key, amount: 0, petBreakdown: [] })
    }
    const item = grouped.get(key)
    item.amount += Number(entry.amount ?? 0)

    ;(entry.petBreakdown ?? []).forEach((pet) => {
      const petId = pet.petId == null ? null : String(pet.petId)
      const existing = item.petBreakdown.find((candidate) => candidate.petId === petId)
      if (existing) {
        existing.amount += Number(pet.amount ?? 0)
      } else {
        item.petBreakdown.push({
          petId,
          petName: pet.petName,
          amount: Number(pet.amount ?? 0),
        })
      }
    })
  })

  return [...grouped.values()]
}

export function withWholePercentages(entries = []) {
  const total = entries.reduce((sum, item) => sum + item.amount, 0)
  if (!total) return entries.map((item) => ({ ...item, percentage: 0 }))

  const percentages = entries.map((item, index) => {
    const exact = (item.amount / total) * 100
    return { index, percentage: Math.floor(exact), remainder: exact % 1 }
  })
  let pointsLeft = 100 - percentages.reduce((sum, item) => sum + item.percentage, 0)

  percentages
    .slice()
    .sort((a, b) => b.remainder - a.remainder || a.index - b.index)
    .forEach((item) => {
      if (pointsLeft <= 0) return
      percentages[item.index].percentage += 1
      pointsLeft -= 1
    })

  return entries.map((item, index) => ({
    ...item,
    percentage: percentages[index].percentage,
  }))
}

export function sortByPercentageDescending(entries = []) {
  return [...entries].sort(
    (a, b) => b.percentage - a.percentage || b.amount - a.amount,
  )
}
