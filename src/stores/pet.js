import { acceptHMRUpdate, defineStore } from 'pinia'
import { petApi } from '@/api/pet'
import { mockPets } from '@/mocks/pet'
import { USE_MOCK_DATA } from '@/mocks/config'

const normalizePet = (pet) => ({
  ...pet,
  id: String(pet.id ?? pet.petId),
  petId: String(pet.petId ?? pet.id),
  neutered: pet.neutered === true || pet.neutered === 'Y',
})

export const usePetStore = defineStore('pet', {
  state: () => ({
    pets: USE_MOCK_DATA ? mockPets.map(normalizePet) : [],
    currentPet: null,
    // TODO(backend): 대표 반려동물 설정 API 연동 후 서버 값으로 초기화
    representativePetId: null,
  }),

  actions: {
    async fetchPets() {
      if (USE_MOCK_DATA) {
        if (this.pets.length === 0) {
          this.pets = mockPets.map(normalizePet)
        }
        if (!this.representativePetId) this.representativePetId = this.pets[0]?.id ?? null
        return this.pets
      }
      const { data } = await petApi.getPets()
      this.pets = (data.result ?? []).map(normalizePet)
      if (!this.representativePetId) this.representativePetId = this.pets[0]?.id ?? null
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
      }
    },

    setRepresentativePet(id) {
      if (this.pets.some((pet) => pet.id === String(id))) {
        this.representativePetId = String(id)
      }
    },
  },
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(usePetStore, import.meta.hot))
}
