const TOSS_CUSTOMER_KEY = 'tossCustomerKey'

function createCustomerKey() {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return `aewol-${globalThis.crypto.randomUUID()}`
  }
  return `aewol-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`
}

export function getTossCustomerKey() {
  const saved = sessionStorage.getItem(TOSS_CUSTOMER_KEY)
  if (saved) return saved

  const customerKey = createCustomerKey()
  sessionStorage.setItem(TOSS_CUSTOMER_KEY, customerKey)
  return customerKey
}
