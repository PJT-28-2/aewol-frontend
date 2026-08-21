import IconBarberShop from '@/components/common/icons/IconBarberShop.vue'
import IconDogBowl from '@/components/common/icons/IconDogBowl.vue'
import IconEtc from '@/components/common/icons/IconEtc.vue'
import IconHospital from '@/components/common/icons/IconHospital.vue'
import IconShowerGel from '@/components/common/icons/IconShowerGel.vue'
import { CATEGORY_LABELS } from '@/constants/transactionCategory'

// 정기결제 카테고리 <-> 아이콘/배경색 매핑. 등록 화면과 관리·해지 화면이
// 서로 다른 매핑을 쓰면 등록한 카테고리와 다른 아이콘이 뜨는 문제가 생기므로
// 한 곳에서만 관리한다.
export const RECURRING_CATEGORIES = [
  { key: 'MEDICAL', label: CATEGORY_LABELS.MEDICAL, icon: IconHospital, bg: 'var(--color-icon-blue-soft)', tone: 'blue' },
  { key: 'GROOMING', label: CATEGORY_LABELS.GROOMING, icon: IconBarberShop, bg: 'var(--color-icon-pink-soft)', tone: 'pink' },
  { key: 'FOOD', label: CATEGORY_LABELS.FOOD, icon: IconDogBowl, bg: 'var(--color-icon-yellow-soft)', tone: 'yellow' },
  { key: 'SUPPLIES', label: CATEGORY_LABELS.SUPPLIES, icon: IconShowerGel, bg: 'var(--color-icon-green-soft)', tone: 'green' },
  { key: 'ETC', label: CATEGORY_LABELS.ETC, icon: IconEtc, bg: 'var(--color-icon-gray-soft)', tone: 'gray' },
]

export function getRecurringCategory(key) {
  return (
    RECURRING_CATEGORIES.find((category) => category.key === key) ??
    RECURRING_CATEGORIES[RECURRING_CATEGORIES.length - 1]
  )
}
