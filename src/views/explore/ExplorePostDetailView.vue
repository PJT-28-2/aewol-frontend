<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import EmptyState from '@/components/common/EmptyState.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import AppButton from '@/components/common/AppButton.vue'
import IconPaw from '@/components/common/icons/IconPaw.vue'
import IconWarning from '@/components/common/icons/IconWarning.vue'
import DiaryReportDialog from '@/components/share/DiaryReportDialog.vue'
import { useExploreStore } from '@/stores/explore'

const route = useRoute()
const exploreStore = useExploreStore()
const diaryId = computed(() => String(route.params.diaryId ?? ''))

const isReporting = ref(false)
const isReported = ref(false)

const dateLabel = computed(() => {
  const value = exploreStore.post?.diaryDate
  if (!value) return ''
  const parsed = new Date(`${value}T00:00:00`)
  if (Number.isNaN(parsed.getTime())) return value
  return new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
    .format(parsed)
})

function handleReported() {
  isReporting.value = false
  // 신고하면 서버가 즉시 노출을 멈춘다. 화면에 글을 그대로 두면 처리되지 않은 것처럼
  // 보이므로 자리 자체를 바꿔 결과를 분명히 한다.
  isReported.value = true
}

onMounted(() => exploreStore.fetchPost(diaryId.value))
</script>

<template>
  <div
    class="mx-auto min-h-[calc(100dvh-var(--header-height))] w-full max-w-(--content-max-width) box-border bg-(--color-app-bg) px-(--space-5) pt-(--space-4) pb-[calc(var(--space-6)+env(safe-area-inset-bottom))] text-(--color-navy)"
  >
    <LoadingSpinner v-if="exploreStore.isPostLoading" />

    <EmptyState
      v-else-if="isReported"
      :icon="IconWarning"
      message="신고한 게시물이에요.&#10;확인이 끝날 때까지 보이지 않아요."
    />

    <EmptyState
      v-else-if="!exploreStore.post"
      :icon="IconPaw"
      :message="exploreStore.postError || '게시물을 볼 수 없어요.'"
    />

    <template v-else>
      <article
        class="overflow-hidden rounded-[var(--radius-2xl)] border border-(--color-card-border) bg-(--color-white) shadow-(--shadow-card)"
      >
        <!-- 계정 주체는 반려동물이다. 누른 사람이 프로필로 갈 수 있게 이름을 링크로 둔다. -->
        <router-link
          :to="{ name: 'ExplorePetProfile', params: { petId: exploreStore.post.petId } }"
          class="flex items-center gap-(--space-3) px-(--space-4) py-(--space-3) text-inherit no-underline"
        >
          <!--
            인스타 게시물 헤더처럼 아바타와 계정명을 나란히 둔다. 공개 게시물 응답에는
            프로필 이미지가 없어(사람 정보를 담지 않는 설계라 필드를 최소로 뒀다) 이름
            첫 글자로 원형을 채운다.
          -->
          <span
            class="grid size-[32px] shrink-0 place-items-center rounded-full bg-(--color-leaf-soft) text-(length:--font-sm) font-bold text-(--color-leaf-dark)"
            aria-hidden="true"
          >{{ exploreStore.post.petName?.slice(0, 1) }}</span>
          <strong class="text-(length:--font-sm)">{{ exploreStore.post.petName }}</strong>
          <span class="ml-auto text-(length:--font-xs) text-(--color-slate-muted)">
            {{ dateLabel }}
          </span>
        </router-link>

        <img
          v-if="exploreStore.post.imageUrl"
          :src="exploreStore.post.imageUrl"
          :alt="`${exploreStore.post.petName}의 일기 사진`"
          class="block aspect-square w-full object-cover"
        >

        <!--
          인스타그램 캡션처럼 계정명을 앞에 굵게 두고 내용을 이어 쓴다. 누가 쓴 글인지
          사진 아래에서 다시 읽히게 하려는 것이다.
        -->
        <p
          v-if="exploreStore.post.content"
          class="mb-0 whitespace-pre-wrap px-(--space-4) py-(--space-4) text-(length:--font-md) leading-[1.6]"
        >
          <strong class="mr-(--space-2) font-bold">{{ exploreStore.post.petName }}</strong>{{ exploreStore.post.content }}
        </p>
      </article>

      <DiaryReportDialog
        v-if="isReporting"
        class="mt-(--space-4)"
        :diary-id="diaryId"
        @close="isReporting = false"
        @reported="handleReported"
      />

      <AppButton
        v-else
        class="mt-(--space-4)"
        variant="ghost"
        block
        @click="isReporting = true"
      >
        <IconWarning :size="16" />
        신고하기
      </AppButton>
    </template>
  </div>
</template>
