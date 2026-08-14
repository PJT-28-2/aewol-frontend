<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { useCertificateStore } from '@/stores/certificate'
import { useMemberStore } from '@/stores/member'
import { formatDateDot, formatDateTimeDot } from '@/utils/date'
import AppButton from '@/components/common/AppButton.vue'
import FeatureIconTile from '@/components/common/FeatureIconTile.vue'
import AppModal from '@/components/common/AppModal.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import IconRefresh from '@/components/common/icons/IconRefresh.vue'
import IconCheck from '@/components/common/icons/IconCheck.vue'
import IconDocument from '@/components/common/icons/IconDocument.vue'
import IconWarning from '@/components/common/icons/IconWarning.vue'

const route = useRoute()
const router = useRouter()
const certificateStore = useCertificateStore()
const memberStore = useMemberStore()

// 동물등록증뿐 아니라 접종증명서/진료확인서도 같은 상세 페이지를 공유한다.
// documents에서 docType을 먼저 확인해서, 등록증이면 registrationDetails를 조회하고
// 그 외(업로드한 사진)는 문서 레코드 자체(docName/fileUrl/issuedDate)를 그대로 사용한다.
const currentDoc = ref(null)
const isPhotoDoc = computed(() => currentDoc.value?.docType && currentDoc.value.docType !== 'REGISTRATION')

onMounted(async () => {
  // 목록 화면을 거치지 않고 이 화면으로 바로 진입(새로고침·직접 접속 등)해도
  // fetchCertificates가 mock 시딩/실제 조회를 모두 처리하므로 바로 호출하면 된다.
  await certificateStore.fetchCertificates(route.params.petId)

  currentDoc.value = certificateStore.documents.find((doc) => doc.docId === route.params.docId) ?? null

  if (!isPhotoDoc.value) {
    await certificateStore.fetchCertificateDetail(route.params.petId, route.params.docId)
  }
})

const certName = computed(() => {
  if (isPhotoDoc.value) return currentDoc.value?.docName ?? '증명서'
  return certificateStore.detail?.name ?? '동물등록증'
})

const pageTitle = computed(() => (isPhotoDoc.value ? currentDoc.value?.docName ?? '증명서' : '동물등록증'))
const pageSubtitle = computed(() =>
  isPhotoDoc.value
    ? `${formatDateDot(currentDoc.value?.issuedDate ?? '')} 업로드`
    : '국가동물보호정보시스템(APMS) 연동 정보',
)

const genderText = computed(() => {
  const detail = certificateStore.detail
  if (!detail) return ''
  const genderLabel = detail.gender === 'FEMALE' ? '암컷' : '수컷'
  const neuteredLabel = detail.neutered === 'Y' ? '중성화 완료' : '중성화 안함'
  return `${genderLabel}(${neuteredLabel})`
})

// 등록칩 구분: Y-내장, M-외장, N-인식표
const RFID_GUBUN_LABEL = { Y: '내장', M: '외장', N: '인식표' }

const infoRows = computed(() => {
  const detail = certificateStore.detail
  if (!detail) return []
  return [
    { label: '등록번호', value: detail.regNumber },
    { label: '동물명', value: detail.name },
    { label: '품종', value: detail.breed },
    { label: '성별', value: genderText.value },
    { label: '출생연월일', value: formatDateDot(detail.birthDate) },
    { label: '등록칩 구분', value: RFID_GUBUN_LABEL[detail.rfidGubun] ?? '' },
    { label: '등록칩번호', value: detail.rfidCd },
    { label: '관할기관', value: detail.orgNm },
    { label: '관할기관 연락처', value: detail.officeTel },
    { label: '승인여부', value: detail.aprGbnNm },
    { label: '등록일시', value: formatDateTimeDot(detail.regTm) },
    { label: '승인일시', value: formatDateTimeDot(detail.aprTm) },
  ]
})

// PDF 저장 / 공유하기 — 백엔드 API 없이 화면에 그려진 카드를 캡처해 클라이언트에서만 처리
const detailCardRef = ref(null)
const isGeneratingPdf = ref(false)
const isSharing = ref(false)
const showSavedModal = ref(false)
const showShareFallbackModal = ref(false)

async function captureCard() {
  // isLoading 중이거나 문서를 찾지 못하면 카드 자체가 렌더링되지 않아 ref가 null
  if (!detailCardRef.value) {
    throw new Error('캡처할 문서를 찾을 수 없어요.')
  }
  return html2canvas(detailCardRef.value, {
    scale: 2,
    useCORS: true,
    // CSS 변수는 html2canvas가 직접 해석하지 못해 실제 계산된 색상값을 런타임에 읽어서 전달
    backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--color-white').trim(),
  })
}

