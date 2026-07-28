<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import BottomNavBar from '@/components/common/BottomNavBar.vue'
import EmptyState from '@/components/common/EmptyState.vue'
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
  <main class="share-screen">
    <header class="share-heading">
      <h1>함께 돌보기</h1>
      <p>가족과 지갑을 공유하고 기여도를 확인해요</p>
    </header>

    <section
      v-if="isLoadingPets"
      class="page-state"
      aria-label="불러오는 중"
    >
      <LoadingSpinner />
    </section>

    <section
      v-else-if="petError"
      class="page-state"
      role="alert"
    >
      <p>{{ petError }}</p>
      <button
        type="button"
        @click="loadPets"
      >
        다시 시도
      </button>
    </section>

    <EmptyState
      v-else-if="pets.length === 0"
      icon="🐾"
      message="함께 돌볼 반려동물이 아직 없어요."
      action-text="반려동물 등록하기"
      action-route="/pets/register"
    />

    <template v-else>
      <div
        class="pet-switcher"
        role="tablist"
        aria-label="반려동물 선택"
      >
        <button
          v-for="pet in pets"
          :key="getPetId(pet)"
          class="pet-tab"
          :class="{ active: selectedPetId === getPetId(pet) }"
          type="button"
          role="tab"
          :aria-selected="selectedPetId === getPetId(pet)"
          @click="selectedPetId = getPetId(pet)"
        >
          🐕 {{ pet.name }}
        </button>
      </div>

      <section
        v-if="shareStore.isLoading"
        class="page-state"
        aria-label="불러오는 중"
      >
        <LoadingSpinner />
      </section>

      <section
        v-else-if="shareStore.error"
        class="page-state"
        role="alert"
      >
        <p>{{ shareStore.error }}</p>
        <button
          type="button"
          @click="retrySharedCare"
        >
          다시 시도
        </button>
      </section>

      <template v-else>
        <section class="members-block">
          <h2>참여 중인 가족</h2>
          <p
            v-if="members.length === 0"
            class="empty-message"
          >
            아직 참여 중인 가족이 없어요.
          </p>
          <div
            v-else
            class="member-avatars"
          >
            <div
              v-for="member in members.slice(0, 3)"
              :key="member.id"
              class="member-avatar-wrap"
            >
              <div
                class="member-avatar"
                :style="{ backgroundColor: member.color }"
              >
                {{ member.name.slice(0, 1) }}
              </div>
              <strong>{{ member.name }}</strong>
            </div>
          </div>
          <button
            class="member-avatar-wrap invite-avatar"
            type="button"
            @click="router.push('/share/invite')"
          >
            <span class="member-avatar">+</span>
            <strong>초대</strong>
          </button>
        </section>

        <section
          v-if="normalizedContributions.length > 0"
          class="contribution-card"
          aria-label="이번 달 기여 비율"
        >
          <div
            class="donut-chart"
            :style="donutStyle"
          >
            <div class="donut-label">
              <strong>기여 비율</strong>
              <span>이번 달</span>
            </div>
          </div>
        </section>

        <section class="contribution-list">
          <p
            v-if="shareStore.contributionError"
            class="empty-message"
            role="status"
          >
            {{ shareStore.contributionError }}
          </p>
          <p
            v-else-if="normalizedContributions.length === 0"
            class="empty-message"
          >
            아직 집계된 기여 내역이 없어요.
          </p>
          <div
            v-for="stat in normalizedContributions"
            v-else
            :key="stat.id"
            class="contribution-row"
          >
            <span
              class="legend-dot"
              :style="{ backgroundColor: stat.color }"
            />
            <strong>{{ stat.name }}</strong>
            <span class="ratio">{{ stat.percentage.toFixed(0) }}%</span>
          </div>
        </section>
      </template>
    </template>
  </main>
  <BottomNavBar />
</template>

