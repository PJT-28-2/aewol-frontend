<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppButton from '@/components/common/AppButton.vue'
import FeatureIconTile from '@/components/common/FeatureIconTile.vue'
import IconChevronRight from '@/components/common/icons/IconChevronRight.vue'
import IconImage from '@/components/common/icons/IconImage.vue'
import BottomSheet from '@/components/common/BottomSheet.vue'
import ContributionDonutChart from '@/components/share/ContributionDonutChart.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import PetSelectorChip from '@/components/common/PetSelectorChip.vue'
import IconPaw from '@/components/common/icons/IconPaw.vue'
import IconPlus from '@/components/common/icons/IconPlus.vue'
import { useShareStore } from '@/stores/share'
import ShareInviteView from './ShareInviteView.vue'

const route = useRoute()
const router = useRouter()
const shareStore = useShareStore()
const selectedPetId = ref('')
const hasPets = computed(() => shareStore.pets.length > 0)
const hasMembers = computed(() => shareStore.members.length > 0)
const hasContributions = computed(() => shareStore.contributions.length > 0)
const sortedContributions = computed(() =>
  [...shareStore.contributions].sort((a, b) => b.percentage - a.percentage),
)
const isInviteOpen = computed({
  get: () => route.name === 'ShareInvite',
  set: (isOpen) => {
    if (!isOpen) router.replace({ name: 'Share' })
  },
})

watch(
  selectedPetId,
  (petId) => {
    if (petId) shareStore.fetchSharedCare(petId)
  },
)

async function initializeSharedCare() {
  const pets = await shareStore.fetchPets()
  selectedPetId.value = pets[0]?.id ?? ''
}

async function retryFetchSharedCare() {
  if (selectedPetId.value) {
    await shareStore.fetchSharedCare(selectedPetId.value)
  } else {
    await initializeSharedCare()
  }
}

onMounted(initializeSharedCare)
</script>

