<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppButton from '@/components/common/AppButton.vue'
import ConfirmDeleteModal from '@/components/common/ConfirmDeleteModal.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import SelectableChip from '@/components/common/SelectableChip.vue'
import IconCat from '@/components/common/icons/IconCat.vue'
import IconChevronRight from '@/components/common/icons/IconChevronRight.vue'
import IconDelete from '@/components/common/icons/IconDelete.vue'
import IconDocument from '@/components/common/icons/IconDocument.vue'
import IconDog from '@/components/common/icons/IconDog.vue'
import IconPaw from '@/components/common/icons/IconPaw.vue'
import IconPlus from '@/components/common/icons/IconPlus.vue'
import { useShareStore } from '@/stores/share'
import { useShareDiaryStore } from '@/stores/shareDiary'
import { formatDateDot, formatYearMonth } from '@/utils/date'

const route = useRoute()
const router = useRouter()
const shareStore = useShareStore()
const diaryStore = useShareDiaryStore()

const selectedPetId = ref('')
const deleteTargetId = ref('')
// 파일이 지워졌거나 서버가 사진을 못 내려줄 때 깨진 이미지 아이콘 대신 글만 보여준다.
const brokenImageIds = ref(new Set())

const hasPets = computed(() => shareStore.pets.length > 0)
const hasDiaries = computed(() => diaryStore.diaries.length > 0)
const monthLabel = computed(() => formatYearMonth(diaryStore.year, diaryStore.month))
const isDeleteOpen = computed({
  get: () => Boolean(deleteTargetId.value),
  set: (isOpen) => {
    if (!isOpen) deleteTargetId.value = ''
  },
})

watch(selectedPetId, (petId) => {
  if (petId) diaryStore.fetchDiaries(petId)
})

async function initializeDiary() {
  const pets = shareStore.pets.length > 0 ? shareStore.pets : await shareStore.fetchPets()
  selectedPetId.value = route.query.petId ?? pets[0]?.id ?? ''
}

function markImageBroken(diaryId) {
  brokenImageIds.value = new Set(brokenImageIds.value).add(diaryId)
}

function goWrite() {
  router.push({ path: '/share/diary/write', query: { petId: selectedPetId.value } })
}

async function confirmDelete() {
  const diaryId = deleteTargetId.value
  deleteTargetId.value = ''
  try {
    await diaryStore.deleteDiary(diaryId)
  } catch (error) {
    diaryStore.error = error.response?.data?.message || '일기를 삭제하지 못했어요.'
  }
}

onMounted(initializeDiary)
</script>

