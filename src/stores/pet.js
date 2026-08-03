import { acceptHMRUpdate, defineStore } from 'pinia'
import { petApi } from '@/api/pet'
import { mockPets } from '@/mocks/pet'
import { USE_MOCK_DATA } from '@/mocks/config'

export const usePetStore = defineStore('pet', {
  state: () => ({
    pets: mockPets.map((pet) => ({ ...pet })),
    currentPet: null,
    // 증명서 등 여러 화면이 공유하는 "현재 선택된 반려동물" — petId 기준
    selectedPetId: null,
  }),

  getters: {
    selectedPet: (state) => state.pets.find((pet) => pet.petId === state.selectedPetId) ?? null,
  },

  actions: {
    async fetchPets() {
      if (USE_MOCK_DATA) {
        if (this.pets.length === 0) {
          this.pets = mockPets.map((pet) => ({ ...pet }))
        }
        this._syncSelectedPetId()
        return this.pets
      }
      const { data } = await petApi.getPets()
      this.pets = data.result ?? []
      this._syncSelectedPetId()
      return this.pets
    },

    // 새로 받아온 pets 기준으로 selectedPetId가 여전히 유효한지 확인.
    // 펫 삭제나 계정 전환 후 이전 목록의 ID가 남아있을 수 있어, 목록에 없으면 첫 번째 펫으로 재설정(없으면 null)
    _syncSelectedPetId() {
      const stillExists = this.pets.some((pet) => pet.petId === this.selectedPetId)
      if (!stillExists) {
        this.selectedPetId = this.pets[0]?.petId ?? null
      }
    },

    selectPet(petId) {
      this.selectedPetId = petId
    },

    async fetchPet(id) {
      const { data } = await petApi.getPet(id)
      this.currentPet = data
      return data
    },

    async createPet(petData) {
      const { data } = await petApi.createPet(petData)
      this.pets.push(data)
      return data
    },

    async updatePet(id, petData) {
      const { data } = await petApi.updatePet(id, petData)
      const index = this.pets.findIndex((p) => p.id === id)
      if (index !== -1) this.pets[index] = data
      if (this.currentPet?.id === id) this.currentPet = data
      return data
    },

    async deletePet(id) {
      await petApi.deletePet(id)
      this.pets = this.pets.filter((p) => p.id !== id)
      if (this.currentPet?.id === id) this.currentPet = null
    },
  },
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(usePetStore, import.meta.hot))
}
