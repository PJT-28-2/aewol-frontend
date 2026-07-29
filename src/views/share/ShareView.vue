<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import BottomNavBar from '@/components/common/BottomNavBar.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import IconDog from '@/components/common/icons/IconDog.vue'
import IconPaw from '@/components/common/icons/IconPaw.vue'
import IconPlus from '@/components/common/icons/IconPlus.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import { usePetStore } from '@/stores/pet'
import { useShareStore } from '@/stores/share'

const MEMBER_COLORS = [
  'var(--color-navy)',
  'var(--color-gold)',
  'var(--color-olive)',
  'var(--color-slate)',
]

const router = useRouter()
const petStore = usePetStore()
const shareStore = useShareStore()
const selectedPetId = ref('')
const isLoadingPets = ref(true)
const petError = ref('')

const pets = computed(() =>
  Array.isArray(petStore.pets) ? petStore.pets : (petStore.pets?.data ?? []),
)
const getPetId = (pet) => pet.petId ?? pet.id

const members = computed(() =>
  shareStore.members.map((member, index) => ({
    id:
      member.memberId ??
      member.member_id ??
      member.accessId ??
      member.access_id ??
      index,
    name: member.nickname ?? member.name ?? member.email ?? '이름 없음',
    color: MEMBER_COLORS[index % MEMBER_COLORS.length],
  })),
)

const normalizedContributions = computed(() => {
  const stats = shareStore.contributions.map((stat, index) => ({
    id: stat.memberId ?? stat.member_id ?? index,
    name: stat.name ?? stat.nickname ?? stat.email ?? '이름 없음',
    amount: Number(stat.amount ?? stat.totalAmount ?? stat.total_amount ?? 0),
    percentage: Number(stat.percentage ?? stat.ratio ?? 0),
    color: MEMBER_COLORS[index % MEMBER_COLORS.length],
  }))
  const totalAmount = stats.reduce((sum, stat) => sum + stat.amount, 0)

  return stats.map((stat) => ({
    ...stat,
    percentage:
      stat.percentage > 0
        ? Math.min(stat.percentage, 100)
        : totalAmount > 0
          ? (stat.amount / totalAmount) * 100
          : 0,
  }))
})

const donutStyle = computed(() => {
  const activeStats = normalizedContributions.value.filter(
    (stat) => stat.percentage > 0,
  )
  if (activeStats.length === 0) {
    return { background: 'var(--color-border)' }
  }

  let current = 0
  const segments = activeStats.map((stat) => {
    const start = current
    current = Math.min(current + stat.percentage, 100)
    return `${stat.color} ${start}% ${current}%`
  })

  if (current < 100) {
    segments.push(`var(--color-border) ${current}% 100%`)
  }

  return { background: `conic-gradient(${segments.join(', ')})` }
})

async function loadPets() {
  isLoadingPets.value = true
  petError.value = ''

  try {
    await petStore.fetchPets()
    selectedPetId.value = pets.value.length > 0 ? getPetId(pets.value[0]) : ''
  } catch (error) {
    petError.value =
      error.response?.data?.message ?? '반려동물 정보를 불러오지 못했어요.'
  } finally {
    isLoadingPets.value = false
  }
}

function retrySharedCare() {
  if (selectedPetId.value) {
    shareStore.fetchSharedCare(selectedPetId.value)
  }
}

watch(selectedPetId, (petId) => {
  if (petId) shareStore.fetchSharedCare(petId)
})

onMounted(loadPets)
</script>

