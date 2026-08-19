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

// 지금 보고 있는 화면을 다시 불러오는 것처럼, 이동할 곳이 없는 행동도 있다.
// 그럴 때 actionRoute를 비우고 이 이벤트를 받아 처리한다.
const emit = defineEmits(['action'])

const router = useRouter()

function handleAction() {
  emit('action')
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
