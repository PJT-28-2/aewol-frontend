import { defineStore } from 'pinia'
import { petApi } from '@/api/pet'

export const usePetStore = defineStore('pet', {
  state: () => ({
    pets: [],
    currentPet: null,
  }),

  actions: {
    async fetchPets() {
      const { data } = await petApi.getPets()
      this.pets = data
      return data
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
