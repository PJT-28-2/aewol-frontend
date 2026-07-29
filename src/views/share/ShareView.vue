<script setup>
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import ContributionDonutChart from '@/components/share/ContributionDonutChart.vue'
import BottomNavBar from '@/components/common/BottomNavBar.vue'
import IconCat from '@/components/common/icons/IconCat.vue'
import IconDog from '@/components/common/icons/IconDog.vue'
import IconPlus from '@/components/common/icons/IconPlus.vue'
import { useShareStore } from '@/stores/share'

const router = useRouter()
const shareStore = useShareStore()
const selectedPetId = ref(shareStore.pets[0]?.id ?? '')

watch(
  selectedPetId,
  (petId) => {
    if (petId) shareStore.fetchSharedCare(petId)
  },
  { immediate: true },
)
</script>

<template>
  <main
    class="mx-auto min-h-dvh w-full max-w-[var(--mobile-content-width)] box-border bg-(--color-white) px-[var(--space-5)] pb-[calc(var(--bottom-nav-height)+var(--space-6)+env(safe-area-inset-bottom))] pt-[calc(var(--header-height)+var(--space-1))] text-(--color-navy)"
  >
    <header>
      <h1 class="m-0 text-[length:var(--font-xl)] font-bold leading-[1.3]">
        함께 돌보기
      </h1>
      <p
        class="mb-0 mt-[var(--space-1)] text-[length:var(--font-sm)] text-(--color-slate-muted)"
      >
        가족과 지갑을 공유하고 기여도를 확인해요
      </p>
    </header>

    <div
      class="mt-[var(--space-7)] flex items-center gap-[var(--space-2)]"
      role="tablist"
      aria-label="반려동물 선택"
    >
      <button
        v-for="pet in shareStore.pets"
        :key="pet.id"
        class="inline-flex h-[var(--control-height-sm)] min-w-[var(--share-icon-size)] cursor-pointer items-center justify-center gap-[var(--space-1)] rounded-full px-[var(--space-3)] text-[length:var(--font-sm)] font-bold transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-gold)"
        :class="
          selectedPetId === pet.id
            ? 'border border-(--color-navy) bg-(--color-navy) text-(--color-white)'
            : 'border border-(--color-border) bg-(--color-surface) text-(--color-slate-dark)'
        "
        type="button"
        role="tab"
        :aria-selected="selectedPetId === pet.id"
        @click="selectedPetId = pet.id"
      >
        <component
          :is="pet.species === '코리안숏헤어' ? IconCat : IconDog"
          :size="16"
          :color="
            selectedPetId === pet.id
              ? 'var(--color-white)'
              : 'var(--color-slate-dark)'
          "
        />
        {{ pet.name }}
      </button>
      <button
        class="grid size-[var(--control-height-sm)] shrink-0 cursor-pointer place-items-center rounded-full border border-(--color-border) bg-(--color-white) text-(--color-slate-dark) transition-opacity hover:opacity-75 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-gold)"
        type="button"
        aria-label="반려동물 추가"
        @click="router.push('/pets/register')"
      >
        <IconPlus :size="20" />
      </button>
    </div>

    <section
      class="mt-[var(--space-4)]"
      aria-labelledby="members-title"
    >
      <h2
        id="members-title"
        class="m-0 text-[length:var(--font-lg)] font-bold"
      >
        참여 중인 가족
      </h2>

      <div class="mt-[var(--space-4)] flex items-start gap-[var(--space-4)]">
        <article
          v-for="member in shareStore.members.slice(0, 3)"
          :key="member.id"
          class="flex w-[var(--bottom-nav-height)] flex-col items-center"
        >
          <span
            class="grid size-[var(--header-height)] place-items-center rounded-full text-[length:var(--font-lg)] font-bold text-(--color-white)"
            :class="member.avatarClass"
          >
            {{ member.name.slice(0, 1) }}
          </span>
          <strong
            class="mt-[var(--space-2)] w-full truncate text-center text-[length:var(--font-sm)]"
          >
            {{ member.name }}
          </strong>
        </article>

        <button
          class="flex w-[var(--bottom-nav-height)] cursor-pointer flex-col items-center border-0 bg-transparent p-0 text-(--color-slate-muted) transition-opacity hover:opacity-75 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-gold)"
          type="button"
          @click="router.push('/share/invite')"
        >
          <span
            class="grid size-[var(--header-height)] place-items-center rounded-full bg-(--color-surface)"
          >
            <IconPlus :size="24" />
          </span>
          <strong class="mt-[var(--space-2)] text-[length:var(--font-sm)]">
            초대
          </strong>
        </button>
      </div>
    </section>

    <section
      class="mt-[var(--space-8)] grid place-items-center"
      aria-labelledby="contribution-title"
    >
      <div class="relative grid size-[var(--share-chart-size)] place-items-center">
        <ContributionDonutChart :contributions="shareStore.contributions" />
        <div
          class="pointer-events-none absolute z-10 flex flex-col items-center text-center"
        >
          <h2
            id="contribution-title"
            class="m-0 text-[length:var(--font-base)] font-bold"
          >
            기여 비율
          </h2>
          <span
            class="mt-[var(--space-1)] text-[length:var(--font-sm)] text-(--color-slate-muted)"
          >
            이번 달
          </span>
        </div>
      </div>
    </section>

    <section
      class="mt-[var(--space-7)]"
      aria-label="가족별 기여도"
    >
      <ul class="m-0 list-none space-y-[var(--space-3)] p-0">
        <li
          v-for="contribution in shareStore.contributions"
          :key="contribution.id"
          class="flex h-[var(--control-height-md)] items-center rounded-[var(--radius-lg)] bg-(--color-surface) px-[var(--space-4)]"
        >
          <span
            class="mr-[var(--space-3)] size-[var(--font-md)] shrink-0 rounded-full"
            :class="contribution.toneClass"
          />
          <strong class="text-[length:var(--font-sm)]">
            {{ contribution.name }}
          </strong>
          <span
            class="ml-auto text-[length:var(--font-md)] font-bold text-(--color-slate-dark)"
          >
            {{ contribution.percentage }}%
          </span>
        </li>
      </ul>
    </section>
  </main>
  <BottomNavBar />
</template>
