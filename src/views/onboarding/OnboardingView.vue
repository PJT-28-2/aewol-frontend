<script setup>
import { computed, onBeforeUnmount, ref } from 'vue';
import { useRouter } from 'vue-router';
import AppButton from '@/components/common/AppButton.vue';
import AewolLogo from '@/components/common/AewolLogo.vue';
import OnboardingVisual from '@/components/onboarding/OnboardingVisual.vue';

const router = useRouter();

const slides = [
  {
    visual: 'wallet',
    title: '우리 아이에게도\n지갑이 필요하니까',
    description: '사진 한 장으로 우리 아이 캐릭터를 만들고\n전용 지갑과 일상을 시작해요',
  },
  {
    visual: 'family',
    title: '가족과 함께\n우리 아이를 돌봐요',
    description: '가족을 초대해 돌봄을 나누고\n우리 아이를 함께 챙겨요',
  },
  {
    visual: 'memories',
    title: '함께한 모든 순간을\n소중하게 담아두어요',
    description: '첫 만남부터 좋아하는 것까지\n함께한 시간을 오래 간직하고 싶으니까요',
  },
  {
    visual: 'identity',
    title: '필요한 정보도\n한곳에서 간편하게',
    description: '동물등록증과 접종·진료 기록을\n필요할 때 바로 확인해요',
  },
];

const currentIndex = ref(0);
const currentSlide = computed(() => slides[currentIndex.value]);
const isLastSlide = computed(
  () => currentIndex.value === slides.length - 1,
);

function goToLogin() {
  router.push('/login');
}

function handleNext() {
  if (isLastSlide.value) {
    goToLogin();
    return;
  }
  currentIndex.value += 1;
}

const SWIPE_THRESHOLD = 50;
const touchStartX = ref(0);
const touchStartY = ref(0);
let wheelDeltaX = 0;
let wheelResetTimer;
let wheelUnlockTimer;
let isWheelLocked = false;

function moveSlide(direction) {
  if (direction > 0 && !isLastSlide.value) {
    currentIndex.value += 1;
  } else if (direction < 0 && currentIndex.value > 0) {
    currentIndex.value -= 1;
  }
}

function handleTouchStart(event) {
  touchStartX.value = event.changedTouches[0].clientX;
  touchStartY.value = event.changedTouches[0].clientY;
}

function handleTouchEnd(event) {
  const deltaX = event.changedTouches[0].clientX - touchStartX.value;
  const deltaY = event.changedTouches[0].clientY - touchStartY.value;

  if (Math.abs(deltaX) < SWIPE_THRESHOLD || Math.abs(deltaX) < Math.abs(deltaY)) return;

  moveSlide(deltaX < 0 ? 1 : -1);
}

function handleWheel(event) {
  // 트랙패드의 가로 제스처만 처리하고 일반적인 세로 스크롤은 그대로 둔다.
  if (isWheelLocked || Math.abs(event.deltaX) <= Math.abs(event.deltaY)) return;

  wheelDeltaX += event.deltaX;
  window.clearTimeout(wheelResetTimer);
  wheelResetTimer = window.setTimeout(() => {
    wheelDeltaX = 0;
  }, 160);

  if (Math.abs(wheelDeltaX) < SWIPE_THRESHOLD) return;

  moveSlide(wheelDeltaX > 0 ? 1 : -1);
  wheelDeltaX = 0;
  isWheelLocked = true;
  wheelUnlockTimer = window.setTimeout(() => {
    isWheelLocked = false;
  }, 450);
}

onBeforeUnmount(() => {
  window.clearTimeout(wheelResetTimer);
  window.clearTimeout(wheelUnlockTimer);
});
</script>

<template>
  <main
    class="relative flex min-h-svh w-full flex-col overflow-hidden bg-(--color-app-bg) px-(--space-5) pt-(--space-5) pb-(--space-5) [@media(max-height:720px)]:pt-(--space-3) [@media(max-height:720px)]:pb-(--space-3)"
    @touchstart.passive="handleTouchStart"
    @touchend.passive="handleTouchEnd"
    @wheel="handleWheel"
  >
    <div class="relative z-1 flex h-8 items-center justify-between">
      <AewolLogo size="18" />
      <button
        v-if="!isLastSlide"
        class="rounded-(--radius-full) px-(--space-3) py-[6px] text-(length:--font-sm) font-medium text-(color:--color-slate-dark) transition-colors active:bg-(--color-gray-200)"
        type="button"
        @click="goToLogin"
      >
        건너뛰기
      </button>
    </div>

    <div class="relative z-1 -mx-[4px] mt-(--space-5) h-[54svh] min-h-[450px] max-h-[480px] w-[calc(100%+8px)] [@media(max-height:720px)]:mt-(--space-3) [@media(max-height:720px)]:h-[44svh] [@media(max-height:720px)]:min-h-0">
      <OnboardingVisual
        :key="currentSlide.visual"
        :type="currentSlide.visual"
      />
    </div>

    <section class="relative z-1 mt-(--space-7) text-center [@media(max-height:720px)]:mt-(--space-4)">
      <h1
        class="text-[26px] leading-[1.28] font-bold tracking-[-0.03em] text-(color:--color-navy) whitespace-pre-line [@media(max-height:720px)]:text-[22px]"
      >
        {{ currentSlide.title }}
      </h1>
      <p
        class="mt-(--space-3) text-(length:--font-sm) leading-[1.55] text-(color:--color-slate-muted) whitespace-pre-line [@media(max-height:720px)]:mt-(--space-2) [@media(max-height:720px)]:text-[13px]"
      >
        {{ currentSlide.description }}
      </p>
    </section>

    <div class="relative z-1 mt-auto flex justify-center gap-(--space-2) pt-(--space-4) [@media(max-height:720px)]:pt-(--space-2)">
      <button
        v-for="(_, index) in slides"
        :key="index"
        class="h-[5px] rounded-full transition-all duration-200"
        :class="
          index === currentIndex
            ? 'w-(--space-7) bg-(--color-leaf)'
            : 'w-(--space-3) bg-(--color-gray-300)'
        "
        type="button"
        :aria-label="`${index + 1}번째 화면으로 이동`"
        @click="currentIndex = index"
      />
    </div>

    <AppButton
      block
      size="lg"
      class="relative z-1 mt-(--space-4) [@media(max-height:720px)]:mt-(--space-2)"
      @click="handleNext"
    >
      {{ isLastSlide ? '시작하기' : '다음' }}
    </AppButton>
  </main>
</template>
