import { defineStore } from 'pinia'
import { emergencyApi } from '@/api/emergency'
import { USE_MOCK_DATA } from '@/mocks/config'
import { mockHospitals } from '@/mocks/emergency'

// 스토어 밖의 모듈 스코프 변수로 둔다 — Pinia state(reactive)에 AbortController를 넣으면
// Vue의 reactive Proxy가 감싸면서 signal 관련 네이티브 메서드 호출 시 문제가 생길 수 있다.
// 이 앱은 CSR SPA라 스토어가 싱글턴이므로 모듈 스코프로도 충분하다.
let latestRequestId = 0
let activeController = null

function isAbortError(err) {
  return err?.code === 'ERR_CANCELED' || err?.name === 'CanceledError' || err?.name === 'AbortError'
}

export const useEmergencyStore = defineStore('emergency', {
  state: () => ({
    hospitals: [],
    isLoading: false,
    error: null,
  }),

  actions: {
    // GET /api/emergency/hospitals — latitude/longitude/radiusKm/is24h 쿼리 파라미터로 조회
    // is24h 토글을 빠르게 바꾸는 등으로 요청이 겹칠 때, 먼저 보낸 느린 요청이 나중에 응답해도
    // 최신 요청의 결과만 hospitals/error/isLoading에 반영되도록 요청 순번 + AbortController로 가드한다.
    async fetchHospitals({ latitude, longitude, radiusKm = 5, is24h = false } = {}) {
      const requestId = ++latestRequestId
      activeController?.abort()
      activeController = new AbortController()

      if (USE_MOCK_DATA) {
        this.hospitals = mockHospitals
        return this.hospitals
      }

      this.isLoading = true
      this.error = null
      try {
        const { data } = await emergencyApi.searchHospitals(
          { latitude, longitude, radiusKm, is24h },
          { signal: activeController.signal },
        )
        if (requestId !== latestRequestId) return this.hospitals // 이미 최신 요청이 아니면 무시

        // 백엔드 응답은 { status, message, result: HospitalResponse[] } 래퍼라 data.result가 실제 목록
        this.hospitals = data.result ?? []
        return this.hospitals
      } catch (err) {
        if (isAbortError(err) || requestId !== latestRequestId) return this.hospitals

        this.error = err
        throw err
      } finally {
        if (requestId === latestRequestId) this.isLoading = false
      }
    },
  },
})
