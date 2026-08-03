<script setup>
import { ref, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useSupportStore } from '@/stores/support';
import IconImage from '@/components/common/icons/IconImage.vue';
import IconClose from '@/components/common/icons/IconClose.vue';
import IconDocument from '@/components/common/icons/IconDocument.vue';
import { SUPPORT_CATEGORIES } from '@/mocks/support';

const router = useRouter();
const store = useSupportStore();

const CATEGORIES = SUPPORT_CATEGORIES;
const MAX_ATTACHMENT_COUNT = 3;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 파일당 최대 10MB
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];

const category = ref('지갑·버킷');
const title = ref('');
const content = ref('');
const email = ref('');
const attachments = ref([]); // { file, previewUrl } — previewUrl은 이미지일 때만 채워지고 pdf는 null
const isSubmitting = ref(false);
const submitError = ref('');
const attachmentError = ref('');

const fileInput = ref(null);

function openFilePicker() {
  if (attachments.value.length >= MAX_ATTACHMENT_COUNT) return;
  fileInput.value?.click();
}

function onFilesSelected(event) {
  attachmentError.value = '';
  const files = Array.from(event.target.files ?? []);
  const remainingSlots = MAX_ATTACHMENT_COUNT - attachments.value.length;

  // 남은 슬롯만큼 "먼저" 자르면, 그 안에 형식/용량이 안 맞는 파일이 섞여있을 때
  // 뒤에 있는 멀쩡한 파일까지 통째로 버려져요. 그래서 전체 파일을 먼저 형식/용량으로
  // 걸러내고, 유효한 파일만 모은 다음 그 목록을 남은 슬롯만큼 잘라요.
  const validFiles = [];
  for (const file of files) {
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      attachmentError.value = 'jpg, png, pdf 파일만 첨부할 수 있어요';
      continue;
    }
    if (file.size > MAX_FILE_SIZE) {
      attachmentError.value = '파일당 최대 10MB까지 첨부할 수 있어요';
      continue;
    }
    validFiles.push(file);
  }

  const filesToAdd = validFiles.slice(0, remainingSlots);
  const droppedCount = validFiles.length - filesToAdd.length;

  for (const file of filesToAdd) {
    attachments.value.push({
      file,
      previewUrl: file.type === 'application/pdf' ? null : URL.createObjectURL(file),
    });
  }

  // 형식/용량 에러로 이미 메시지가 떴으면 그걸 우선하고, 그게 아니라 개수 제한 때문에
  // 잘려나간 파일이 있으면 왜 다 안 들어갔는지 알려줘요.
  if (!attachmentError.value && droppedCount > 0) {
    attachmentError.value = `최대 ${MAX_ATTACHMENT_COUNT}장까지만 첨부할 수 있어서 ${droppedCount}개는 제외됐어요`;
  }

  event.target.value = '';
}

function removeAttachment(index) {
  const { previewUrl } = attachments.value[index];
  if (previewUrl) {
    URL.revokeObjectURL(previewUrl);
  }
  attachments.value.splice(index, 1);
  attachmentError.value = '';
}

// 제출 성공 후 router.replace로 이동하거나 뒤로가기로 이탈하는 등,
// removeAttachment를 거치지 않고 화면을 벗어나는 모든 경우를 대비해
// 남아있는 첨부 미리보기 object URL을 여기서 한 번에 정리해요.
onUnmounted(() => {
  attachments.value.forEach((item) => item.previewUrl && URL.revokeObjectURL(item.previewUrl));
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
  <div class="min-h-screen max-w-(--content-max-width) mx-auto bg-(--color-bg) px-5 pt-(--space-4) pb-10">

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
        class="w-full h-(--control-height-md) px-[13px] rounded-(--radius-lg) border border-(--color-border) bg-(--color-surface) text-[13px] text-(color:--color-navy) outline-none placeholder:text-(color:--color-slate-muted) focus:border-(--color-navy)"
      />
    </section>

    <section class="mb-6">
      <h2 class="text-(length:--font-sm) font-semibold text-(color:--color-navy) mb-2">내용</h2>
      <textarea
        v-model="content"
        rows="5"
        placeholder="어떤 점이 궁금하신가요?
최대한 자세히 남겨주시면 더 빠르고 정확하게 답변드릴 수 있어요."
        class="w-full p-[13px] rounded-(--radius-lg) border border-(--color-border) bg-(--color-surface) text-[13px] text-(color:--color-navy) outline-none placeholder:text-(color:--color-slate-muted) focus:border-(--color-navy) resize-none"
      />
    </section>

    <section class="mb-6">
      <input
        ref="fileInput"
        type="file"
        accept="image/jpeg,image/png,application/pdf"
        multiple
        class="hidden"
        @change="onFilesSelected"
      />
      <button
        class="w-full flex items-center justify-center gap-2 py-4 rounded-(--radius-xl) border border-(--color-border) text-(length:--font-sm) text-(color:--color-gray-600) disabled:opacity-50"
        :disabled="attachments.length >= MAX_ATTACHMENT_COUNT"
        @click="openFilePicker"
      >
        <IconImage :size="16" color="var(--color-gray-500)" />
        스크린샷 · 이미지 · PDF 첨부 (최대 3장, 파일당 최대 10MB)
      </button>
      <p v-if="attachmentError" class="text-(length:--font-xs) text-(color:--color-danger-strong) mt-2">{{ attachmentError }}</p>

      <div v-if="attachments.length" class="flex gap-2 mt-3">
        <div
          v-for="(item, index) in attachments"
          :key="index"
          class="relative w-16 h-16 rounded-(--radius-lg) overflow-hidden bg-(--color-surface)"
        >
          <img v-if="item.previewUrl" :src="item.previewUrl" alt="" class="w-full h-full object-cover" />
          <div v-else class="w-full h-full flex flex-col items-center justify-center gap-1 px-1">
            <IconDocument :size="20" color="var(--color-gray-500)" />
            <span class="text-(length:--font-xs) text-(color:--color-gray-600) truncate w-full text-center">{{ item.file.name }}</span>
          </div>
          <button
            class="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-(--color-navy) flex items-center justify-center"
            @click="removeAttachment(index)"
          >
            <IconClose :size="10" color="var(--color-white)" />
          </button>
        </div>
      </div>
    </section>

    <section class="mb-6">
      <h2 class="text-(length:--font-sm) font-semibold text-(color:--color-navy) mb-2">회신받을 이메일</h2>
      <input
        v-model="email"
        type="email"
        placeholder="example@aewol.com"
        class="w-full h-(--control-height-md) px-[13px] rounded-(--radius-lg) border border-(--color-border) bg-(--color-surface) text-[13px] text-(color:--color-navy) outline-none placeholder:text-(color:--color-slate-muted) focus:border-(--color-navy)"
      />
      <p
        v-if="email.trim() && !isEmailValid()"
        class="text-(length:--font-xs) text-(color:--color-danger-strong) mt-1"
      >
        올바른 이메일 형식으로 입력해주세요
      </p>
    </section>

    <p v-if="submitError" class="text-(length:--font-sm) text-(color:--color-danger-strong) mb-3">{{ submitError }}</p>

    <button
      class="w-full py-4 rounded-(--radius-xl) bg-(--color-gold) text-(color:--color-navy) font-bold disabled:opacity-50"
      :disabled="!isFormValid() || isSubmitting"
      @click="submit"
    >
      {{ isSubmitting ? '제출하는 중…' : '문의 제출하기' }}
    </button>
  </div>
</template>