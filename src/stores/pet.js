import { acceptHMRUpdate, defineStore } from 'pinia'
import { petApi } from '@/api/pet'
import { beginSessionTask, isCurrentSession } from '@/utils/sessionEpoch'

const normalizePet = (pet) => ({
  ...pet,
  id: String(pet.id ?? pet.petId),
  petId: String(pet.petId ?? pet.id),
  neutered: pet.neutered === true || pet.neutered === 'Y',
})

const REPRESENTATIVE_PET_KEY = 'representativePetId'

function persistRepresentativePet(id) {
  if (id) localStorage.setItem(REPRESENTATIVE_PET_KEY, id)
  else localStorage.removeItem(REPRESENTATIVE_PET_KEY)
}

export const usePetStore = defineStore('pet', {
  state: () => ({
    pets: [],
    currentPet: null,
    // TODO(backend): 대표 반려동물 설정 API 연동 후 서버 값으로 초기화
    representativePetId: localStorage.getItem(REPRESENTATIVE_PET_KEY),
  }),

  actions: {
    async fetchPets() {
      const epoch = beginSessionTask()
      const { data } = await petApi.getPets()
      if (!isCurrentSession(epoch)) return this.pets
      this.pets = (data.result ?? []).map(normalizePet)
      if (!this.pets.some((pet) => pet.id === this.representativePetId)) {
        this.representativePetId = this.pets[0]?.id ?? null
        persistRepresentativePet(this.representativePetId)
      }
      return this.pets
    },

    async fetchPet(id) {
      const { data } = await petApi.getPet(id)
      this.currentPet = normalizePet(data.result ?? data)
      return this.currentPet
    },

    async createPet(petData) {
      const { data } = await petApi.createPet(petData)
      const created = normalizePet(data.result ?? data)
      this.pets.push(created)
      return created
    },

    async updatePet(id, petData) {
      await petApi.updatePet(id, petData)
      const updated = normalizePet({ ...petData, id, petId: id })
      const index = this.pets.findIndex((pet) => pet.id === String(id))
      if (index !== -1) this.pets[index] = updated
      if (this.currentPet?.id === String(id)) this.currentPet = updated
      return updated
    },

    async deletePet(id) {
      await petApi.deletePet(id)
      this.pets = this.pets.filter((pet) => pet.id !== String(id))
      if (this.currentPet?.id === String(id)) this.currentPet = null
      if (this.representativePetId === String(id)) {
        this.representativePetId = this.pets[0]?.id ?? null
        persistRepresentativePet(this.representativePetId)
      }
    },

    setRepresentativePet(id) {
      if (this.pets.some((pet) => pet.id === String(id))) {
        this.representativePetId = String(id)
        persistRepresentativePet(this.representativePetId)
      }
    },

    resetForLogout() {
      this.pets = []
      this.currentPet = null
      this.representativePetId = null
      persistRepresentativePet(null)
    },
  },
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(usePetStore, import.meta.hot))
}
