<script setup>
import { ref, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useSupportStore } from '@/stores/support';
import IconArrowLeft from '@/components/common/icons/IconArrowLeft.vue';
import IconImage from '@/components/common/icons/IconImage.vue';
import IconClose from '@/components/common/icons/IconClose.vue';
import { SUPPORT_CATEGORIES } from '@/utils/mockData';

const router = useRouter();
const store = useSupportStore();

const CATEGORIES = SUPPORT_CATEGORIES;
const MAX_ATTACHMENT_COUNT = 3;
const MAX_TOTAL_ATTACHMENT_SIZE = 10 * 1024 * 1024; // 3장 합쳐서 최대 10MB — 백엔드 multipart 요청 한도에 맞춤

const category = ref('지갑·버킷');
const title = ref('');
const content = ref('');
const email = ref('');
const attachments = ref([]); // { file, previewUrl }
const isSubmitting = ref(false);
const submitError = ref('');
const attachmentError = ref('');

const fileInput = ref(null);

function totalAttachmentSize(list) {
  return list.reduce((sum, item) => sum + item.file.size, 0);
}

function openFilePicker() {
  if (attachments.value.length >= MAX_ATTACHMENT_COUNT) return;
  fileInput.value?.click();
}

function onFilesSelected(event) {
  attachmentError.value = '';
  const files = Array.from(event.target.files ?? []);
  const remainingSlots = MAX_ATTACHMENT_COUNT - attachments.value.length;
  let currentTotal = totalAttachmentSize(attachments.value);

  const filesToAdd = files.slice(0, remainingSlots);
  const droppedCount = files.length - filesToAdd.length;

  for (const file of filesToAdd) {
    if (currentTotal + file.size > MAX_TOTAL_ATTACHMENT_SIZE) {
      attachmentError.value = '첨부 이미지 용량은 3장 합쳐서 최대 10MB까지 가능해요';
      break;
    }
    attachments.value.push({ file, previewUrl: URL.createObjectURL(file) });
    currentTotal += file.size;
  }

  // 용량 초과로 이미 에러 메시지가 떴으면 그걸 우선하고, 그게 아니라 개수 제한 때문에
  // 잘려나간 파일이 있으면 왜 다 안 들어갔는지 알려줘요.
  if (!attachmentError.value && droppedCount > 0) {
    attachmentError.value = `최대 ${MAX_ATTACHMENT_COUNT}장까지만 첨부할 수 있어서 ${droppedCount}장은 제외됐어요`;
  }

  event.target.value = '';
}

function removeAttachment(index) {
  URL.revokeObjectURL(attachments.value[index].previewUrl);
  attachments.value.splice(index, 1);
  attachmentError.value = '';
}

// 제출 성공 후 router.replace로 이동하거나 뒤로가기로 이탈하는 등,
// removeAttachment를 거치지 않고 화면을 벗어나는 모든 경우를 대비해
// 남아있는 첨부 미리보기 object URL을 여기서 한 번에 정리해요.
onUnmounted(() => {
  attachments.value.forEach((item) => URL.revokeObjectURL(item.previewUrl));
});

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const isEmailValid = () => EMAIL_PATTERN.test(email.value.trim());

const isFormValid = () =>
  title.value.trim() && content.value.trim() && email.value.trim() && isEmailValid();

