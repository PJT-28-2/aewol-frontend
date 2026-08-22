<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppButton from '@/components/common/AppButton.vue'
import ConfirmDeleteModal from '@/components/common/ConfirmDeleteModal.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import PetSelectorChip from '@/components/common/PetSelectorChip.vue'
import IconChevronRight from '@/components/common/icons/IconChevronRight.vue'
import IconDelete from '@/components/common/icons/IconDelete.vue'
import IconEdit from '@/components/common/icons/IconEdit.vue'
import IconDocument from '@/components/common/icons/IconDocument.vue'
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
const deleteError = ref('')
// 파일이 지워졌거나 서버가 사진을 못 내려줄 때 깨진 이미지 아이콘 대신 글만 보여준다.
const brokenImageIds = ref(new Set())

const hasPets = computed(() => shareStore.pets.length > 0)
const hasDiaries = computed(() => diaryStore.diaries.length > 0)
const monthLabel = computed(() => formatYearMonth(diaryStore.year, diaryStore.month))
const isDeleteOpen = computed({
  get: () => Boolean(deleteTargetId.value),
  set: (isOpen) => {
    // 삭제 중에는 닫지 않는다. 닫히면 진행 상태도, 실패 결과도 볼 수 없다.
    if (isOpen || diaryStore.isSubmitting) return
    deleteTargetId.value = ''
    deleteError.value = ''
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

// 수정은 작성 화면을 그대로 쓴다. diaryId가 있으면 수정 모드로 뜬다.
function goEdit(diaryId) {
  router.push({ path: '/share/diary/write', query: { petId: selectedPetId.value, diaryId } })
}

async function confirmDelete() {
  const diaryId = deleteTargetId.value
  if (!diaryId || diaryStore.isSubmitting) return

  deleteError.value = ''
  try {
    await diaryStore.deleteDiary(diaryId)
    // 성공한 뒤에 닫는다. 먼저 닫으면 삭제되는 동안 로딩이 보이지 않고,
    // 실패해도 사용자는 이미 지워진 것으로 오해한다.
    deleteTargetId.value = ''
  } catch (error) {
    deleteError.value = error.response?.data?.message
      || '일기를 삭제하지 못했어요. 잠시 후 다시 시도해 주세요.'
  }
}

onMounted(initializeDiary)
</script>

<template>
  <div
    class="mx-auto min-h-[calc(100dvh-var(--header-height)-var(--bottom-nav-height))] w-full max-w-(--content-max-width) box-border bg-(--color-app-bg) px-[var(--space-5)] pt-[var(--space-4)] pb-[calc(var(--space-6)+env(safe-area-inset-bottom))] text-(--color-navy)"
  >
    <!--
      멍스타그램은 육아일기의 공개판이라 여기에 입구를 둔다. 하단 네비게이션에 넣으면
      기존 다섯 개 중 하나를 밀어내야 하는데, 그건 정보구조를 바꾸는 일이라 별개다.
    -->
    <header class="flex items-start justify-between gap-[var(--space-3)]">
      <div class="min-w-0">
        <h1 class="m-0 text-(length:--font-2xl) font-bold leading-[1.3] text-(--color-navy)">
          육아일기
        </h1>
        <p class="mb-0 mt-[var(--space-1)] text-(length:--font-md) text-(--color-slate-muted)">
          가족과 함께 오늘 하루를 남겨요
        </p>
      </div>

      <router-link
        to="/explore"
        class="shrink-0 rounded-full bg-(--color-leaf-soft) px-[var(--space-3)] py-[var(--space-2)] text-(length:--font-xs) font-bold text-(--color-leaf-dark) no-underline"
      >
        멍스타그램
      </router-link>
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
          <PetSelectorChip
            v-for="pet in shareStore.pets"
            :key="pet.id"
            :label="pet.name"
            :species="pet.type"
            :selected="selectedPetId === pet.id"
            @click="selectedPetId = pet.id"
          />
        </div>
      </section>

      <section
        class="mt-[var(--space-5)] flex items-center justify-between rounded-[24px] bg-(--color-white) px-[var(--space-3)] py-[var(--space-2)] shadow-(--shadow-sm)"
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
              class="overflow-hidden rounded-[24px] bg-(--color-white) shadow-(--shadow-sm)"
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
                    v-if="diary.editable"
                    class="ml-auto"
                    variant="ghost"
                    size="xs"
                    icon-only
                    aria-label="일기 수정"
                    @click="goEdit(diary.id)"
                  >
                    <IconEdit :size="18" />
                  </AppButton>

                  <AppButton
                    v-if="diary.deletable"
                    :class="diary.editable ? '' : 'ml-auto'"
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
    :items="deleteError ? [deleteError] : []"
    :confirm-label="deleteError ? '다시 시도' : '삭제하기'"
    :confirm-loading="diaryStore.isSubmitting"
    @update:model-value="isDeleteOpen = $event"
    @confirm="confirmDelete"
  />
</template>