<template>
  <div
    class="mx-auto min-h-[calc(100dvh-var(--header-height)-var(--bottom-nav-height))] w-full max-w-(--content-max-width) box-border bg-(--color-app-bg) px-[var(--space-5)] pt-[var(--space-4)] pb-[calc(var(--space-7)+env(safe-area-inset-bottom))] text-(--color-navy)"
  >
    <section
      v-if="shareStore.isLoading"
      class="grid min-h-[calc(100dvh-var(--header-height)-var(--bottom-nav-height))] place-items-center"
      aria-live="polite"
    >
      <LoadingSpinner />
    </section>

    <section
      v-else-if="shareStore.error"
      class="flex min-h-[calc(100dvh-var(--header-height)-var(--bottom-nav-height))] flex-col items-center justify-center text-center"
      role="alert"
    >
      <p class="m-0 text-(length:--font-md) text-(--color-slate-dark)">
        {{ shareStore.error }}
      </p>
      <AppButton
        class="mt-[var(--space-4)]"
        variant="primary"
        size="sm"
        @click="retryFetchSharedCare"
      >
        다시 시도
      </AppButton>
    </section>

    <EmptyState
      v-else-if="!hasPets"
      :icon="IconPaw"
      message="함께 돌볼 반려동물이 아직 없어요."
      action-text="반려동물 등록하기"
      action-route="/pets/register"
    />

    <template v-else>
      <header>
        <h1 class="m-0 text-(length:--font-2xl) font-bold text-(--color-navy) leading-[1.3]">
          함께 돌보기
        </h1>
        <p
          class="mb-0 mt-[var(--space-1)] text-(length:--font-md) text-(--color-slate-muted)"
        >
          가족과 돌봄 기록을 나누고 함께 관리해요
        </p>
      </header>

      <section
        class="mt-[var(--space-7)]"
        aria-labelledby="pet-select-title"
      >
        <h2
          id="pet-select-title"
          class="m-0 text-(length:--font-base) font-semibold text-(--color-navy)"
        >
          반려동물 선택
        </h2>

        <div
          class="mt-[var(--space-4)] flex items-center gap-[var(--space-2)] overflow-x-auto whitespace-nowrap pb-(--space-1) [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          role="group"
          aria-labelledby="pet-select-title"
        >
          <PetSelectorChip
            v-for="pet in shareStore.pets"
            :key="pet.id"
            :label="pet.name"
            :species="pet.type"
            :selected="selectedPetId === pet.id"
            @click="selectedPetId = pet.id"
          />
          <AppButton
            class="!h-[var(--control-height-sm)] shrink-0"
            variant="neutral"
            size="sm"
            pill
            icon-only
            aria-label="반려동물 추가"
            @click="router.push({ path: '/share/start', query: { from: 'share' } })"
          >
            <IconPlus :size="20" />
          </AppButton>
        </div>
      </section>

      <section
        class="mt-[var(--space-5)] rounded-[24px] bg-(--color-white) p-(--space-5) shadow-(--shadow-sm)"
        aria-labelledby="members-title"
      >
        <h2
          id="members-title"
          class="m-0 text-(length:--font-base) font-bold text-(--color-navy)"
        >
          참여 중인 가족
        </h2>

        <div
          v-if="hasMembers"
          class="mt-[var(--space-4)] flex items-start gap-[var(--space-3)] overflow-x-auto pb-[var(--space-2)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          <article
            v-for="member in shareStore.members"
            :key="member.id"
            class="flex w-[var(--share-member-width)] shrink-0 flex-col items-center"
          >
            <span
              class="grid size-[var(--share-avatar-size)] place-items-center rounded-full text-(length:--font-lg) font-bold text-(--color-contrast)"
              :class="member.avatarClass"
            >
              {{ member.name.slice(0, 1) }}
            </span>
            <strong
              class="mt-[var(--space-2)] w-full truncate text-center text-(length:--font-sm)"
            >
              {{ member.name }}
            </strong>
          </article>

          <AppButton
            class="!h-auto !w-[var(--share-member-width)] shrink-0 !p-0"
            variant="ghost"
            @click="router.push('/share/invite')"
          >
            <span class="flex flex-col items-center">
              <span
                class="grid size-[var(--share-avatar-size)] place-items-center rounded-full bg-(--color-leaf-soft)"
              >
                <IconPlus :size="24" />
              </span>
              <strong class="mt-[var(--space-2)] text-(length:--font-sm)">
                초대
              </strong>
            </span>
          </AppButton>
        </div>
        <p
          v-else
          class="mb-0 mt-[var(--space-4)] text-(length:--font-sm) text-(--color-slate-muted)"
        >
          함께 돌볼 가족을 초대해 주세요.
        </p>
      </section>

      <!--
        평범한 외곽선 버튼이라 다른 기능 카드들 사이에서 눈에 띄지 않았다. 반려생활
        화면이 쓰는 카드 형태(FeatureIconTile + 제목·설명)로 맞춰 같은 결로 보이게 한다.
      -->
      <router-link
        :to="{ path: '/share/diary', query: { petId: selectedPetId } }"
        class="mt-[var(--space-5)] flex items-center gap-[var(--space-4)] rounded-[22px] bg-(--color-white) p-[var(--space-4)] text-inherit no-underline shadow-(--shadow-sm)"
      >
        <FeatureIconTile
          :icon="IconImage"
          tone="pink"
        />
        <div class="min-w-0">
          <strong class="block text-(length:--font-sm) text-(color:--color-navy)">육아일기 보기</strong>
          <p class="mb-0 mt-[var(--space-1)] text-(length:--font-xs) leading-[1.45] text-(color:--color-slate-muted)">
            가족이 함께 남긴 하루를 모아 봐요.
          </p>
        </div>
        <IconChevronRight
          class="ml-auto shrink-0 text-(--color-slate)"
          :size="18"
        />
      </router-link>

      <section
        class="mt-[var(--space-5)] grid place-items-center rounded-[24px] bg-(--color-white) p-(--space-6) shadow-(--shadow-sm)"
        aria-labelledby="contribution-title"
      >
        <div
          v-if="hasContributions"
          class="relative grid size-[var(--share-chart-size)] place-items-center"
        >
          <ContributionDonutChart :contributions="shareStore.contributions" />
          <div
            class="pointer-events-none absolute z-10 flex flex-col items-center text-center"
          >
            <h2
              id="contribution-title"
              class="m-0 text-(length:--font-base) font-semibold text-(--color-navy)"
            >
              기여 비율
            </h2>
            <span
              class="mt-[var(--space-1)] text-(length:--font-sm) text-(--color-slate-muted)"
            >
              이번 달
            </span>
          </div>
        </div>
        <p
          v-else
          class="my-[calc(var(--space-10)+var(--space-4))] text-(length:--font-sm) text-(--color-slate-muted)"
        >
          아직 기여도 내역이 없어요.
        </p>
      </section>

      <section
        class="mt-[var(--space-5)] rounded-[24px] bg-(--color-white) p-(--space-5) shadow-(--shadow-sm)"
        aria-labelledby="contribution-list-title"
      >
        <h2
          id="contribution-list-title"
          class="m-0 text-(length:--font-base) font-bold text-(--color-navy)"
        >
          가족별 기여도
        </h2>

        <ul
          v-if="hasContributions"
          class="mt-[var(--space-4)] list-none space-y-[var(--space-3)] p-0"
        >
          <li
            v-for="contribution in sortedContributions"
            :key="contribution.id"
            class="flex h-[var(--control-height-md)] items-center rounded-[var(--radius-xl)] bg-(--color-app-bg) px-[var(--space-4)]"
          >
            <span
              class="mr-[var(--space-3)] size-[var(--share-contribution-dot-size)] shrink-0 rounded-full"
              :class="contribution.toneClass"
            />
            <strong class="text-(length:--font-sm)">
              {{ contribution.name }}
            </strong>
            <span
              class="ml-auto text-(length:--font-md) font-bold text-(--color-slate-dark)"
            >
              {{ contribution.percentage }}%
            </span>
          </li>
        </ul>
        <p
          v-else
          class="mt-[var(--space-4)] mb-0 text-(length:--font-sm) text-(--color-slate-muted)"
        >
          가족이 지출을 기록하면 기여도를 확인할 수 있어요.
        </p>
      </section>
    </template>
  </div>

  <BottomSheet
    :model-value="isInviteOpen"
    title="가족 초대하기"
    size="tall"
    @update:model-value="isInviteOpen = $event"
  >
    <ShareInviteView :pet-id="selectedPetId" />
  </BottomSheet>
</template>
