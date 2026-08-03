<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppButton from '@/components/common/AppButton.vue'
import BottomSheet from '@/components/common/BottomSheet.vue'
import ContributionDonutChart from '@/components/share/ContributionDonutChart.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import SelectableChip from '@/components/common/SelectableChip.vue'
import IconCat from '@/components/common/icons/IconCat.vue'
import IconDog from '@/components/common/icons/IconDog.vue'
import IconPaw from '@/components/common/icons/IconPaw.vue'
import IconPlus from '@/components/common/icons/IconPlus.vue'
import { useShareStore } from '@/stores/share'
import ShareInviteView from './ShareInviteView.vue'

const route = useRoute()
const router = useRouter()
const shareStore = useShareStore()
const selectedPetId = ref(shareStore.pets[0]?.id ?? '')
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
  { immediate: true },
)

function retryFetchSharedCare() {
  shareStore.fetchSharedCare(selectedPetId.value)
}
</script>

<template>
  <div
    class="mx-auto min-h-[calc(100dvh-var(--header-height)-var(--bottom-nav-height))] w-full max-w-(--content-max-width) box-border bg-(--color-white) px-[var(--space-5)] pt-[var(--space-4)] pb-[calc(var(--space-6)+env(safe-area-inset-bottom))] text-(--color-navy)"
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
        variant="navy"
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
          가족과 지갑을 공유하고 기여도를 확인해요
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
          class="mt-[var(--space-4)] flex items-center gap-[var(--space-2)]"
          role="group"
          aria-labelledby="pet-select-title"
        >
          <SelectableChip
            v-for="pet in shareStore.pets"
            :key="pet.id"
            class="min-w-[var(--share-pet-chip-min-width)]"
            :class="selectedPetId !== pet.id ? 'text-(--color-navy)!' : ''"
            :selected="selectedPetId === pet.id"
            @click="selectedPetId = pet.id"
          >
            <component
              :is="pet.type === 'cat' ? IconCat : IconDog"
              :size="16"
            />
            {{ pet.name }}
          </SelectableChip>
          <AppButton
            class="!h-[var(--control-height-sm)] shrink-0 border-(--color-border)!"
            variant="secondary"
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
        class="mt-[var(--space-4)]"
        aria-labelledby="members-title"
      >
        <h2
          id="members-title"
          class="m-0 text-(length:--font-base) font-semibold text-(--color-navy)"
        >
          참여 중인 가족
        </h2>

        <div
          v-if="hasMembers"
          class="mt-[var(--space-4)] flex items-start gap-[var(--space-3)] overflow-x-auto pb-[var(--space-2)] [scrollbar-color:transparent_transparent] scrollbar-thin hover:[scrollbar-color:var(--color-gray-300)_transparent] [&::-webkit-scrollbar]:h-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-transparent [&::-webkit-scrollbar-track]:bg-transparent hover:[&::-webkit-scrollbar-thumb]:bg-(--color-gray-300)"
        >
          <article
            v-for="member in shareStore.members"
            :key="member.id"
            class="flex w-[var(--share-member-width)] shrink-0 flex-col items-center"
          >
            <span
              class="grid size-[var(--share-avatar-size)] place-items-center rounded-full text-(length:--font-lg) font-bold text-(--color-white)"
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
                class="grid size-[var(--share-avatar-size)] place-items-center rounded-full bg-(--color-surface)"
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

      <section
        class="mt-[var(--space-8)] grid place-items-center"
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
        class="mt-[var(--space-7)]"
        aria-labelledby="contribution-list-title"
      >
        <h2
          id="contribution-list-title"
          class="m-0 text-(length:--font-base) font-semibold text-(--color-navy)"
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
            class="flex h-[var(--control-height-md)] items-center rounded-[var(--radius-lg)] bg-(--color-surface) px-[var(--space-4)]"
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
    <ShareInviteView />
  </BottomSheet>
</template>
