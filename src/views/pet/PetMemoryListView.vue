<script setup>
import { computed, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import AppButton from '@/components/common/AppButton.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import PetSelectorChip from '@/components/common/PetSelectorChip.vue'
import IconImage from '@/components/common/icons/IconImage.vue'
import IconPlus from '@/components/common/icons/IconPlus.vue'
import { usePetMemoryStore } from '@/stores/petMemory'
import { usePetStore } from '@/stores/pet'

const petStore = usePetStore()
const memoryStore = usePetMemoryStore()
const router = useRouter()
const { pets } = storeToRefs(petStore)
const selectedPetId = ref('all')
const selectedAuthorId = ref('all')

const filteredMemories = computed(() => {
  const petMemories = selectedPetId.value === 'all'
    ? memoryStore.memories
    : memoryStore.memories.filter((memory) => memory.petId === selectedPetId.value)
  const memories = selectedAuthorId.value === 'all'
    ? petMemories
    : petMemories.filter((memory) => (memory.authorId ?? 'current-user') === 'current-user')

  return [...memories].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
})

const groupedMemories = computed(() => {
  const groups = []

  filteredMemories.value.forEach((memory) => {
    const dateKey = memory.createdAt.slice(0, 10)
    const lastGroup = groups.at(-1)
    if (lastGroup?.dateKey === dateKey) {
      lastGroup.items.push(memory)
    } else {
      groups.push({ dateKey, items: [memory] })
    }
  })

  return groups
})

function formatDate(dateKey) {
  const date = new Date(`${dateKey}T00:00:00`)
  return new Intl.DateTimeFormat('ko-KR', {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  }).format(date)
}

function formatTime(createdAt) {
  return new Intl.DateTimeFormat('ko-KR', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(createdAt))
}

function petName(memory) {
  return pets.value.find((pet) => pet.id === memory.petId)?.name ?? memory.petName
}

function authorName(memory) {
  return memory.authorName ?? '나'
}

function authorAvatarClass(authorId) {
  return {
    'current-user': 'bg-(--color-leaf)',
    'member-jiwon': 'bg-(--color-chart-teal) text-(color:--color-white)',
    'member-minsu': 'bg-(--color-chart-lilac) text-(color:--color-white)',
  }[authorId] ?? 'bg-(--color-leaf-soft)'
}

onMounted(() => petStore.fetchPets())
</script>

<template>
  <div class="min-h-screen bg-(--color-app-bg) px-(--space-5) pt-(--space-4) pb-[calc(var(--bottom-nav-height)+var(--space-8))]">
    <header>
      <h1 class="text-(length:--font-2xl) font-bold text-(color:--color-navy)">
        추억 한 장
      </h1>
      <p class="mt-(--space-1) text-(length:--font-md) text-(color:--color-slate-muted)">
        함께한 하루가 차곡차곡 쌓이고 있어요
      </p>
    </header>

    <p class="mt-(--space-5) text-(length:--font-xs) font-bold text-(color:--color-slate-muted)">
      반려동물
    </p>
    <nav
      class="mt-(--space-2) flex gap-(--space-2) overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      aria-label="반려동물별 추억 보기"
    >
      <PetSelectorChip
        label="전체"
        :selected="selectedPetId === 'all'"
        @click="selectedPetId = 'all'"
      />
      <PetSelectorChip
        v-for="pet in pets"
        :key="pet.id"
        :label="pet.name"
        :species="pet.species"
        :selected="selectedPetId === pet.id"
        @click="selectedPetId = pet.id"
      />
    </nav>

    <p class="mt-(--space-4) text-(length:--font-xs) font-bold text-(color:--color-slate-muted)">
      기록 보기
    </p>
    <nav
      class="mt-(--space-2) flex gap-(--space-2) overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      aria-label="가족 기록 범위 선택"
    >
      <button
        type="button"
        class="shrink-0 rounded-full border px-(--space-4) py-(--space-2) text-(length:--font-sm) font-semibold"
        :class="selectedAuthorId === 'all'
          ? 'border-(--color-navy) bg-(--color-navy) text-(color:--color-white)'
          : 'border-(--color-card-border) bg-(--color-white) text-(color:--color-slate-dark)'"
        @click="selectedAuthorId = 'all'"
      >
        가족 전체
      </button>
      <button
        type="button"
        class="shrink-0 rounded-full border px-(--space-4) py-(--space-2) text-(length:--font-sm) font-semibold"
        :class="selectedAuthorId === 'current-user'
          ? 'border-(--color-navy) bg-(--color-navy) text-(color:--color-white)'
          : 'border-(--color-card-border) bg-(--color-white) text-(color:--color-slate-dark)'"
        @click="selectedAuthorId = 'current-user'"
      >
        내 기록
      </button>
    </nav>

    <EmptyState
      v-if="groupedMemories.length === 0"
      class="mt-(--space-10)"
      :icon="IconImage"
      :message="'아직 남긴 추억이 없어요.\n오늘의 첫 장을 기록해보세요.'"
    />

    <div
      v-else
      class="mt-(--space-6) space-y-(--space-7)"
    >
      <section
        v-for="group in groupedMemories"
        :key="group.dateKey"
      >
        <div class="mb-(--space-3) flex items-center gap-(--space-3)">
          <span class="size-[8px] rounded-full bg-(--color-leaf)" />
          <h2 class="text-(length:--font-sm) font-bold text-(color:--color-navy)">
            {{ formatDate(group.dateKey) }}
          </h2>
          <span class="h-px flex-1 bg-(--color-card-border)" />
        </div>

        <div
          :class="selectedAuthorId === 'all'
            ? 'grid grid-cols-2 gap-(--space-3)'
            : 'space-y-(--space-4)'"
        >
          <article
            v-for="memory in group.items"
            :key="memory.id"
            class="overflow-hidden bg-(--color-white)"
            :class="selectedAuthorId === 'all' ? 'rounded-[18px]' : 'rounded-[24px]'"
          >
            <img
              :src="memory.imageUrl"
              :alt="`${petName(memory)}의 추억 사진`"
              class="w-full bg-(--color-leaf-soft) object-cover"
              :class="selectedAuthorId === 'all' ? 'aspect-square' : 'aspect-[4/3]'"
            >
            <div :class="selectedAuthorId === 'all' ? 'p-(--space-3)' : 'p-(--space-4)'">
              <div class="flex items-center justify-between gap-(--space-3)">
                <div class="flex min-w-0 items-center gap-(--space-2)">
                  <span
                    class="flex shrink-0 items-center justify-center rounded-full font-bold text-(color:--color-navy)"
                    :class="[
                      selectedAuthorId === 'all' ? 'size-[26px] text-[9px]' : 'size-[34px] text-(length:--font-xs)',
                      authorAvatarClass(memory.authorId ?? 'current-user'),
                    ]"
                  >
                    {{ authorName(memory).slice(0, 1) }}
                  </span>
                  <div class="min-w-0">
                    <strong
                      class="block truncate text-(color:--color-navy)"
                      :class="selectedAuthorId === 'all' ? 'text-(length:--font-xs)' : 'text-(length:--font-sm)'"
                    >
                      {{ authorName(memory) }}
                    </strong>
                    <span
                      class="mt-[2px] block truncate text-(color:--color-slate-muted)"
                      :class="selectedAuthorId === 'all' ? 'text-[9px]' : 'text-(length:--font-xs)'"
                    >
                      {{ petName(memory) }}의 하루
                    </span>
                  </div>
                </div>
                <time
                  v-if="selectedAuthorId !== 'all'"
                  class="text-(length:--font-xs) text-(color:--color-slate-muted)"
                >
                  {{ formatTime(memory.createdAt) }}
                </time>
              </div>
              <p
                class="mt-(--space-2) text-(color:--color-slate-dark)"
                :class="selectedAuthorId === 'all'
                  ? 'line-clamp-2 text-(length:--font-xs) leading-[1.45]'
                  : 'text-(length:--font-md) leading-[1.55]'"
              >
                {{ memory.description }}
              </p>
            </div>
          </article>
        </div>
      </section>
    </div>

    <div class="sticky bottom-[calc(var(--bottom-nav-height)+var(--space-4))] mt-(--space-6)">
      <AppButton
        size="lg"
        block
        @click="router.push('/pets/memories/new')"
      >
        <IconPlus size="20" /> 오늘의 추억 남기기
      </AppButton>
    </div>
  </div>
</template>
