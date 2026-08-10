<script setup>
import IconCheck from '@/components/common/icons/IconCheck.vue'

const props = defineProps({
  items: {
    type: Array,
    required: true,
  },
})
</script>

<template>
  <section class="rounded-(--radius-2xl) border border-(--color-card-border) bg-(--color-white) p-(--space-5) shadow-(--shadow-card)">
    <h2 class="text-(length:--font-base) font-semibold text-(color:--color-gray-900) mb-(--space-4)">
      청구 서류 체크리스트
    </h2>
    <ul class="flex flex-col gap-(--space-4)">
      <li
        v-for="item in props.items"
        :key="item.name"
        class="flex items-center gap-(--space-3)"
      >
        <span
          class="w-(--space-6) h-(--space-6) rounded-(--radius-full) shrink-0 flex items-center justify-center border-2"
          role="img"
          :aria-label="item.checked ? `${item.name} 확보 완료` : `${item.name} 미확보`"
          :class="item.checked
            ? 'bg-(--color-leaf) border-(--color-leaf)'
            : 'border-(--color-gray-300)'"
        >
          <IconCheck
            v-if="item.checked"
            :size="14"
            color="var(--color-white)"
            aria-hidden="true"
          />
        </span>
        <div class="flex flex-col gap-(--space-1)">
          <span class="text-(length:--font-md) font-medium text-(color:--color-gray-900)">{{ item.name }}</span>
          <span class="text-(length:--font-sm) text-(color:--color-gray-500)">{{ item.sub }}</span>
        </div>
      </li>
    </ul>
  </section>
</template>
