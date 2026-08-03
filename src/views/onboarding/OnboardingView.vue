<script setup>
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import AppButton from '@/components/common/AppButton.vue';
import onboardingSpendImage from '@/assets/images/onboarding-spend.png';
import onboardingFamilyImage from '@/assets/images/onboarding-family.png';
import onboardingEmergencyImage from '@/assets/images/onboarding-emergency.png';

const router = useRouter();

const slides = [
  {
    image: onboardingSpendImage,
    title: '반려동물 지출을\n한 곳에서',
    description:
      '결제, 저축, 보험청구까지\n애월 하나면 충분해요',
  },
  {
    image: onboardingFamilyImage,
    title: '가족과 함께\n기여도도 투명하게',
    description:
      '공동양육 중이라면\n서로의 기여도를 확인할 수 있어요',
  },
  {
    image: onboardingEmergencyImage,
    title: '위급할 때\n가장 가까운 병원으로',
    description:
      '근처 24시 병원을 찾아\n전화부터 길찾기까지 한 번에 해결해요',
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
    class="flex min-h-svh w-full flex-col bg-(--color-white) px-[22px] pt-(--space-5) pb-6"
    @touchstart.passive="handleTouchStart"
    @touchend.passive="handleTouchEnd"
  >
    <div class="flex h-5 justify-end">
      <button
        v-if="!isLastSlide"
        class="text-(length:--font-sm) text-(color:--color-slate-muted)"
        type="button"
        @click="goToLogin"
      >
        건너뛰기
      </button>
    </div>

    <div
      class="mt-(--space-6) flex aspect-[48/54] items-center justify-center overflow-hidden rounded-(--radius-xl) bg-(--color-pastel-frost) p-(--space-5)"
    >
      <img
        :src="currentSlide.image"
        alt=""
        class="h-full w-full object-cover"
      />
    </div>

    <section class="mt-(--space-7) text-center">
      <h1
        class="text-(length:--font-2xl) leading-[1.3] font-bold text-(color:--color-navy) whitespace-pre-line"
      >
        {{ currentSlide.title }}
      </h1>
      <p
        class="mt-(--space-2) text-(length:--font-md) leading-[1.4] text-(color:--color-slate-muted) whitespace-pre-line"
      >
        {{ currentSlide.description }}
      </p>
    </section>

    <div class="flex-1" />

    <div class="flex justify-center gap-[6px]">
      <button
        v-for="(_, index) in slides"
        :key="index"
        class="h-2 rounded-full transition-all"
        :class="
          index === currentIndex
            ? 'w-5 bg-(--color-navy)'
            : 'w-2 bg-(--color-gray-300)'
        "
        type="button"
        :aria-label="`${index + 1}번째 화면으로 이동`"
        @click="currentIndex = index"
      />
    </div>

    <div class="flex-1" />

    <AppButton
      block
      size="lg"
      @click="handleNext"
    >
      {{ isLastSlide ? '시작하기' : '다음' }}
    </AppButton>
  </main>
</template>
