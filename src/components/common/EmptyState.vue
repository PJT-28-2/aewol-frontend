<script setup>
import { useRouter } from 'vue-router'

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
  <div class="empty-state">
    <component
      :is="icon"
      v-if="icon"
      class="empty-state__icon"
      :size="48"
    />
    <p class="empty-state__message whitespace-pre-line">
      {{ message }}
    </p>
    <button
      v-if="actionText"
      class="empty-state__action"
      @click="handleAction"
    >
      {{ actionText }}
    </button>
  </div>
</template>

<style scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-10) var(--space-4);
  text-align: center;
}

.empty-state__icon {
  color: var(--color-gray-400);
  margin-bottom: var(--space-4);
}

.empty-state__message {
  font-size: var(--font-md);
  color: var(--color-gray-600);
  line-height: 1.6;
  margin-bottom: var(--space-6);
}

.empty-state__action {
  padding: var(--space-3) var(--space-6);
  background-color: var(--color-gold);
  color: var(--color-white);
  font-size: var(--font-md);
  font-weight: var(--font-semibold);
  border-radius: var(--radius-md);
  transition: opacity 0.2s;
}

.empty-state__action:hover {
  opacity: 0.9;
}
</style>
