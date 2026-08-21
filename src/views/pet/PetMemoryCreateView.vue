<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { usePetStore } from '@/stores/pet'
import { usePetMemoryStore } from '@/stores/petMemory'
import { useMemberStore } from '@/stores/member'
import AppButton from '@/components/common/AppButton.vue'
import PetSelectorChip from '@/components/common/PetSelectorChip.vue'
import IconImage from '@/components/common/icons/IconImage.vue'

const router = useRouter()
const petStore = usePetStore()
const memoryStore = usePetMemoryStore()
const memberStore = useMemberStore()
const selectedPetId = ref(petStore.representativePetId ?? petStore.pets[0]?.id ?? '')
const previewUrl = ref('')
const description = ref('')
const canSave = computed(() => Boolean(previewUrl.value && description.value.trim()))
const currentAuthorName = computed(() => memberStore.profile?.name ?? '나')
function selectPhoto(event) {
  const file = event.target.files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.addEventListener('load', () => {
    previewUrl.value = String(reader.result)
  })
  reader.readAsDataURL(file)
}

function saveMemory() {
  if (!canSave.value) return
  const pet = petStore.pets.find(({ id }) => id === String(selectedPetId.value))
  memoryStore.addMemory({
    petId: selectedPetId.value,
    petName: pet?.name ?? '',
    authorId: 'current-user',
    authorName: currentAuthorName.value,
    imageUrl: previewUrl.value,
    description: description.value.trim(),
  })
  router.replace('/pets/memories')
}

onMounted(async () => {
  if (!memberStore.profile) await memberStore.fetchProfile().catch(() => {})
})
</script>

<template>
  <div class="min-h-screen bg-(--color-app-bg) px-(--space-5) py-(--space-4) pb-(--space-8)">
    <header class="mb-(--space-5)">
      <h1 class="text-(length:--font-2xl) font-bold text-(color:--color-navy)">
        오늘의 추억
      </h1>
      <p class="mt-(--space-1) text-(length:--font-md) text-(color:--color-slate-muted)">
        사진 한 장과 짧은 이야기를 남겨요
      </p>
    </header>
    <div
      v-if="petStore.pets.length > 1"
      class="mb-(--space-4) flex gap-(--space-2) overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      <PetSelectorChip
        v-for="pet in petStore.pets"
        :key="pet.id"
        :label="pet.name"
        :species="pet.species"
        :selected="selectedPetId === pet.id"
        @click="selectedPetId = pet.id"
      />
    </div>
    <label class="flex h-[320px] cursor-pointer items-center justify-center overflow-hidden rounded-[28px] border-2 border-dashed border-(--color-card-border) bg-(--color-white)">
      <input
        type="file"
        accept="image/*"
        class="sr-only"
        @change="selectPhoto"
      >
      <img
        v-if="previewUrl"
        :src="previewUrl"
        alt="오늘의 추억"
        class="size-full object-cover"
      >
      <span
        v-else
        class="flex flex-col items-center gap-(--space-3) text-(color:--color-slate-muted)"
      ><IconImage size="32" /><b class="text-(length:--font-sm)">갤러리에서 사진 한 장 선택</b></span>
    </label>
    <textarea
      v-model="description"
      maxlength="80"
      rows="3"
      placeholder="오늘의 이야기를 한 줄로 남겨주세요"
      class="mt-(--space-4) w-full resize-none rounded-[20px] border border-(--color-card-border) bg-(--color-white) p-(--space-4) text-(length:--font-sm) outline-none focus:border-(--color-leaf-dark)"
    />
    <p class="mt-(--space-2) text-right text-(length:--font-xs) text-(color:--color-slate-muted)">
      {{ description.length }}/80
    </p>
    <AppButton
      class="mt-(--space-5)"
      size="lg"
      block
      :disabled="!canSave"
      @click="saveMemory"
    >
      오늘의 추억 저장
    </AppButton>
  </div>
</template>
