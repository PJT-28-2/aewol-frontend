<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import EmptyState from '@/components/common/EmptyState.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import IconPaw from '@/components/common/icons/IconPaw.vue'
import { useExploreStore } from '@/stores/explore'

const router = useRouter()
const exploreStore = useExploreStore()

// 스크롤 위치를 직접 재지 않고 감시자를 둔다. 화면 크기나 그리드 열 수가 바뀌어도
// "바닥이 보이면 더 불러온다"는 규칙이 그대로 성립한다.
const sentinel = ref(null)
let observer

function goPet(petId) {
  router.push({ name: 'ExplorePetProfile', params: { petId } })
}

onMounted(async () => {
  await exploreStore.fetchFeed()

  if (typeof IntersectionObserver === 'undefined') return
  observer = new IntersectionObserver((entries) => {
    if (entries.some((entry) => entry.isIntersecting)) exploreStore.fetchMore()
  })
  if (sentinel.value) observer.observe(sentinel.value)
})

onBeforeUnmount(() => observer?.disconnect())
</script>

<template>
  <div
    class="mx-auto min-h-[calc(100dvh-var(--header-height)-var(--bottom-nav-height))] w-full max-w-(--content-max-width) box-border bg-(--color-app-bg) px-(--space-5) pt-(--space-4) pb-[calc(var(--space-7)+env(safe-area-inset-bottom))] text-(--color-navy)"
  >
    <header class="mb-(--space-4)">
      <h1 class="m-0 text-(length:--font-2xl) font-bold leading-[1.3]">
        멍스타그램
      </h1>
      <p class="mb-0 mt-(--space-1) text-(length:--font-sm) text-(--color-slate-muted)">
        공개된 육아일기를 구경해요.
      </p>
    </header>

    <LoadingSpinner v-if="exploreStore.isLoading" />

    <EmptyState
      v-else-if="exploreStore.posts.length === 0"
      :icon="IconPaw"
      :message="exploreStore.error || '아직 공개된 일기가 없어요.\n첫 번째로 공개해 보세요.'"
    />

    <template v-else>
      <!--
        인스타그램 탐색처럼 정사각 3열 그리드다. 사진이 주인공이라 글은 상세에서 본다.
        서버가 사진 있는 공개 일기만 주므로 여기서 다시 거르지 않는다.
      -->
      <ul class="m-0 grid list-none grid-cols-3 gap-[2px] p-0">
        <li
          v-for="post in exploreStore.posts"
          :key="post.diaryId"
        >
          <button
            type="button"
            class="block aspect-square w-full overflow-hidden bg-(--color-surface) p-0"
            :aria-label="`${post.petName}의 일기 보기`"
            @click="goPet(post.petId)"
          >
            <img
              v-if="post.imageUrl"
              :src="post.imageUrl"
              :alt="`${post.petName}의 일기 사진`"
              loading="lazy"
              class="size-full object-cover"
            >
          </button>
        </li>
      </ul>

      <!-- 바닥에 닿으면 다음 장을 부른다. -->
      <div
        ref="sentinel"
        class="h-(--space-6)"
        aria-hidden="true"
      />

      <p
        v-if="exploreStore.isLoadingMore"
        class="mb-0 mt-(--space-4) text-center text-(length:--font-sm) text-(--color-slate-muted)"
      >
        불러오는 중이에요…
      </p>

      <p
        v-else-if="!exploreStore.hasMore"
        class="mb-0 mt-(--space-4) text-center text-(length:--font-sm) text-(--color-slate-muted)"
      >
        마지막 게시물이에요.
      </p>
    </template>
  </div>
</template>
