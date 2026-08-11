<script setup>
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import AppButton from '@/components/common/AppButton.vue';
import AewolLogo from '@/components/common/AewolLogo.vue';
import OnboardingVisual from '@/components/onboarding/OnboardingVisual.vue';

const router = useRouter();

const slides = [
  {
    visual: 'wallet',
    label: '반려동물 전용 전자지갑',
    title: '결제와 거래 내역을\n한 곳에서 관리해요',
    description:
      '충전, 송금, QR 결제를 이용하고\n정기결제와 전체 거래 내역을 확인해요',
  },
  {
    visual: 'report',
    label: '반려동물 지출 리포트',
    title: '어디에 얼마나 썼는지\n한눈에 확인해요',
    description:
      '의료비, 식비, 미용 등 카테고리와\n반려동물별 월 지출을 비교할 수 있어요',
  },
  {
    visual: 'insurance',
    label: '보험 판단과 간편 청구',
    title: '보험이 유리한지 계산하고\n청구 준비도 간편하게',
    description:
      '예상 비용으로 가입 여부를 비교하고\n영수증으로 청구서 초안을 만들어요',
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

function handleTouchStart(event) {
  touchStartX.value = event.changedTouches[0].clientX;
  touchStartY.value = event.changedTouches[0].clientY;
}

function handleTouchEnd(event) {
  const deltaX = event.changedTouches[0].clientX - touchStartX.value;
  const deltaY = event.changedTouches[0].clientY - touchStartY.value;

  if (Math.abs(deltaX) < SWIPE_THRESHOLD || Math.abs(deltaX) < Math.abs(deltaY)) return;

  if (deltaX < 0 && !isLastSlide.value) {
    currentIndex.value += 1;
  } else if (deltaX > 0 && currentIndex.value > 0) {
    currentIndex.value -= 1;
  }
}
</script>

<template>
  <main
    class="relative flex min-h-svh w-full flex-col overflow-hidden bg-(--color-app-bg) px-(--space-5) pt-(--space-5) pb-(--space-5)"
    @touchstart.passive="handleTouchStart"
    @touchend.passive="handleTouchEnd"
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

    <div class="relative z-1 mt-(--space-5) h-[42svh] min-h-[326px] max-h-[370px]">
      <OnboardingVisual
        :key="currentSlide.visual"
        :type="currentSlide.visual"
      />
      <span
        class="absolute top-(--space-4) right-(--space-4) rounded-full bg-(--color-white) px-(--space-3) py-[6px] text-[11px] font-bold text-(--color-leaf-dark) shadow-(--shadow-sm)"
      >
        {{ currentIndex + 1 }} / {{ slides.length }}
      </span>
    </div>

    <section class="relative z-1 mt-(--space-5) text-center">
      <p
        class="mb-(--space-2) text-(length:--font-sm) font-semibold text-(--color-leaf-dark)"
      >
        {{ currentSlide.label }}
      </p>
      <h1
        class="text-[26px] leading-[1.28] font-bold tracking-[-0.03em] text-(color:--color-navy) whitespace-pre-line"
      >
        {{ currentSlide.title }}
      </h1>
      <p
        class="mt-(--space-3) text-(length:--font-sm) leading-[1.55] text-(color:--color-slate-muted) whitespace-pre-line"
      >
        {{ currentSlide.description }}
      </p>
    </section>

    <div class="relative z-1 mt-auto flex justify-center gap-(--space-2) pt-(--space-4)">
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
      class="relative z-1 mt-(--space-4)"
      @click="handleNext"
    >
      {{ isLastSlide ? '시작하기' : '다음' }}
    </AppButton>
  </main>
</template>