<style scoped>
.share-screen {
  width: min(100%, var(--mobile-content-width));
  min-height: 100vh;
  margin: 0 auto;
  padding: calc(var(--header-height) + var(--space-1)) var(--space-5)
    calc(var(--bottom-nav-height) + var(--space-8));
  background: var(--color-white);
  color: var(--color-navy);
  box-sizing: border-box;
}

.share-heading h1 {
  margin: 0;
  font-size: var(--font-xl);
  line-height: 1.3;
  font-weight: var(--font-bold);
}

.share-heading p {
  margin: var(--space-1) 0 0;
  color: var(--color-slate-muted);
  font-size: var(--font-sm);
}

.page-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-10) 0;
  color: var(--color-slate-dark);
  text-align: center;
}

.page-state button {
  padding: var(--space-2) var(--space-4);
  border: 0;
  border-radius: var(--radius-md);
  background: var(--color-navy);
  color: var(--color-white);
  font: var(--font-semibold) var(--font-sm) var(--font-family);
  cursor: pointer;
}

.pet-switcher {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  margin-top: var(--space-7);
}

.pet-tab {
  height: var(--control-height-sm);
  padding: 0 var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-full);
  background: var(--color-surface);
  color: var(--color-slate-dark);
  font: var(--font-bold) var(--font-sm) var(--font-family);
  cursor: pointer;
}

.pet-tab.active {
  border-color: var(--color-navy);
  background: var(--color-navy);
  color: var(--color-white);
}

.members-block {
  position: relative;
  margin-top: var(--space-8);
  padding-right: calc(var(--header-height) + var(--space-2));
}

.members-block h2 {
  margin: 0 0 var(--space-4);
  font-size: var(--font-base);
}

.member-avatars {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-4);
}

.member-avatar-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  min-width: var(--bottom-nav-height);
  padding: 0;
  border: 0;
  background: none;
  color: var(--color-navy);
  font-size: var(--font-sm);
}

.member-avatar {
  display: grid;
  place-items: center;
  width: var(--header-height);
  height: var(--header-height);
  border-radius: var(--radius-full);
  color: var(--color-white);
  font-size: var(--font-lg);
  font-weight: var(--font-bold);
}

.invite-avatar {
  position: absolute;
  top: calc(var(--font-base) + var(--space-4));
  right: 0;
  cursor: pointer;
}

.invite-avatar .member-avatar {
  background: var(--color-surface);
  color: var(--color-slate-muted);
  font-size: var(--font-3xl);
}

.contribution-card {
  display: grid;
  place-items: center;
  margin-top: var(--space-8);
}

.donut-chart {
  position: relative;
  display: grid;
  place-items: center;
  width: var(--share-chart-size);
  height: var(--share-chart-size);
  border-radius: var(--radius-full);
}

.donut-chart::before {
  content: '';
  position: absolute;
  width: var(--share-chart-hole-size);
  height: var(--share-chart-hole-size);
  border-radius: var(--radius-full);
  background: var(--color-white);
}

.donut-label {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-1);
}

.donut-label strong {
  font-size: var(--font-base);
}

.donut-label span {
  color: var(--color-slate-muted);
  font-size: var(--font-sm);
}

.contribution-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  margin-top: var(--space-8);
}

.contribution-row {
  display: flex;
  align-items: center;
  min-height: var(--control-height-lg);
  padding: 0 var(--space-4);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  box-sizing: border-box;
  font-size: var(--font-sm);
}

.legend-dot {
  width: var(--font-md);
  height: var(--font-md);
  margin-right: var(--space-3);
  border-radius: var(--radius-full);
}

.ratio {
  margin-left: auto;
  color: var(--color-slate-dark);
  font-weight: var(--font-bold);
}

.empty-message {
  margin: 0;
  padding: var(--space-5) 0;
  color: var(--color-slate-muted);
  font-size: var(--font-sm);
  text-align: center;
}
</style>
