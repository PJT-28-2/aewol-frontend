<script setup>
import AppInput from '@/components/common/AppInput.vue'

const props = defineProps({
  fields: {
    type: Array,
    required: true,
  },
})

const emit = defineEmits(['pdf-click'])

const appendUnit = (field) => {
  if (field.unit && field.value && !field.value.endsWith(field.unit)) {
    field.value = field.value + field.unit
  }
}
</script>

<template>
  <section class="bg-(--color-white) rounded-(--radius-xl) p-(--space-5) mb-(--space-5) [box-shadow:var(--shadow-md)]">
    <div class="flex justify-between items-center mb-(--space-4)">
      <span class="text-(length:--font-base) font-semibold text-(color:--color-gray-900)">보험금 청구서 초안</span>
      <button type="button" class="text-(length:--font-sm) text-(color:--color-gray-500)" @click="emit('pdf-click')">PDF 초안</button>
    </div>

    <ul>
      <li
        v-for="field in props.fields"
        :key="field.label"
        class="border-b border-(--color-border) last:border-0"
      >
        <!-- 직접 입력 가능한 필드 -->
        <div v-if="field.editable" class="py-(--space-3)">
          <div class="flex items-center justify-between mb-(--space-2)">
            <span class="text-(length:--font-sm) text-(color:--color-gray-600)">{{ field.label }}</span>
            <span
              class="text-(length:--font-xs) font-semibold px-(--space-2) py-[3px] rounded-(--radius-full)"
              :class="{
                'bg-(--color-gold-surface) text-(color:--color-gold-dark)': field.badge === 'required',
                'bg-(--color-info-surface) text-(color:--color-navy)':      field.badge === 'linked',
              }"
            >
              {{ field.badgeLabel }}
            </span>
          </div>
          <AppInput
            v-if="!field.unit"
            v-model="field.value"
            :placeholder="field.placeholder"
          />
          <input
            v-else
            v-model="field.value"
            :placeholder="field.placeholder"
            class="w-full h-(--control-height-md) px-(--space-3) text-(length:--font-md) text-(color:--color-gray-900) bg-(--color-surface) border border-(--color-border) rounded-(--radius-lg) outline-none placeholder:text-(color:--color-slate-muted) focus:border-(--color-navy)"
            @blur="appendUnit(field)"
          />
        </div>

        <!-- 자동 완성 필드 -->
        <div v-else class="flex items-center py-(--space-3) gap-(--space-2)">
          <span class="text-(length:--font-md) text-(color:--color-gray-600) flex-1">{{ field.label }}</span>
          <span class="text-(length:--font-md) font-semibold text-(color:--color-gray-900) text-right">{{ field.value }}</span>
          <span class="shrink-0 text-(length:--font-xs) font-semibold px-(--space-2) py-[3px] rounded-(--radius-full) bg-(--color-olive-surface) text-(color:--color-olive-dark)">
            {{ field.badgeLabel }}
          </span>
        </div>
      </li>
    </ul>
  </section>
</template>
