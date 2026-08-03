import { acceptHMRUpdate, defineStore } from 'pinia'
import { petApi } from '@/api/pet'
import { mockPets } from '@/mocks/pet'
import { USE_MOCK_DATA } from '@/mocks/config'

export const usePetStore = defineStore('pet', {
  state: () => ({
    pets: mockPets.map((pet) => ({ ...pet })),
    currentPet: null,
  }),

  actions: {
    async fetchPets() {
      if (USE_MOCK_DATA) {
        if (this.pets.length === 0) {
          this.pets = mockPets.map((pet) => ({ ...pet }))
        }
        return this.pets
      }
      const { data } = await petApi.getPets()
      this.pets = data.result ?? []
      return this.pets
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