async function handleDownloadPdf() {
  isGeneratingPdf.value = true
  try {
    const canvas = await captureCard()
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    const margin = 10
    const pageWidth = pdf.internal.pageSize.getWidth()
    const contentWidth = pageWidth - margin * 2
    const imgHeight = (canvas.height * contentWidth) / canvas.width
    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', margin, margin, contentWidth, imgHeight)
    const fileName = isPhotoDoc.value ? certName.value : `동물등록증_${certName.value}`
    pdf.save(`${fileName}.pdf`)
    showSavedModal.value = true
  } catch {
    alert('문서를 저장할 수 없어요. 다시 시도해주세요.')
  } finally {
    isGeneratingPdf.value = false
  }
}

async function handleShare() {
  isSharing.value = true
  try {
    const canvas = await captureCard()
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'))
    const file = new File(
      [blob],
      `${certName.value}.png`,
      { type: 'image/png' },
    )

    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({
        files: [file],
        title: pageTitle.value,
        text: isPhotoDoc.value ? `${certName.value} 문서예요` : `${certName.value}의 동물등록증이에요`,
      })
      return
    }
    showShareFallbackModal.value = true
  } catch (err) {
    // 사용자가 공유시트를 취소한 경우는 안내가 필요 없음
    if (err?.name === 'AbortError') return
    showShareFallbackModal.value = true
  } finally {
    isSharing.value = false
  }
}

function handleShareFallbackConfirm() {
  showShareFallbackModal.value = false
  handleDownloadPdf()
}

// 재동기화 — 별도 재동기화 API가 없어, 같은 petId로 verify()를 다시 호출한다(백엔드가 기존
// 문서가 있으면 update 분기를 타서 재검증+갱신됨). regNumber는 이미 연동된 값을 그대로 쓰고,
// 신청인 이름/생년월일은 회원 프로필로 채운다("대표 보호자만 이 작업을 할 수 있음" 전제와 일치)
const isResyncing = ref(false)
const resyncError = ref('')

async function handleResync() {
  if (!certificateStore.detail) return
  resyncError.value = ''
  isResyncing.value = true
  try {
    if (!memberStore.profile) await memberStore.fetchProfile()
    await certificateStore.verifyRegistration(route.params.petId, {
      regNumber: certificateStore.detail.regNumber,
      userName: memberStore.profile?.name ?? '',
      birthDate: memberStore.profile?.birthDate ?? '',
    })
  } catch (err) {
    resyncError.value = err.response?.data?.message ?? '동기화에 실패했어요. 다시 시도해주세요.'
  } finally {
    isResyncing.value = false
  }
}

// 연동 해제(삭제)
const showDeleteModal = ref(false)
const isDeleting = ref(false)
const deleteError = ref('')

function openDeleteModal() {
  deleteError.value = ''
  showDeleteModal.value = true
}

async function handleDelete() {
  if (!certificateStore.detail) return
  isDeleting.value = true
  try {
    await certificateStore.deleteRegistration(route.params.petId, certificateStore.detail.docId)
    router.replace('/certificates')
  } catch {
    deleteError.value = '연동 해제에 실패했어요. 다시 시도해주세요.'
  } finally {
    isDeleting.value = false
  }
}

// 접종증명서/진료확인서 사진 미리보기 실패 시 안내로 대체
const photoLoadError = ref(false)

// 접종증명서/진료확인서 사진 삭제
const showPhotoDeleteModal = ref(false)
const isDeletingPhoto = ref(false)
const photoDeleteError = ref('')

function openPhotoDeleteModal() {
  photoDeleteError.value = ''
  showPhotoDeleteModal.value = true
}

