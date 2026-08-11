<script setup>
import { useRouter } from 'vue-router'
import AppButton from './AppButton.vue'
import FeatureIconTile from './FeatureIconTile.vue'

const props = defineProps({
  icon: {
    type: [Object, Function],
    default: null,
  },
  message: {
    type: String,
    required: true,
  },
  actionText: {
    type: String,
    default: '',
  },
  actionRoute: {
    type: String,
    default: '',
  },
})

const router = useRouter()

function handleAction() {
  if (props.actionRoute) {
    router.push(props.actionRoute)
  }
}
</script>

<template>
  <div class="flex flex-col items-center justify-center px-(--space-4) py-(--space-10) text-center">
    <FeatureIconTile
      v-if="icon"
      class="mb-(--space-4)"
      :icon="icon"
      tone="gray"
    />
    <p
      class="text-(length:--font-md) leading-[1.6] whitespace-pre-line text-(color:--color-slate-dark)"
      :class="actionText ? 'mb-(--space-6)' : ''"
    >
      {{ message }}
    </p>
    <AppButton
      v-if="actionText"
      size="md"
      @click="handleAction"
    >
      {{ actionText }}
    </AppButton>
  </div>
</template>
