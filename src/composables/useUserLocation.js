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

const PERMISSION_DENIED = 1

// Chrome(Windows)에서 getCurrentPosition이 명세를 어기고 두 콜백을 다 부르는 경우가 있어요.
// 실측: 오류 콜백이 7ms에 code 1로 먼저 오고, 135ms 뒤 성공 콜백에 진짜 좌표가 들어와요.
// 첫 오류를 최종 실패로 확정하면 뒤늦게 도착하는 실제 위치를 버리고 기본 좌표로 내려가요.
// 그래서 오류가 와도 이 시간만큼은 성공을 기다려요. 관측값의 7배 여유이면서,
// 진짜 거부일 때 사용자가 안내를 보기까지 1초만 늦어지는 선이에요.
const ERROR_GRACE_MS = 1000

// PositionError.code 별 안내. 원인마다 사용자가 할 수 있는 조치가 달라서 문구를 나눠요.
// code 1(PERMISSION_DENIED)만은 코드 하나에 서로 다른 상황이 섞여 있어서
// resolveDeniedMessage()가 권한 상태로 따로 판별해요.
const ERROR_MESSAGES = {
  2: '현재 위치를 확인할 수 없어요. 네트워크 연결을 확인해주세요',
  3: '위치 확인이 오래 걸려요. 다시 시도해주세요',
}
const SITE_PERMISSION_MESSAGE =
  '위치 권한이 꺼져 있어요. 주소창의 자물쇠 아이콘에서 위치를 허용해주세요'
const OS_LOCATION_MESSAGE =
  '기기의 위치 서비스가 꺼져 있어요. 설정에서 위치를 켠 뒤 다시 시도해주세요'
// prompt는 아직 허용도 거부도 고르지 않은 상태예요. 권한 팝업을 그냥 닫아도 여기로 와요.
// 원인을 단정할 수 없으니 어느 쪽이든 통하는 중립적인 재시도 안내를 해요.
const RETRY_MESSAGE = '위치 확인이 취소됐어요. 다시 시도해주세요'
const IN_APP_BROWSER_MESSAGE =
  '앱 안에서 열린 화면에서는 위치를 쓸 수 없어요. 크롬이나 사파리로 열어주세요'
const FALLBACK_MESSAGE = '현재 위치를 확인할 수 없어요'
const UNSUPPORTED_MESSAGE = '이 브라우저는 위치 기능을 지원하지 않아요'

// 카카오톡/인스타그램/페이스북/라인/네이버 인앱 웹뷰. 이들은 앱 자체에 OS 위치 권한이
// 없으면 사이트 권한과 무관하게 측위를 거부해서, 브라우저 설정을 아무리 만져도 안 풀려요.
const IN_APP_BROWSER_PATTERN = /KAKAOTALK|Instagram|FBAN|FBAV|Line\/|NAVER\(inapp/i

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
      locationError.value = await resolveMessage(error)
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
    let settled = false
    let graceTimer = null

    function succeed(position) {
      if (settled) return
      settled = true
      clearTimeout(graceTimer)
      resolve(position)
    }

    // 오류를 즉시 확정하지 않고 유예를 둬요 — 그 사이에 성공이 오면 그쪽이 이겨요.
    function fail(error) {
      if (settled) return
      clearTimeout(graceTimer)
      graceTimer = setTimeout(() => {
        if (settled) return
        settled = true
        reject(error)
      }, ERROR_GRACE_MS)
    }

    navigator.geolocation.getCurrentPosition(succeed, fail, GEOLOCATION_OPTIONS)
  })
}

function resolveMessage(error) {
  if (error?.code === PERMISSION_DENIED) return resolveDeniedMessage()
  return Promise.resolve(ERROR_MESSAGES[error?.code] ?? FALLBACK_MESSAGE)
}

/**
 * code 1(PERMISSION_DENIED)에는 사용자가 할 조치가 전혀 다른 세 상황이 섞여 있어요.
 * 사이트 권한이 이미 granted인데도 OS 위치 서비스가 꺼져 있으면 브라우저는 똑같이
 * code 1을 주는데, 여기서 "자물쇠 아이콘에서 허용하세요"라고 안내하면 이미 허용된
 * 권한을 가리키는 셈이라 사용자가 아무것도 할 수 없어요. 그래서 Permissions API로
 * 사이트 권한 상태를 되물어 실제로 막고 있는 쪽을 가리켜요.
 */
async function resolveDeniedMessage() {
  if (isInAppBrowser()) return IN_APP_BROWSER_MESSAGE

  const state = await queryPermissionState()
  // 상태를 못 읽는 브라우저(구형 Safari 등)에서는 가장 흔한 사이트 권한 거부로 안내해요.
  if (state === null || state === 'denied') return SITE_PERMISSION_MESSAGE

  // 아직 선택하지 않은 상태. 팝업을 닫았을 수도, OS가 막았을 수도 있어 단정하지 않아요.
  if (state === 'prompt') return RETRY_MESSAGE

  // granted인데 거부됐다면 사이트 권한은 이미 열려 있으니 브라우저 밖(OS)에서 막은 거예요.
  return OS_LOCATION_MESSAGE
}

async function queryPermissionState() {
  try {
    const status = await navigator.permissions?.query({ name: 'geolocation' })
    return status?.state ?? null
  } catch {
    // Permissions API가 없거나 geolocation을 지원하지 않는 브라우저. 안내 문구를
    // 고르지 못할 뿐 측위 실패 자체는 이미 처리했으니 조용히 넘어가요.
    return null
  }
}

function isInAppBrowser() {
  return IN_APP_BROWSER_PATTERN.test(navigator.userAgent ?? '')
}