async function handlePhotoDelete() {
  if (!currentDoc.value) return
  isDeletingPhoto.value = true
  try {
    await certificateStore.deleteDocument(route.params.petId, currentDoc.value.docId)
    router.replace('/certificates')
  } catch {
    photoDeleteError.value = '삭제에 실패했어요. 다시 시도해주세요.'
  } finally {
    isDeletingPhoto.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-(--color-app-bg) p-(--space-4) pb-[calc(var(--bottom-nav-height)+var(--space-7))]">
    <header class="mb-(--space-5)">
      <h1 class="text-(length:--font-2xl) font-bold text-(color:--color-navy) mb-(--space-2)">
        {{ pageTitle }}
      </h1>
      <p class="text-(length:--font-md) text-(color:--color-gray-600)">
        {{ pageSubtitle }}
      </p>
    </header>

    <LoadingSpinner
      v-if="certificateStore.isLoading"
      class="my-(--space-8)"
    />

    <!-- 접종증명서/진료확인서: 업로드한 사진 -->
    <template v-else-if="isPhotoDoc">
      <div
        ref="detailCardRef"
        class="mb-(--space-5) overflow-hidden rounded-[28px] border border-(--color-card-border) bg-(--color-white) p-(--space-4) shadow-(--shadow-card)"
      >
        <img
          v-if="currentDoc?.fileUrl && !photoLoadError"
          :src="currentDoc.fileUrl"
          :alt="currentDoc.docName"
          class="w-full rounded-[20px]"
          @error="photoLoadError = true"
        >
        <p
          v-else
          class="text-(length:--font-sm) text-(color:--color-gray-600) text-center py-(--space-10)"
        >
          미리보기를 표시할 수 없어요
        </p>
      </div>

      <div class="flex gap-(--space-3)">
        <AppButton
          variant="danger"
          size="lg"
          class="flex-1"
          @click="openPhotoDeleteModal"
        >
          사진 삭제
        </AppButton>
        <AppButton
          variant="primary"
          size="lg"
          class="flex-1"
          :loading="isSharing"
          @click="handleShare"
        >
          공유하기
        </AppButton>
      </div>
    </template>

    <!-- 동물등록증 -->
    <template v-else-if="certificateStore.detail">
      <!-- 캡처 대상: PDF 저장/공유하기에서 그대로 이미지화 -->
      <div
        ref="detailCardRef"
        class="mb-(--space-4) overflow-hidden rounded-[28px] border border-(--color-card-border) bg-(--color-white) shadow-(--shadow-card)"
      >
        <div class="flex items-center justify-center gap-(--space-2) bg-(--color-leaf-soft) px-(--space-4) py-(--space-5)">
          <FeatureIconTile
            :icon="IconDocument"
            tone="pink"
          />
          <p class="text-center text-(length:--font-base) font-bold tracking-[0.12em] text-(color:--color-navy)">
            동 물 등 록 증
          </p>
        </div>

        <div class="bg-(--color-white) px-(--space-5) py-(--space-3)">
          <ul class="divide-y divide-(--color-card-border)">
            <li
              v-for="row in infoRows"
              :key="row.label"
              class="flex items-start gap-(--space-3) py-(--space-4)"
            >
              <span class="w-[36%] shrink-0 text-(length:--font-sm) font-medium text-(color:--color-slate-muted)">
                {{ row.label }}
              </span>
              <span class="min-w-0 flex-1 text-left text-(length:--font-sm) font-semibold text-(color:--color-navy) [overflow-wrap:anywhere]">
                {{ row.value }}
              </span>
            </li>
          </ul>
        </div>
      </div>

      <!-- 동기화 안내 -->
      <div class="mb-(--space-5) flex items-start gap-(--space-3) rounded-(--radius-xl) bg-(--color-white) p-(--space-4)">
        <button
          type="button"
          class="flex size-[40px] shrink-0 items-center justify-center rounded-[13px] bg-(--color-leaf-soft) disabled:opacity-50"
          :disabled="isResyncing"
          aria-label="지금 동기화"
          @click="handleResync"
        >
          <IconRefresh
            :size="24"
            color="var(--color-navy)"
            :class="isResyncing ? 'animate-spin' : ''"
          />
        </button>
        <div class="flex-1">
          <p class="text-(length:--font-sm) font-semibold text-(color:--color-navy)">
            APMS 정보 다시 확인하기
          </p>
          <p class="text-(length:--font-xs) text-(color:--color-gray-600) mt-(--space-1)">
            정보가 바뀌었다면 눌러서 최신 상태로 갱신해요
          </p>
          <p
            v-if="resyncError"
            class="text-(length:--font-xs) text-(color:--color-danger-strong) mt-(--space-1)"
          >
            {{ resyncError }}
          </p>
        </div>
      </div>

      <!-- PDF 저장 / 공유하기 -->
      <div class="flex gap-(--space-3) mb-(--space-4)">
        <AppButton
          variant="neutral"
          size="lg"
          class="flex-1"
          :loading="isGeneratingPdf"
          @click="handleDownloadPdf"
        >
          PDF 저장
        </AppButton>
        <AppButton
          variant="primary"
          size="lg"
          class="flex-1"
          :loading="isSharing"
          @click="handleShare"
        >
          공유하기
        </AppButton>
      </div>

      <button
        type="button"
        class="w-full rounded-(--radius-xl) py-(--space-3) text-center text-(length:--font-sm) font-medium text-(color:--color-danger-muted)"
        @click="openDeleteModal"
      >
        동물등록증 연동 해제
      </button>
    </template>

    <!-- 잘못되었거나 존재하지 않는 문서 -->
    <div
      v-else
      class="text-center py-(--space-8) text-(color:--color-gray-500)"
    >
      <p>문서를 찾을 수 없어요.</p>
    </div>

    <!-- PDF 저장 완료 모달 -->
    <AppModal
      v-model="showSavedModal"
      title="PDF 저장 완료"
      :show-close="false"
    >
      <template #icon>
        <IconCheck size="24" />
      </template>
      <p class="text-(length:--font-md) text-(color:--color-gray-600)">
        {{ isPhotoDoc ? `${certName} 파일이 저장되었어요.` : '동물등록증 PDF가 저장되었어요.' }}
      </p>
      <template #footer>
        <AppButton
          variant="primary"
          size="lg"
          block
          @click="showSavedModal = false"
        >
          확인
        </AppButton>
      </template>
    </AppModal>

    <!-- 공유 미지원 기기 안내 모달 -->
    <AppModal
      v-model="showShareFallbackModal"
      title="공유가 지원되지 않아요"
      :show-close="false"
    >
      <template #icon>
        <IconDocument size="24" />
      </template>
      <p class="text-(length:--font-md) text-(color:--color-gray-600)">
        이 기기·브라우저에서는 바로 공유할 수 없어요.<br>
        대신 PDF로 저장해드릴게요.
      </p>
      <template #footer>
        <AppButton
          variant="neutral"
          size="lg"
          class="flex-1"
          @click="showShareFallbackModal = false"
        >
          닫기
        </AppButton>
        <AppButton
          variant="primary"
          size="lg"
          class="flex-1"
          @click="handleShareFallbackConfirm"
        >
          PDF로 저장하기
        </AppButton>
      </template>
    </AppModal>

    <!-- 연동 해제 확인 모달 -->
    <AppModal
      v-model="showDeleteModal"
      title="동물등록증 연동을 해제할까요?"
    >
      <template #icon>
        <IconWarning size="24" />
      </template>
      <p class="text-(length:--font-md) text-(color:--color-gray-600)">
        연동을 해제하면 저장된 등록정보가 삭제돼요. 해제 후에도 언제든 다시 연동할 수 있어요.
      </p>
      <p
        v-if="deleteError"
        class="text-(length:--font-sm) text-(color:--color-danger-strong) mt-(--space-2)"
      >
        {{ deleteError }}
      </p>
      <template #footer>
        <AppButton
          variant="neutral"
          size="lg"
          class="flex-1"
          :disabled="isDeleting"
          @click="showDeleteModal = false"
        >
          취소
        </AppButton>
        <AppButton
          variant="danger"
          size="lg"
          class="flex-1"
          :loading="isDeleting"
          @click="handleDelete"
        >
          해제하기
        </AppButton>
      </template>
    </AppModal>

    <!-- 사진 삭제 확인 모달 -->
    <AppModal
      v-model="showPhotoDeleteModal"
      title="사진을 삭제할까요?"
    >
      <template #icon>
        <IconWarning size="24" />
      </template>
      <p class="text-(length:--font-md) text-(color:--color-gray-600)">
        삭제하면 다시 업로드해야 해요.
      </p>
      <p
        v-if="photoDeleteError"
        class="text-(length:--font-sm) text-(color:--color-danger-strong) mt-(--space-2)"
      >
        {{ photoDeleteError }}
      </p>
      <template #footer>
        <AppButton
          variant="neutral"
          size="lg"
          class="flex-1"
          :disabled="isDeletingPhoto"
          @click="showPhotoDeleteModal = false"
        >
          취소
        </AppButton>
        <AppButton
          variant="danger"
          size="lg"
          class="flex-1"
          :loading="isDeletingPhoto"
          @click="handlePhotoDelete"
        >
          삭제하기
        </AppButton>
      </template>
    </AppModal>
  </div>
</template>
