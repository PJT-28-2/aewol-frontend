import { ref } from 'vue'

/**
 * 브라우저 위치(geolocation) 조회를 표준화한 컴포저블.
 *
 * 원래 EmergencyView 안에서 `catch {}`로 실패를 통째로 삼키고 기본 좌표로 넘어갔어요.
 * 그래서 (1) 왜 실패했는지 알 수 없고 (2) 사용자는 자기 위치 기준이라고 믿은 채
 * 기본 좌표 주변 병원을 보게 됐어요. 응급 병원 찾기에서는 위험한 침묵이라
 * 실패 사유를 남기고 화면에 알릴 수 있도록 상태로 끌어올렸어요.
 */

const GEOLOCATION_OPTIONS = {
  // 데스크톱은 GPS가 없어 WiFi/IP 기반 네트워크 측위를 쓰는데, 기존 5초로는 자주 모자랐어요.
  timeout: 15000,
  // maximumAge 기본값 0은 캐시된 위치를 아예 쓰지 않고 매번 새 측위를 강제해요.
  // 10분 이내 위치면 주변 병원을 찾는 데 충분히 정확하고, 즉시 응답해서 실패율이 크게 줄어요.
  maximumAge: 600000,
}

// PositionError.code 별 안내. 원인마다 사용자가 할 수 있는 조치가 달라서 문구를 나눠요.
const ERROR_MESSAGES = {
  1: '위치 권한이 꺼져 있어요. 주소창의 자물쇠 아이콘에서 위치를 허용해주세요',
  2: '현재 위치를 확인할 수 없어요. 네트워크 연결을 확인해주세요',
  3: '위치 확인이 오래 걸려요. 다시 시도해주세요',
}
const FALLBACK_MESSAGE = '현재 위치를 확인할 수 없어요'
const UNSUPPORTED_MESSAGE = '이 브라우저는 위치 기능을 지원하지 않아요'

export function useUserLocation({ defaultLatitude, defaultLongitude }) {
  const latitude = ref(defaultLatitude)
  const longitude = ref(defaultLongitude)

  /** 실제 측위에 한 번도 성공하지 못했으면 true — 좌표가 기본값이라는 뜻이에요. */
  const isFallbackLocation = ref(true)
  const locationError = ref('')
  const isLocating = ref(false)

  /**
   * 현재 위치를 조회해서 latitude/longitude를 갱신해요.
   * @returns {Promise<boolean>} 측위 성공 여부
   */
  async function locate() {
    // 재시도 버튼 연타로 측위가 동시에 여러 번 돌지 않게 막아요
    // (useAccountsLoader와 같은 이유 — await 이전에 동기적으로 체크해요).
    if (isLocating.value) return false

    if (!navigator.geolocation) {
      locationError.value = UNSUPPORTED_MESSAGE
      return false
    }

    isLocating.value = true
    locationError.value = ''
    try {
      const position = await requestPosition()
      latitude.value = position.coords.latitude
      longitude.value = position.coords.longitude
      isFallbackLocation.value = false
      return true
    } catch (error) {
      // 실패 원인을 남겨요. 이게 없으면 권한 거부/측위 불가/타임아웃을 구분할 수 없어
      // 진단이 불가능해요 — 기존 silent catch가 정확히 그 상태였어요.
      console.warn('[useUserLocation] 위치 조회 실패', {
        code: error?.code,
        message: error?.message,
      })
      locationError.value = ERROR_MESSAGES[error?.code] ?? FALLBACK_MESSAGE
      // 좌표는 그대로 둬요 — 직전에 성공한 위치가 있으면 그게 기본값보다 정확하고,
      // 한 번도 성공하지 못했다면 기본 좌표로 화면을 채우는 편이 빈 화면보다 나아요.
      return false
    } finally {
      isLocating.value = false
    }
  }

  return { latitude, longitude, isFallbackLocation, locationError, isLocating, locate }
}

function requestPosition() {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, GEOLOCATION_OPTIONS)
  })
}