<template>
  <main
    class="mx-auto min-h-screen w-full max-w-[var(--mobile-content-width)] box-border bg-(--color-white) px-[var(--space-5)] pb-[calc(var(--bottom-nav-height)+var(--space-8))] pt-[calc(var(--header-height)+var(--space-1))] text-(--color-navy)"
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

    <section
      v-if="isLoadingPets"
      class="flex flex-col items-center gap-[var(--space-4)] py-[var(--space-10)] text-center text-(--color-slate-dark)"
      aria-label="불러오는 중"
    >
      <LoadingSpinner />
    </section>

    <section
      v-else-if="petError"
      class="flex flex-col items-center gap-[var(--space-4)] py-[var(--space-10)] text-center text-(--color-slate-dark)"
      role="alert"
    >
      <p>{{ petError }}</p>
      <button
        class="cursor-pointer rounded-[var(--radius-md)] border-0 bg-(--color-navy) px-[var(--space-4)] py-[var(--space-2)] font-semibold text-(--color-white)"
        type="button"
        @click="loadPets"
      >
        다시 시도
      </button>
    </section>

    <EmptyState
      v-else-if="pets.length === 0"
      :icon="IconPaw"
      message="함께 돌볼 반려동물이 아직 없어요."
      action-text="반려동물 등록하기"
      action-route="/pets/register"
    />

    <template v-else>
      <div
        class="mt-[var(--space-7)] flex flex-wrap gap-[var(--space-2)]"
        role="tablist"
        aria-label="반려동물 선택"
      >
        <button
          v-for="pet in pets"
          :key="getPetId(pet)"
          class="inline-flex h-[var(--control-height-sm)] cursor-pointer items-center gap-[var(--space-1)] rounded-full border border-(--color-border) bg-(--color-surface) px-[var(--space-4)] text-[length:var(--font-sm)] font-bold text-(--color-slate-dark)"
          :class="{
            'border-(--color-navy) bg-(--color-navy) text-(--color-white)':
              selectedPetId === getPetId(pet),
          }"
          type="button"
          role="tab"
          :aria-selected="selectedPetId === getPetId(pet)"
          @click="selectedPetId = getPetId(pet)"
        >
          <IconDog
            :size="16"
            color="currentColor"
          />
          {{ pet.name }}
        </button>
      </div>

      <section
        v-if="shareStore.isLoading"
        class="flex flex-col items-center gap-[var(--space-4)] py-[var(--space-10)] text-center text-(--color-slate-dark)"
        aria-label="불러오는 중"
      >
        <LoadingSpinner />
      </section>

      <section
        v-else-if="shareStore.error"
        class="flex flex-col items-center gap-[var(--space-4)] py-[var(--space-10)] text-center text-(--color-slate-dark)"
        role="alert"
      >
        <p>{{ shareStore.error }}</p>
        <button
          class="cursor-pointer rounded-[var(--radius-md)] border-0 bg-(--color-navy) px-[var(--space-4)] py-[var(--space-2)] font-semibold text-(--color-white)"
          type="button"
          @click="retrySharedCare"
        >
          다시 시도
        </button>
      </section>

      <template v-else>
        <section
          class="relative mt-[var(--space-8)] pr-[calc(var(--header-height)+var(--space-2))]"
        >
          <h2
            class="mb-[var(--space-4)] mt-0 text-[length:var(--font-base)] font-bold"
          >
            참여 중인 가족
          </h2>
          <p
            v-if="members.length === 0"
            class="m-0 py-[var(--space-5)] text-center text-[length:var(--font-sm)] text-(--color-slate-muted)"
          >
            아직 참여 중인 가족이 없어요.
          </p>
          <div
            v-else
            class="flex flex-wrap gap-[var(--space-4)]"
          >
            <div
              v-for="member in members.slice(0, 3)"
              :key="member.id"
              class="flex min-w-[var(--bottom-nav-height)] flex-col items-center gap-[var(--space-2)] border-0 bg-transparent p-0 text-[length:var(--font-sm)] text-(--color-navy)"
            >
              <div
                class="grid size-[var(--header-height)] place-items-center rounded-full text-[length:var(--font-lg)] font-bold text-(--color-white)"
                :style="{ backgroundColor: member.color }"
              >
                {{ member.name.slice(0, 1) }}
              </div>
              <strong>{{ member.name }}</strong>
            </div>
          </div>
          <button
            class="absolute right-0 top-[calc(var(--font-base)+var(--space-4))] flex min-w-[var(--bottom-nav-height)] cursor-pointer flex-col items-center gap-[var(--space-2)] border-0 bg-transparent p-0 text-[length:var(--font-sm)] text-(--color-navy)"
            type="button"
            @click="router.push('/share/invite')"
          >
            <span
              class="grid size-[var(--header-height)] place-items-center rounded-full bg-(--color-surface) text-(--color-slate-muted)"
            >
              <IconPlus :size="26" />
            </span>
            <strong>초대</strong>
          </button>
        </section>

        <section
          v-if="normalizedContributions.length > 0"
          class="mt-[var(--space-8)] grid place-items-center"
          aria-label="이번 달 기여 비율"
        >
          <div
            class="relative grid size-[var(--share-chart-size)] place-items-center rounded-full"
            :style="donutStyle"
          >
            <span
              class="absolute size-[var(--share-chart-hole-size)] rounded-full bg-(--color-white)"
            />
            <div
              class="relative z-10 flex flex-col items-center gap-[var(--space-1)]"
            >
              <strong class="text-[length:var(--font-base)]">기여 비율</strong>
              <span
                class="text-[length:var(--font-sm)] text-(--color-slate-muted)"
              >이번 달</span>
            </div>
          </div>
        </section>

        <section
          class="mt-[var(--space-8)] flex flex-col gap-[var(--space-2)]"
        >
          <p
            v-if="shareStore.contributionError"
            class="m-0 py-[var(--space-5)] text-center text-[length:var(--font-sm)] text-(--color-slate-muted)"
            role="status"
          >
            {{ shareStore.contributionError }}
          </p>
          <p
            v-else-if="normalizedContributions.length === 0"
            class="m-0 py-[var(--space-5)] text-center text-[length:var(--font-sm)] text-(--color-slate-muted)"
          >
            아직 집계된 기여 내역이 없어요.
          </p>
          <div
            v-for="stat in normalizedContributions"
            v-else
            :key="stat.id"
            class="flex min-h-[var(--control-height-lg)] items-center rounded-[var(--radius-lg)] bg-(--color-surface) px-[var(--space-4)] text-[length:var(--font-sm)]"
          >
            <span
              class="mr-[var(--space-3)] size-[var(--font-md)] rounded-full"
              :style="{ backgroundColor: stat.color }"
            />
            <strong>{{ stat.name }}</strong>
            <span
              class="ml-auto font-bold text-(--color-slate-dark)"
            >{{ stat.percentage.toFixed(0) }}%</span>
          </div>
        </section>
      </template>
    </template>
  </main>
  <BottomNavBar />
</template>
