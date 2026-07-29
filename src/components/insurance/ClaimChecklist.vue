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
  <section class="bg-(--color-white) rounded-(--radius-xl) p-(--space-5) [box-shadow:var(--shadow-md)]">
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
          class="w-6 h-6 rounded-(--radius-full) shrink-0 flex items-center justify-center border-2"
          :class="item.checked
            ? 'bg-(--color-success) border-(--color-success)'
            : 'border-(--color-gray-300)'"
        >
          <IconCheck v-if="item.checked" :size="14" color="var(--color-white)" />
        </span>
        <div class="flex flex-col gap-[2px]">
          <span class="text-(length:--font-md) font-medium text-(color:--color-gray-900)">{{ item.name }}</span>
          <span class="text-(length:--font-sm) text-(color:--color-gray-500)">{{ item.sub }}</span>
        </div>
      </li>
    </ul>
  </section>
</template>
