<script setup>
import { computed, ref } from 'vue'
import AppButton from '@/components/common/AppButton.vue'
import { useShareDiaryStore } from '@/stores/shareDiary'

/**
 * 일기 공개 여부 조작.
 *
 * 권한이 비대칭이라 규칙을 여기 한 곳에 모은다. 화면 곳곳에 흩어지면 어느 하나가
 * 어긋났을 때 사적인 글이 공개되는 쪽으로 틀리기 쉽다.
 *
 *   공개로 올리기 — 작성자만
 *   비공개로 내리기 — 작성자 또는 대표 보호자
 *   신고로 내려간 글 — 아무도 (관리자 몫)
 */
const props = defineProps({
  diary: { type: Object, required: true },
  /** 이 일기의 작성자가 나인지 */
  isAuthor: { type: Boolean, default: false },
  /** 내가 이 반려동물의 대표 보호자인지 */
  isPetOwner: { type: Boolean, default: false },
})

const emit = defineEmits(['changed'])

const diaryStore = useShareDiaryStore()
const errorMessage = ref('')
const isConfirming = ref(false)

const isPublic = computed(() => props.diary.visibility === 'PUBLIC')
const isHiddenByReport = computed(() => Boolean(props.diary.hiddenByReport))

// 멍스타그램은 사진으로 훑어보는 화면이라 사진 없는 글은 그리드에 자리가 없다.
// 서버도 막지만, 누른 뒤에 거절당하는 것보다 먼저 알려주는 편이 낫다.
const hasPhoto = computed(() => (props.diary.images?.length ?? 0) > 0)
const canPublish = computed(() => props.isAuthor && !isHiddenByReport.value && hasPhoto.value)
const canUnpublish = computed(() => props.isAuthor || props.isPetOwner)

async function apply(visibility) {
  errorMessage.value = ''
  isConfirming.value = false
  try {
    const updated = await diaryStore.changeDiaryVisibility(props.diary.id, visibility)
    emit('changed', updated)
  } catch (error) {
    errorMessage.value = error.response?.data?.message
      || '공개 설정을 바꾸지 못했어요. 잠시 후 다시 시도해 주세요.'
  }
}
</script>

<template>
  <section class="rounded-(--radius-lg) border border-(--color-card-border) bg-(--color-white) p-(--space-4)">
    <!-- 신고로 내려간 글은 사유를 알리고 조작을 막는다. -->
    <template v-if="isHiddenByReport">
      <p class="m-0 text-(length:--font-sm) font-bold text-(--color-danger-strong)">
        신고로 노출이 멈춘 글이에요
      </p>
      <p class="mb-0 mt-(--space-2) text-(length:--font-xs) leading-[1.5] text-(--color-slate-muted)">
        고객센터에서 확인 중이에요. 확인이 끝나기 전에는 다시 공개할 수 없어요.
      </p>
    </template>

    <template v-else>
      <p class="m-0 text-(length:--font-sm) font-bold">
        {{ isPublic ? '멍스타그램에 공개 중이에요' : '가족만 볼 수 있어요' }}
      </p>
      <p class="mb-0 mt-(--space-2) text-(length:--font-xs) leading-[1.5] text-(--color-slate-muted)">
        {{ isPublic
          ? '누구나 이 글과 사진을 볼 수 있어요.'
          : '공개하면 애월을 쓰는 다른 사람도 이 글과 사진을 볼 수 있어요.' }}
      </p>

      <!--
        공개는 되돌릴 수 있지만 그 사이 누군가 이미 봤을 수 있다. 한 번 더 확인받는다.
      -->
      <template v-if="!isPublic && canPublish">
        <p
          v-if="isConfirming"
          class="mb-0 mt-(--space-3) text-(length:--font-xs) leading-[1.5] text-(--color-slate-dark)"
        >
          공개하면 사진 속 배경이나 함께 찍힌 사람도 같이 보여요. 다시 비공개로 바꿀 수는
          있지만 그 사이에 누군가 봤을 수 있어요.
        </p>

        <AppButton
          class="mt-(--space-3)"
          variant="primary"
          block
          :loading="diaryStore.isSubmitting"
          @click="isConfirming ? apply('PUBLIC') : (isConfirming = true)"
        >
          {{ isConfirming ? '네, 공개할게요' : '멍스타그램에 공개하기' }}
        </AppButton>

        <AppButton
          v-if="isConfirming"
          class="mt-(--space-2)"
          variant="ghost"
          block
          @click="isConfirming = false"
        >
          그만두기
        </AppButton>
      </template>

      <AppButton
        v-else-if="isPublic && canUnpublish"
        class="mt-(--space-3)"
        variant="secondary"
        block
        :loading="diaryStore.isSubmitting"
        @click="apply('PRIVATE')"
      >
        비공개로 바꾸기
      </AppButton>

      <p
        v-else-if="!isPublic && isAuthor && !hasPhoto"
        class="mb-0 mt-(--space-3) text-(length:--font-xs) leading-[1.5] text-(--color-slate-muted)"
      >
        사진이 있는 일기만 공개할 수 있어요. 사진을 추가하면 공개할 수 있어요.
      </p>

      <!-- 작성자가 아니면 공개 스위치 자체를 보여주지 않는다. -->
      <p
        v-else-if="!isPublic"
        class="mb-0 mt-(--space-3) text-(length:--font-xs) text-(--color-slate-muted)"
      >
        공개는 이 일기를 쓴 사람만 할 수 있어요.
      </p>
    </template>

    <p
      v-if="errorMessage"
      class="mb-0 mt-(--space-3) text-(length:--font-sm) text-(--color-danger-strong)"
      role="alert"
    >
      {{ errorMessage }}
    </p>
  </section>
</template>
