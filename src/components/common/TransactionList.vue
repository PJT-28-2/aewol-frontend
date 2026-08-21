<script setup>
defineProps({
  transactions: {
    type: Array,
    required: true,
  },
  detailQuery: {
    type: Object,
    default: () => ({}),
  },
  emptyText: {
    type: String,
    default: '거래 내역이 없습니다',
  },
})

function formatDate(isoDate) {
  const [, month, day] = isoDate.split('-')
  return `${month}.${day}`
}

function formatAmount(amount) {
  const sign = amount > 0 ? '+' : ''
  return `${sign}${amount.toLocaleString()}원`
}
</script>

<template>
  <section v-if="transactions.length">
    <template
      v-for="(tx, index) in transactions"
      :key="tx.id"
    >
      <p
        v-if="index === 0 || transactions[index - 1].date !== tx.date"
        class="text-(length:--font-xs) text-(color:--color-slate-muted) mt-(--space-4) mb-(--space-2)"
      >
        {{ formatDate(tx.date) }}
      </p>
      <router-link
        :to="{ path: `/wallet/history/${tx.id}`, query: detailQuery }"
        class="flex items-center justify-between py-(--space-3) no-underline"
      >
        <div>
          <p
            class="text-(length:--font-base) font-medium text-(color:--color-navy)"
          >
            {{ tx.title }}
          </p>
          <!-- subtitle이 빈 값(환불)이어도 이 줄의 높이는 유지한다. 완전히 빈 텍스트 노드는
               브라우저가 line box 자체를 만들지 않아 높이가 0이 돼버려서(카테고리가 있는
               다른 거래 행과 목록 안에서 높이가 들쭉날쭉해짐), 최소한 줄바꿈 없는 공백
               문자 하나(\u00A0)는 항상 넣어 line box를 유지한다 -->
          <p
            class="text-(length:--font-xs) text-(color:--color-slate-muted) mt-(--space-1)"
          >
            {{ tx.subtitle || '\u00A0' }}
          </p>
        </div>
        <p
          class="text-(length:--font-base) font-semibold"
          :class="
            tx.amount > 0
              ? 'text-(color:--color-leaf)'
              : 'text-(color:--color-navy)'
          "
        >
          {{ formatAmount(tx.amount) }}
        </p>
      </router-link>
    </template>
  </section>
  <p
    v-else
    class="text-center py-(--space-8) text-(color:--color-gray-500)"
  >
    {{ emptyText }}
  </p>
</template>
