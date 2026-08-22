<script setup>
import { ref } from 'vue'
import AppButton from '@/components/common/AppButton.vue'
import { useShareDiaryStore } from '@/stores/shareDiary'

/**
 * 게시물 신고.
 *
 * 사유는 목록에서 고르게 한다. 자유 입력을 받으면 그 내용이 또 다른 신고 대상이 될 수 있고,
 * 고객센터가 읽어야 할 글만 늘어난다.
 */
const props = defineProps({
  diaryId: { type: String, required: true },
})

const emit = defineEmits(['close', 'reported'])

const REASONS = [
  { value: 'SPAM', label: '광고나 스팸이에요' },
  { value: 'ABUSE', label: '욕설이나 혐오 표현이 있어요' },
  { value: 'SEXUAL', label: '선정적인 내용이에요' },
  { value: 'PRIVACY', label: '개인정보가 노출됐어요' },
  { value: 'ETC', label: '그 밖의 문제가 있어요' },
]

const diaryStore = useShareDiaryStore()
const selected = ref('')
const errorMessage = ref('')
const receipt = ref(null)

async function submit() {
  if (!selected.value || diaryStore.isSubmitting) return
  errorMessage.value = ''
  try {
    receipt.value = await diaryStore.reportDiary(props.diaryId, selected.value)
    emit('reported', receipt.value)
  } catch (error) {
    errorMessage.value = error.response?.data?.message
      || '신고를 접수하지 못했어요. 잠시 후 다시 시도해 주세요.'
  }
}
</script>

<template>
  <div
    class="rounded-(--radius-lg) border border-(--color-card-border) bg-(--color-white) p-(--space-4)"
    role="dialog"
    aria-labelledby="report-title"
  >
    <!-- 접수 후에는 무엇이 일어났는지 알려준다. 신고했는데 아무 반응이 없으면 다시 누른다. -->
    <template v-if="receipt">
      <h2
        id="report-title"
        class="m-0 text-(length:--font-md) font-bold"
      >
        신고를 접수했어요
      </h2>
      <!--
        "결과를 알려드릴게요"라고 쓰지 않는다. 고객센터에 답변 API가 아직 없어 개별 통지를
        보장할 수 없다. 지킬 수 없는 약속을 하느니 지금 일어난 일만 정확히 적는다.
      -->
      <p class="mb-0 mt-(--space-2) text-(length:--font-sm) leading-[1.6] text-(--color-slate-dark)">
        이 게시물은 바로 보이지 않게 처리했어요. 고객센터에서 확인할게요.
      </p>
      <p
        v-if="receipt.inquiryNumber"
        class="mb-0 mt-(--space-2) text-(length:--font-xs) text-(--color-slate-muted)"
      >
        접수번호 {{ receipt.inquiryNumber }} · 고객센터 문의 내역에서 접수 사실을 확인할 수 있어요.
      </p>

      <AppButton
        class="mt-(--space-4)"
        variant="secondary"
        block
        @click="emit('close')"
      >
        닫기
      </AppButton>
    </template>

    <template v-else>
      <h2
        id="report-title"
        class="m-0 text-(length:--font-md) font-bold"
      >
        이 게시물을 신고할까요?
      </h2>
      <p class="mb-0 mt-(--space-2) text-(length:--font-xs) leading-[1.5] text-(--color-slate-muted)">
        신고하면 확인이 끝날 때까지 이 게시물이 보이지 않아요.
      </p>

      <fieldset class="mt-(--space-4) border-0 p-0">
        <legend class="sr-only">
          신고 사유
        </legend>
        <label
          v-for="reason in REASONS"
          :key="reason.value"
          class="flex cursor-pointer items-center gap-(--space-3) py-(--space-2) text-(length:--font-sm)"
        >
          <input
            v-model="selected"
            type="radio"
            name="report-reason"
            :value="reason.value"
          >
          {{ reason.label }}
        </label>
      </fieldset>

      <p
        v-if="errorMessage"
        class="mb-0 mt-(--space-2) text-(length:--font-sm) text-(--color-danger-strong)"
        role="alert"
      >
        {{ errorMessage }}
      </p>

      <AppButton
        class="mt-(--space-4)"
        variant="danger"
        block
        :disabled="!selected"
        :loading="diaryStore.isSubmitting"
        @click="submit"
      >
        신고하기
      </AppButton>

      <AppButton
        class="mt-(--space-2)"
        variant="ghost"
        block
        @click="emit('close')"
      >
        그만두기
      </AppButton>
    </template>
  </div>
</template>
