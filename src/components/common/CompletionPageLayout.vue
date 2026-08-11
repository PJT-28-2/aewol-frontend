<script setup>
import AewolLogo from '@/components/common/AewolLogo.vue'
import StatusVisual from '@/components/common/StatusVisual.vue'

defineProps({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  variant: { type: String, default: 'success' },
})
</script>

<template>
  <main class="mx-auto flex min-h-[calc(100svh-var(--bottom-nav-height)-var(--space-6))] w-full max-w-(--content-max-width) flex-col bg-(--color-app-bg) px-(--space-5) pt-(--space-6) pb-(--space-5) text-center">
    <AewolLogo
      size="22"
      class="self-start"
    />

    <section class="flex w-full flex-1 flex-col items-center justify-center py-(--space-7)">
      <StatusVisual
        :variant="variant"
        size="126"
      />
      <h1 class="mt-(--space-7) text-(length:--font-2xl) font-bold text-(color:--color-navy)">
        {{ title }}
      </h1>
      <p
        v-if="description"
        class="mt-(--space-3) text-(length:--font-md) leading-relaxed text-(color:--color-slate-muted)"
      >
        {{ description }}
      </p>
      <slot />
    </section>

    <div class="w-full [&>*]:!rounded-[20px]">
      <slot name="action" />
    </div>
  </main>
</template>
