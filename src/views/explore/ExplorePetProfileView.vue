<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import EmptyState from '@/components/common/EmptyState.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import IconPaw from '@/components/common/icons/IconPaw.vue'
import dogHero from '@/assets/images/pet-dog-default-home-v3.webp'
import catHero from '@/assets/images/pet-cat-default-home-v3.webp'
import { useExploreStore } from '@/stores/explore'

const route = useRoute()
const exploreStore = useExploreStore()
const petId = computed(() => String(route.params.petId ?? ''))

// 서버가 AI 캐릭터를 먼저 주고 없으면 실사진을 준다. 둘 다 없을 때만 종별 기본 캐릭터로
// 채운다 — 사진을 올리지 않아도 계정이 성립하게 하려는 것이다.
const profileImage = computed(() => {
  const profile = exploreStore.profile
  if (!profile) return dogHero
  return profile.profileImage || (profile.species === 'CAT' ? catHero : dogHero)
})

const instagramUrl = computed(() =>
  exploreStore.profile?.instagramId
    ? `https://instagram.com/${exploreStore.profile.instagramId}`
    : null,
)

const sentinel = ref(null)
let observer

onMounted(async () => {
  await exploreStore.fetchPetProfile(petId.value)

  if (typeof IntersectionObserver === 'undefined') return
  observer = new IntersectionObserver((entries) => {
    if (entries.some((entry) => entry.isIntersecting)) {
      exploreStore.fetchMorePetPosts(petId.value)
    }
  })
  if (sentinel.value) observer.observe(sentinel.value)
})

onBeforeUnmount(() => observer?.disconnect())
</script>

<template>
  <div
    class="mx-auto min-h-[calc(100dvh-var(--header-height))] w-full max-w-(--content-max-width) box-border bg-(--color-app-bg) px-(--space-5) pt-(--space-4) pb-[calc(var(--space-6)+env(safe-area-inset-bottom))] text-(--color-navy)"
  >
    <LoadingSpinner v-if="exploreStore.isProfileLoading" />

    <EmptyState
      v-else-if="!exploreStore.profile"
      :icon="IconPaw"
      :message="exploreStore.profileError || '프로필을 찾을 수 없어요.'"
    />

    <template v-else>
      <!--
        계정 주체가 반려동물이다. 사람 이름은 어디에도 넣지 않는다. 서버 응답에도 없다.
      -->
      <!--
        인스타그램 프로필 구조를 따른다. 아바타 옆에 숫자 지표를 두고, 이름과 소개는
        그 아래 한 덩어리로 놓는다. 지표가 하나뿐이라 가운데로 몰지 않고 왼쪽에 붙인다.
      -->
      <header>
        <div class="flex items-center gap-(--space-6)">
          <img
            :src="profileImage"
            :alt="`${exploreStore.profile.name} 프로필 사진`"
            class="size-[84px] shrink-0 rounded-full object-cover"
          >
          <div class="text-center">
            <strong class="block text-(length:--font-lg) font-bold leading-[1.2]">
              {{ exploreStore.profile.postCount }}
            </strong>
            <span class="mt-[2px] block text-(length:--font-xs) text-(--color-slate-muted)">
              게시물
            </span>
          </div>
        </div>

        <div class="mt-(--space-4)">
          <h1 class="m-0 truncate text-(length:--font-md) font-bold leading-[1.3]">
            {{ exploreStore.profile.name }}
          </h1>
          <p
            v-if="exploreStore.profile.breed"
            class="mb-0 mt-[2px] truncate text-(length:--font-sm) text-(--color-slate-muted)"
          >
            {{ exploreStore.profile.breed }}
          </p>
        </div>
      </header>

      <a
        v-if="instagramUrl"
        :href="instagramUrl"
        target="_blank"
        rel="noopener noreferrer"
        class="mt-(--space-4) flex h-(--control-height-md) items-center justify-center rounded-(--radius-lg) border border-(--color-border) bg-(--color-white) text-(length:--font-sm) font-bold text-(--color-navy) no-underline"
      >
        인스타그램 @{{ exploreStore.profile.instagramId }}
      </a>

      <EmptyState
        v-if="exploreStore.profilePosts.length === 0"
        class="mt-(--space-6)"
        :icon="IconPaw"
        message="아직 공개한 일기가 없어요."
      />

      <ul
        v-else
        class="m-0 mt-(--space-5) grid list-none grid-cols-3 gap-[2px] p-0"
      >
        <li
          v-for="post in exploreStore.profilePosts"
          :key="post.diaryId"
        >
          <router-link
            :to="{ name: 'ExplorePostDetail', params: { diaryId: post.diaryId } }"
            class="block aspect-square overflow-hidden bg-(--color-surface)"
            :aria-label="`${post.petName}의 일기 보기`"
          >
            <img
              v-if="post.imageUrl"
              :src="post.imageUrl"
              :alt="`${post.petName}의 일기 사진`"
              loading="lazy"
              class="size-full object-cover"
            >
          </router-link>
        </li>
      </ul>

      <div
        ref="sentinel"
        class="h-(--space-6)"
        aria-hidden="true"
      />
    </template>
  </div>
</template>
