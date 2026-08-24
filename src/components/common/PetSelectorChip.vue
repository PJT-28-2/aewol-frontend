<script setup>
import { computed } from 'vue'
import IconCat from '@/components/common/icons/IconCat.vue'
import IconDog from '@/components/common/icons/IconDog.vue'

const props = defineProps({
  label: { type: String, required: true },
  species: { type: String, default: '' },
  selected: { type: Boolean, default: false },
})

const normalizedSpecies = computed(() => props.species.toUpperCase())
const petIcon = computed(() => normalizedSpecies.value === 'CAT' ? IconCat : IconDog)
const iconToneClass = computed(() => {
  if (props.selected) return 'text-(--color-leaf)'
  return normalizedSpecies.value === 'CAT'
    ? 'text-(--color-icon-purple)'
    : 'text-(--color-icon-green)'
})
</script>

<template>
  <button
    type="button"
    class="inline-flex h-(--control-height-sm) shrink-0 items-center gap-(--space-2) whitespace-nowrap rounded-full border px-(--space-4) text-(length:--font-sm) font-semibold transition-colors"
    :class="selected
      ? 'border-(--color-navy) bg-(--color-brand-dark) text-(color:--color-contrast)'
      : 'border-(--color-card-border) bg-(--color-white) text-(color:--color-slate-dark)'"
    :aria-pressed="selected"
  >
    <component
      :is="petIcon"
      v-if="species"
      :size="18"
      color="currentColor"
      :class="iconToneClass"
    />
    {{ label }}
  </button>
</template>
