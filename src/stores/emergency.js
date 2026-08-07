import { defineStore } from 'pinia'
import { emergencyApi } from '@/api/emergency'
import { USE_MOCK_DATA } from '@/mocks/config'
import { mockHospitals } from '@/mocks/emergency'

export const useEmergencyStore = defineStore('emergency', {
  state: () => ({
    hospitals: [],
    isLoading: false,
    error: null,
  }),

  actions: {
    // GET /api/emergency/hospitals — latitude/longitude/radiusKm/is24h 쿼리 파라미터로 조회
    async fetchHospitals({ latitude, longitude, radiusKm = 5, is24h = false } = {}) {
      if (USE_MOCK_DATA) {
        this.hospitals = mockHospitals
        return this.hospitals
      }

      this.isLoading = true
      this.error = null
      try {
        const { data } = await emergencyApi.searchHospitals({ latitude, longitude, radiusKm, is24h })
        // 백엔드 응답은 { status, message, result: HospitalResponse[] } 래퍼라 data.result가 실제 목록
        this.hospitals = data.result ?? []
        return this.hospitals
      } catch (err) {
        this.error = err
        throw err
      } finally {
        this.isLoading = false
      }
    },
  },
})