async function submit() {
  if (!isFormValid()) return;
  isSubmitting.value = true;
  submitError.value = '';
  try {
    await store.submitInquiry({
      category: category.value,
      title: title.value.trim(),
      content: content.value.trim(),
      email: email.value.trim(),
      images: attachments.value.map((item) => item.file),
    });

    router.replace({ name: 'InquirySubmitted' });
  } catch {
    submitError.value = '문의 제출에 실패했어요. 잠시 후 다시 시도해주세요';
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<template>
  <div class="min-h-screen max-w-[420px] mx-auto bg-(--color-bg) px-5 pt-6 pb-10">
    <button
      class="-ml-2 p-2 flex items-center justify-center mb-5"
      @click="router.back()"
    >
      <IconArrowLeft :size="20" color="var(--color-gray-700)" />
    </button>

    <header class="mb-6">
      <h1 class="text-(length:--font-2xl) font-bold text-(color:--color-navy)">1:1 문의하기</h1>
      <p class="text-(length:--font-md) text-(color:--color-gray-600) mt-1">궁금한 점을 남겨주시면 빠르게 답변드릴게요</p>
    </header>

    <section class="mb-6">
      <h2 class="text-(length:--font-sm) font-semibold text-(color:--color-navy) mb-2">카테고리</h2>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="c in CATEGORIES"
          :key="c"
          class="px-4 py-2 rounded-full text-(length:--font-sm) font-medium"
          :class="{
            'bg-(--color-navy) text-(color:--color-white)': category === c,
            'bg-(--color-surface) text-(color:--color-gray-600)': category !== c,
          }"
          @click="category = c"
        >
          {{ c }}
        </button>
      </div>
    </section>

    <section class="mb-6">
      <h2 class="text-(length:--font-sm) font-semibold text-(color:--color-navy) mb-2">제목</h2>
      <input
        v-model="title"
        type="text"
        placeholder="문의 제목을 입력해주세요"
        class="w-full p-4 rounded-xl bg-(--color-surface) text-(length:--font-md) text-(color:--color-navy) outline-none"
      />
    </section>

    <section class="mb-6">
      <h2 class="text-(length:--font-sm) font-semibold text-(color:--color-navy) mb-2">내용</h2>
      <textarea
        v-model="content"
        rows="5"
        placeholder="어떤 점이 궁금하신가요?
최대한 자세히 남겨주시면 더 빠르고 정확하게 답변드릴 수 있어요."
        class="w-full p-4 rounded-xl bg-(--color-surface) text-(length:--font-md) text-(color:--color-navy) outline-none resize-none"
      />
    </section>

    <input
      ref="fileInput"
      type="file"
      accept="image/*"
      multiple
      class="hidden"
      @change="onFilesSelected"
    />
    <button
      class="w-full flex items-center justify-center gap-2 py-4 rounded-xl border border-(--color-border) text-(length:--font-sm) text-(color:--color-gray-600) mb-1 disabled:opacity-50"
      :disabled="attachments.length >= MAX_ATTACHMENT_COUNT"
      @click="openFilePicker"
    >
      <IconImage :size="16" color="var(--color-gray-500)" />
      스크린샷 · 이미지 첨부 (최대 3장, 합쳐서 최대 10MB)
    </button>
    <p v-if="attachmentError" class="text-(length:--font-xs) text-(color:--color-danger) mb-3">{{ attachmentError }}</p>

    <div v-if="attachments.length" class="flex gap-2 mb-6">
      <div
        v-for="(item, index) in attachments"
        :key="index"
        class="relative w-16 h-16 rounded-lg overflow-hidden bg-(--color-surface)"
      >
        <img :src="item.previewUrl" alt="" class="w-full h-full object-cover" />
        <button
          class="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-(--color-navy) flex items-center justify-center"
          @click="removeAttachment(index)"
        >
          <IconClose :size="10" color="var(--color-white)" />
        </button>
      </div>
    </div>

    <section class="mb-6">
      <h2 class="text-(length:--font-sm) font-semibold text-(color:--color-navy) mb-2">회신받을 이메일</h2>
      <input
        v-model="email"
        type="email"
        placeholder="example@aewol.com"
        class="w-full p-4 rounded-xl bg-(--color-surface) text-(length:--font-md) text-(color:--color-navy) outline-none"
      />
      <p
        v-if="email.trim() && !isEmailValid()"
        class="text-(length:--font-xs) text-(color:--color-danger) mt-1"
      >
        올바른 이메일 형식으로 입력해주세요
      </p>
    </section>

    <p v-if="submitError" class="text-(length:--font-sm) text-(color:--color-danger) mb-3">{{ submitError }}</p>

    <button
      class="w-full py-4 rounded-xl bg-(--color-gold) text-(color:--color-navy) font-bold disabled:opacity-50"
      :disabled="!isFormValid() || isSubmitting"
      @click="submit"
    >
      {{ isSubmitting ? '제출하는 중…' : '문의 제출하기' }}
    </button>
  </div>
</template>