<script setup>
import { nextTick, ref, watch } from 'vue'
import AppButton from '@/components/common/AppButton.vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true,
  },
})

const emit = defineEmits(['update:modelValue', 'select'])

const DAUM_POSTCODE_SCRIPT_SRC =
  '//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js'

const postcodeContainerRef = ref(null)
const loadError = ref('')
const isLoading = ref(false)
let previouslyFocusedElement = null
let daumPostcodeLoadPromise = null

function loadDaumPostcodeScript() {
  if (window.daum?.Postcode) return Promise.resolve()

  if (!daumPostcodeLoadPromise) {
    daumPostcodeLoadPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.src = DAUM_POSTCODE_SCRIPT_SRC
      script.onload = resolve
      script.onerror = () => {
        script.remove()
        reject(new Error('우편번호 서비스를 불러오지 못했습니다'))
      }
      document.head.appendChild(script)
    }).catch((error) => {
      daumPostcodeLoadPromise = null
      throw error
    })
  }

  return daumPostcodeLoadPromise
}

function close() {
  emit('update:modelValue', false)
}

async function openPostcode() {
  loadError.value = ''
  isLoading.value = true

  try {
    await loadDaumPostcodeScript()
    await nextTick()

    if (!props.modelValue || !postcodeContainerRef.value) return

    postcodeContainerRef.value.replaceChildren()
    new window.daum.Postcode({
      oncomplete(data) {
        emit('select', {
          zipCode: data.zonecode,
          address: data.roadAddress || data.jibunAddress,
        })
        close()
      },
      width: '100%',
      height: '100%',
    }).embed(postcodeContainerRef.value)
  } catch {
    loadError.value = '우편번호 서비스를 불러오지 못했어요. 잠시 후 다시 시도해주세요.'
  } finally {
    isLoading.value = false
  }
}

function handleKeydown(event) {
  if (event.key === 'Escape') close()
}

watch(
  () => props.modelValue,
  async (isOpen) => {
    if (isOpen) {
      previouslyFocusedElement = document.activeElement
      await nextTick()
      await openPostcode()
      return
    }

    if (previouslyFocusedElement) {
      previouslyFocusedElement.focus()
      previouslyFocusedElement = null
    }
  },
)
</script>

<template>
  <Teleport to="body">
    <div
      v-if="modelValue"
      class="fixed inset-0 z-1000 flex min-w-0 flex-col overflow-hidden bg-(--color-white)"
      role="dialog"
      aria-modal="true"
      aria-labelledby="address-search-title"
      @keydown="handleKeydown"
    >
      <header
        class="flex items-center justify-between border-b border-(--color-border) p-(--space-4)"
      >
        <h2
          id="address-search-title"
          class="text-(length:--font-md) font-semibold text-(color:--color-navy)"
        >
          주소 검색
        </h2>
        <AppButton
          variant="ghost"
          size="sm"
          type="button"
          @click="close"
        >
          닫기
        </AppButton>
      </header>

      <div
        v-if="isLoading"
        class="flex flex-1 items-center justify-center text-(length:--font-sm) text-(color:--color-slate-muted)"
        role="status"
      >
        주소 검색을 불러오는 중이에요
      </div>

      <div
        v-else-if="loadError"
        class="flex flex-1 flex-col items-center justify-center gap-(--space-4) px-(--space-5) text-center"
      >
        <p
          class="text-(length:--font-sm) text-(color:--color-danger)"
          role="alert"
        >
          {{ loadError }}
        </p>
        <AppButton
          variant="secondary"
          type="button"
          @click="openPostcode"
        >
          다시 시도
        </AppButton>
      </div>

      <div
        v-show="!isLoading && !loadError"
        ref="postcodeContainerRef"
        class="min-h-0 w-full min-w-0 flex-1 overflow-hidden"
      />
    </div>
  </Teleport>
</template>
