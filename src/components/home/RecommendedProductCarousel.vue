<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import IconGroupPurchase from '@/components/common/icons/IconGroupPurchase.vue'

const props = defineProps({
  products: {
    type: Array,
    required: true,
  },
})

const AUTO_ADVANCE_MS = 3500
const SWIPE_THRESHOLD = 40

const activeIndex = ref(0)
const isPaused = ref(false)
const brokenImageUrls = ref(new Set())
let timer = null

function markImageBroken(url) {
  brokenImageUrls.value = new Set(brokenImageUrls.value).add(url)
}

function goTo(index) {
  activeIndex.value = index
  restartTimer()
}

function next() {
  if (!props.products.length) return
  activeIndex.value = (activeIndex.value + 1) % props.products.length
}

function restartTimer() {
  window.clearInterval(timer)
  if (isPaused.value || props.products.length <= 1) return
  timer = window.setInterval(next, AUTO_ADVANCE_MS)
}

function toggleAutoAdvance() {
  isPaused.value = !isPaused.value
  restartTimer()
}

onMounted(restartTimer)
onBeforeUnmount(() => window.clearInterval(timer))
watch(
  () => props.products,
  () => {
    activeIndex.value = 0
    restartTimer()
  },
)

const touchStartX = ref(0)

function handleTouchStart(event) {
  touchStartX.value = event.changedTouches[0].clientX
}

function handleTouchEnd(event) {
  const deltaX = event.changedTouches[0].clientX - touchStartX.value
  if (Math.abs(deltaX) < SWIPE_THRESHOLD) return
  const direction = deltaX < 0 ? 1 : -1
  goTo((activeIndex.value + direction + props.products.length) % props.products.length)
}
</script>

<template>
  <div
    class="relative overflow-hidden rounded-[18px]"
    aria-label="이 카테고리 공동구매 추천"
    @touchstart.passive="handleTouchStart"
    @touchend.passive="handleTouchEnd"
  >
    <div
      class="flex transition-transform duration-500 ease-out"
      :style="{ transform: `translateX(-${activeIndex * 100}%)` }"
    >
      <router-link
        v-for="product in products"
        :key="product.id"
        :to="`/group-purchase/${product.id}`"
        class="flex w-full shrink-0 items-center gap-(--space-3) rounded-[18px] border border-(--color-card-border) bg-(--color-white) p-(--space-3) text-inherit no-underline"
      >
        <div
          class="flex size-(--size-thumb-md) shrink-0 items-center justify-center overflow-hidden rounded-(--radius-lg) bg-(--color-surface)"
          data-testid="recommended-product-thumbnail"
        >
          <img
            v-if="product.image && !brokenImageUrls.has(product.image)"
            :src="product.image"
            alt=""
            loading="lazy"
            class="size-full object-cover"
            @error="markImageBroken(product.image)"
          >
          <IconGroupPurchase
            v-else
            :size="28"
            color="var(--color-slate-light)"
          />
        </div>

        <div class="min-w-0 flex-1">
          <p class="truncate text-(length:--font-sm) font-bold text-(color:--color-navy)">
            {{ product.productName }}
          </p>
          <p class="mt-[2px] text-(length:--font-xs) text-(color:--color-slate-muted)">
            {{ product.currentQuantity }}/{{ product.targetQuantity }}개 참여 · {{ product.dDay }}
          </p>

          <div class="mt-(--space-3) flex items-end justify-between gap-(--space-2)">
            <div class="flex min-w-0 items-baseline gap-(--space-2)">
              <span class="shrink-0 text-(length:--font-lg) font-bold text-(color:--color-navy)">
                {{ product.groupPrice?.toLocaleString('ko-KR') }}원
              </span>
              <span class="truncate text-(length:--font-xs) text-(color:--color-slate-muted) line-through">
                {{ product.unitPrice?.toLocaleString('ko-KR') }}원
              </span>
            </div>
            <span
              v-if="product.badgeText"
              class="shrink-0 rounded-full bg-(--color-warning-soft) px-(--space-2) py-[3px] text-(length:--font-xs) font-bold text-(color:--color-warning-strong)"
            >
              {{ product.badgeText }}
            </span>
          </div>
        </div>
      </router-link>
    </div>

    <div
      v-if="products.length > 1"
      class="mt-(--space-3) flex items-center justify-center gap-(--space-1)"
    >
      <button
        v-for="(product, index) in products"
        :key="product.id"
        type="button"
        class="h-[6px] rounded-full transition-all duration-200"
        :class="index === activeIndex ? 'w-(--space-5) bg-(--color-leaf)' : 'w-[6px] bg-(--color-gray-300)'"
        :aria-label="`${index + 1}번째 추천 상품으로 이동`"
        @click="goTo(index)"
      />
      <button
        type="button"
        class="ml-(--space-2) grid size-(--space-5) place-items-center rounded-full text-[10px] text-(color:--color-slate-muted)"
        :aria-label="isPaused ? '추천 상품 자동 넘김 재생' : '추천 상품 자동 넘김 일시정지'"
        :title="isPaused ? '자동 넘김 재생' : '자동 넘김 일시정지'"
        @click="toggleAutoAdvance"
      >
        <span aria-hidden="true">{{ isPaused ? '▶' : 'Ⅱ' }}</span>
      </button>
    </div>
  </div>
</template>
