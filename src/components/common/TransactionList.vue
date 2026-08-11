<script setup>
defineProps({
  transactions: {
    type: Array,
    required: true,
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
        :to="`/wallet/history/${tx.id}`"
        class="flex items-center justify-between py-(--space-3) no-underline"
      >
        <div>
          <p
            class="text-(length:--font-base) font-medium text-(color:--color-navy)"
          >
            {{ tx.title }}
          </p>
          <p
            class="text-(length:--font-xs) text-(color:--color-slate-muted) mt-(--space-1)"
          >
            {{ tx.subtitle }}
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