<template>
  <div
    class="mx-auto min-h-[calc(100dvh-var(--header-height)-var(--bottom-nav-height))] w-full max-w-(--content-max-width) box-border bg-(--color-white) px-[var(--space-5)] pt-[var(--space-4)] pb-[calc(var(--space-6)+env(safe-area-inset-bottom))] text-(--color-navy)"
  >
    <header>
      <h1 class="m-0 text-(length:--font-2xl) font-bold leading-[1.3] text-(--color-navy)">
        육아일기
      </h1>
      <p class="mb-0 mt-[var(--space-1)] text-(length:--font-md) text-(--color-slate-muted)">
        가족과 함께 오늘 하루를 남겨요
      </p>
    </header>

    <EmptyState
      v-if="!hasPets && !shareStore.isLoading"
      :icon="IconPaw"
      message="함께 돌볼 반려동물이 아직 없어요."
      action-text="반려동물 등록하기"
      action-route="/pets/register"
    />

    <template v-else>
      <section
        v-if="shareStore.pets.length > 1"
        class="mt-[var(--space-6)]"
        aria-labelledby="diary-pet-title"
      >
        <h2
          id="diary-pet-title"
          class="m-0 text-(length:--font-base) font-semibold text-(--color-navy)"
        >
          반려동물 선택
        </h2>
        <div
          class="mt-[var(--space-3)] flex items-center gap-[var(--space-2)] overflow-x-auto pb-[var(--space-1)]"
          role="group"
          aria-labelledby="diary-pet-title"
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
        </div>
      </section>

      <section
        class="mt-[var(--space-6)] flex items-center justify-between"
        aria-label="조회할 월 선택"
      >
        <AppButton
          variant="ghost"
          size="sm"
          icon-only
          aria-label="이전 달"
          @click="diaryStore.moveMonth(-1)"
        >
          <IconChevronRight
            class="rotate-180"
            :size="20"
          />
        </AppButton>

        <strong
          class="text-(length:--font-base) font-semibold"
          aria-live="polite"
        >
          {{ monthLabel }}
        </strong>

        <AppButton
          variant="ghost"
          size="sm"
          icon-only
          aria-label="다음 달"
          :disabled="!diaryStore.canGoNextMonth"
          @click="diaryStore.moveMonth(1)"
        >
          <IconChevronRight :size="20" />
        </AppButton>
      </section>

      <section
        v-if="diaryStore.isLoading"
        class="grid place-items-center py-[var(--space-10)]"
        aria-live="polite"
      >
        <LoadingSpinner />
      </section>

      <section
        v-else-if="diaryStore.error"
        class="mt-[var(--space-8)] flex flex-col items-center text-center"
        role="alert"
      >
        <p class="m-0 text-(length:--font-md) text-(--color-slate-dark)">
          {{ diaryStore.error }}
        </p>
        <AppButton
          class="mt-[var(--space-4)]"
          variant="navy"
          size="sm"
          @click="diaryStore.fetchDiaries(selectedPetId)"
        >
          다시 시도
        </AppButton>
      </section>

      <EmptyState
        v-else-if="!hasDiaries"
        :icon="IconDocument"
        message="이 달에는 아직 기록이 없어요."
        action-text="첫 일기 쓰기"
        :action-route="`/share/diary/write?petId=${selectedPetId}`"
      />

      <section
        v-else
        class="mt-[var(--space-5)]"
        aria-label="일기 목록"
      >
        <div
          v-for="group in diaryStore.diariesByDate"
          :key="group.date"
          class="mb-[var(--space-6)]"
        >
          <h3
            class="m-0 text-(length:--font-sm) font-semibold text-(--color-slate-muted)"
          >
            {{ formatDateDot(group.date) }}
          </h3>

          <ul class="mt-[var(--space-3)] list-none space-y-[var(--space-3)] p-0">
            <li
              v-for="diary in group.items"
              :key="diary.id"
              class="overflow-hidden rounded-[var(--radius-lg)] border border-(--color-card-border) bg-(--color-surface)"
            >
              <img
                v-if="diary.images.length > 0 && !brokenImageIds.has(diary.id)"
                :src="diary.images[0]"
                :alt="`${formatDateDot(diary.diaryDate)} 일기 사진`"
                class="block max-h-[var(--diary-photo-max-height)] w-full object-cover"
                loading="lazy"
                @error="markImageBroken(diary.id)"
              >

              <div class="p-[var(--space-4)]">
                <div class="flex items-center gap-[var(--space-2)]">
                  <span
                    class="grid size-[var(--diary-avatar-size)] shrink-0 place-items-center rounded-full text-(length:--font-sm) font-bold text-(--color-white)"
                    :class="diary.avatarClass"
                  >
                    {{ diary.authorName?.slice(0, 1) }}
                  </span>
                  <strong class="text-(length:--font-sm)">
                    {{ diary.authorName }}
                  </strong>

                  <AppButton
                    v-if="diary.deletable"
                    class="ml-auto"
                    variant="ghost"
                    size="xs"
                    icon-only
                    aria-label="일기 삭제"
                    @click="deleteTargetId = diary.id"
                  >
                    <IconDelete :size="18" />
                  </AppButton>
                </div>

                <p
                  v-if="diary.content"
                  class="mb-0 mt-[var(--space-3)] whitespace-pre-wrap text-(length:--font-md) leading-[1.6] text-(--color-navy)"
                >
                  {{ diary.content }}
                </p>
              </div>
            </li>
          </ul>
        </div>
      </section>

      <AppButton
        class="mt-[var(--space-4)]"
        variant="primary"
        block
        :disabled="!selectedPetId"
        @click="goWrite"
      >
        <IconPlus :size="20" />
        오늘 일기 쓰기
      </AppButton>
    </template>
  </div>

  <ConfirmDeleteModal
    :model-value="isDeleteOpen"
    title="일기를 삭제할까요?"
    description="삭제한 일기는 목록에서 사라져요."
    :confirm-loading="diaryStore.isSubmitting"
    @update:model-value="isDeleteOpen = $event"
    @confirm="confirmDelete"
  />
</template>
