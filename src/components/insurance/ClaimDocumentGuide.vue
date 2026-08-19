<script setup>
import IconDocument from '@/components/common/icons/IconDocument.vue'

const props = defineProps({
  items: {
    type: Array,
    required: true,
  },
})
</script>

<template>
  <section class="rounded-(--radius-2xl) border border-(--color-card-border) bg-(--color-white) p-(--space-5) shadow-(--shadow-card)">
    <h2 class="text-(length:--font-base) font-semibold text-(color:--color-gray-900) mb-(--space-1)">
      이런 서류가 필요할 수 있어요
    </h2>
    <p class="text-(length:--font-sm) text-(color:--color-slate-muted) mb-(--space-4)">
      보험사와 상품에 따라 요청 서류가 달라질 수 있어요
    </p>
    <ul class="flex flex-col gap-(--space-4)">
      <li
        v-for="item in props.items"
        :key="item.name"
        class="flex items-center gap-(--space-3)"
      >
        <span
          class="w-(--space-8) h-(--space-8) rounded-(--radius-full) shrink-0 flex items-center justify-center bg-(--color-leaf-soft)"
          aria-hidden="true"
        >
          <IconDocument
            :size="16"
            color="var(--color-leaf-dark)"
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
