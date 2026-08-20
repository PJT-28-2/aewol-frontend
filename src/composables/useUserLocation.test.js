import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useUserLocation } from './useUserLocation'

const SEOUL = { defaultLatitude: 37.5665, defaultLongitude: 126.978 }
const ERROR_GRACE_MS = 1000

function positionOf(latitude, longitude) {
  return { coords: { latitude, longitude } }
}

/** getCurrentPosition의 성공/실패 콜백을 원하는 쪽으로 즉시 호출하는 스텁을 심어요. */
function stubGeolocation(impl) {
  const getCurrentPosition = vi.fn(impl)
  navigator.geolocation = { getCurrentPosition }
  return getCurrentPosition
}

/** 실패 확정까지의 유예 타이머를 흘려보내고 locate() 결과를 받아요. */
function settleLocate(locate) {
  const pending = locate()
  return vi.advanceTimersByTimeAsync(ERROR_GRACE_MS).then(() => pending)
}

/** Permissions API의 geolocation 상태를 원하는 값으로 고정해요. */
function stubPermissionState(state) {
  const query = vi.fn().mockResolvedValue({ state })
  navigator.permissions = { query }
  return query
}

/** 인앱 웹뷰 판별은 UA 문자열을 보므로 테스트에서 갈아끼워요. */
function stubUserAgent(value) {
  Object.defineProperty(navigator, 'userAgent', { value, configurable: true })
}

describe('useUserLocation', () => {
  const originalUserAgent = navigator.userAgent
  let warnSpy

  beforeEach(() => {
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    // 실패 경로는 ERROR_GRACE_MS만큼 성공을 기다리므로 타이머를 직접 돌려요.
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    warnSpy.mockRestore()
    delete navigator.geolocation
    delete navigator.permissions
    stubUserAgent(originalUserAgent)
  })

  it('기본 좌표로 시작하고 fallback 상태로 표시한다', () => {
    const { latitude, longitude, isFallbackLocation, locationError } = useUserLocation(SEOUL)

    expect(latitude.value).toBe(37.5665)
    expect(longitude.value).toBe(126.978)
    expect(isFallbackLocation.value).toBe(true)
    expect(locationError.value).toBe('')
  })

  it('측위에 성공하면 좌표를 갱신하고 fallback 상태를 해제한다', async () => {
    stubGeolocation((success) => success(positionOf(35.1796, 129.0756)))
    const { latitude, longitude, isFallbackLocation, locationError, locate } =
      useUserLocation(SEOUL)

    await expect(locate()).resolves.toBe(true)

    expect(latitude.value).toBe(35.1796)
    expect(longitude.value).toBe(129.0756)
    expect(isFallbackLocation.value).toBe(false)
    expect(locationError.value).toBe('')
  })

  it('사이트 권한이 거부된 code 1이면 자물쇠 안내 문구를 채우고 기본 좌표를 유지한다', async () => {
    stubPermissionState('denied')
    stubGeolocation((_success, failure) => failure({ code: 1, message: 'User denied Geolocation' }))
    const { latitude, isFallbackLocation, locationError, locate } = useUserLocation(SEOUL)

    await expect(settleLocate(locate)).resolves.toBe(false)

    expect(locationError.value).toBe(
      '위치 권한이 꺼져 있어요. 주소창의 자물쇠 아이콘에서 위치를 허용해주세요',
    )
    expect(latitude.value).toBe(37.5665)
    expect(isFallbackLocation.value).toBe(true)
  })

  // 회귀 방지: 이슈 #344. 사이트 권한이 granted인데도 OS 위치 서비스가 꺼져 있으면
  // 브라우저는 똑같이 code 1을 준다. 여기서 자물쇠 안내를 하면 이미 허용된 권한을
  // 가리키는 셈이라 사용자가 할 수 있는 조치가 없어진다.
  it('사이트 권한이 granted인 code 1이면 OS 위치 설정을 안내한다', async () => {
    stubPermissionState('granted')
    stubGeolocation((_success, failure) => failure({ code: 1, message: 'User denied Geolocation' }))
    const { locationError, locate } = useUserLocation(SEOUL)

    await settleLocate(locate)

    expect(locationError.value).toBe(
      '기기의 위치 서비스가 꺼져 있어요. 설정에서 위치를 켠 뒤 다시 시도해주세요',
    )
  })

  it('사이트 권한이 prompt인 code 1이면 OS 위치 설정을 안내한다', async () => {
    stubPermissionState('prompt')
    stubGeolocation((_success, failure) => failure({ code: 1, message: 'User denied Geolocation' }))
    const { locationError, locate } = useUserLocation(SEOUL)

    await settleLocate(locate)

    expect(locationError.value).toBe(
      '기기의 위치 서비스가 꺼져 있어요. 설정에서 위치를 켠 뒤 다시 시도해주세요',
    )
  })

  it('인앱 브라우저의 code 1이면 외부 브라우저로 열도록 안내한다', async () => {
    stubUserAgent(
      'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/120 Mobile Safari/537.36 KAKAOTALK 10.4.5',
    )
    stubPermissionState('granted')
    stubGeolocation((_success, failure) => failure({ code: 1, message: 'User denied Geolocation' }))
    const { locationError, locate } = useUserLocation(SEOUL)

    await settleLocate(locate)

    expect(locationError.value).toBe(
      '앱 안에서 열린 화면에서는 위치를 쓸 수 없어요. 크롬이나 사파리로 열어주세요',
    )
  })

  it('Permissions API가 없으면 code 1을 사이트 권한 거부로 안내한다', async () => {
    stubGeolocation((_success, failure) => failure({ code: 1, message: 'User denied Geolocation' }))
    const { locationError, locate } = useUserLocation(SEOUL)

    await settleLocate(locate)

    expect(locationError.value).toBe(
      '위치 권한이 꺼져 있어요. 주소창의 자물쇠 아이콘에서 위치를 허용해주세요',
    )
  })

  it('Permissions API 조회가 실패해도 code 1 안내 문구를 채운다', async () => {
    navigator.permissions = { query: vi.fn().mockRejectedValue(new TypeError('unsupported')) }
    stubGeolocation((_success, failure) => failure({ code: 1, message: 'User denied Geolocation' }))
    const { locationError, locate } = useUserLocation(SEOUL)

    await settleLocate(locate)

    expect(locationError.value).toBe(
      '위치 권한이 꺼져 있어요. 주소창의 자물쇠 아이콘에서 위치를 허용해주세요',
    )
  })

  it('측위가 불가하면(code 2) 네트워크 안내 문구를 채운다', async () => {
    stubGeolocation((_success, failure) => failure({ code: 2, message: 'unavailable' }))
    const { locationError, locate } = useUserLocation(SEOUL)

    await settleLocate(locate)

    expect(locationError.value).toBe('현재 위치를 확인할 수 없어요. 네트워크 연결을 확인해주세요')
  })

  it('타임아웃이면(code 3) 재시도 안내 문구를 채운다', async () => {
    stubGeolocation((_success, failure) => failure({ code: 3, message: 'timeout' }))
    const { locationError, locate } = useUserLocation(SEOUL)

    await settleLocate(locate)

    expect(locationError.value).toBe('위치 확인이 오래 걸려요. 다시 시도해주세요')
  })

  it('알 수 없는 오류에도 기본 안내 문구를 채운다', async () => {
    stubGeolocation((_success, failure) => failure({ message: 'unknown' }))
    const { locationError, locate } = useUserLocation(SEOUL)

    await settleLocate(locate)

    expect(locationError.value).toBe('현재 위치를 확인할 수 없어요')
  })

  it('geolocation 미지원 브라우저면 조회를 시도하지 않고 미지원 문구를 채운다', async () => {
    const { locationError, locate } = useUserLocation(SEOUL)

    await expect(locate()).resolves.toBe(false)

    expect(locationError.value).toBe('이 브라우저는 위치 기능을 지원하지 않아요')
  })

  it('실패 원인을 console.warn으로 남긴다', async () => {
    stubGeolocation((_success, failure) => failure({ code: 3, message: 'timeout' }))
    const { locate } = useUserLocation(SEOUL)

    await settleLocate(locate)

    expect(warnSpy).toHaveBeenCalledWith(
      '[useUserLocation] 위치 조회 실패',
      expect.objectContaining({ code: 3 }),
    )
  })

  // 회귀 방지: 원래 버그의 직접 원인. timeout 5초 + maximumAge 미지정(=0, 캐시 금지)이라
  // 데스크톱 네트워크 측위가 자주 타임아웃됐다.
  it('캐시를 허용하는 넉넉한 옵션으로 위치를 요청한다', async () => {
    const getCurrentPosition = stubGeolocation((success) => success(positionOf(1, 2)))
    const { locate } = useUserLocation(SEOUL)

    await locate()

    expect(getCurrentPosition).toHaveBeenCalledWith(
      expect.any(Function),
      expect.any(Function),
      { timeout: 15000, maximumAge: 600000 },
    )
  })

  // 회귀 방지: 재시도 버튼 연타로 측위가 동시에 여러 번 돌지 않아야 한다.
  it('측위 중에 다시 호출하면 중복 요청하지 않는다', async () => {
    let succeed
    const getCurrentPosition = stubGeolocation((success) => {
      succeed = () => success(positionOf(35.1796, 129.0756))
    })
    const { isLocating, locate } = useUserLocation(SEOUL)

    const firstCall = locate()
    expect(isLocating.value).toBe(true)

    await expect(locate()).resolves.toBe(false)
    expect(getCurrentPosition).toHaveBeenCalledTimes(1)

    succeed()
    await firstCall
    expect(isLocating.value).toBe(false)
  })

  // 회귀 방지: 이슈 #344의 진짜 원인. Chrome(Windows)이 명세를 어기고 오류 콜백을
  // 먼저(실측 7ms) 부른 뒤 성공 콜백에 진짜 좌표를 실어 보낸다(실측 142ms).
  // 첫 오류로 실패를 확정하면 뒤늦게 온 실제 위치를 버리고 기본 좌표에 머문다.
  it('오류 콜백 뒤에 성공 콜백이 오면 실제 좌표를 채택한다', async () => {
    stubPermissionState('granted')
    stubGeolocation((success, failure) => {
      failure({ code: 1, message: 'User denied Geolocation' })
      setTimeout(() => success(positionOf(37.5602, 126.9962)), 135)
    })
    const { latitude, longitude, isFallbackLocation, locationError, locate } =
      useUserLocation(SEOUL)

    await expect(settleLocate(locate)).resolves.toBe(true)

    expect(latitude.value).toBe(37.5602)
    expect(longitude.value).toBe(126.9962)
    expect(isFallbackLocation.value).toBe(false)
    expect(locationError.value).toBe('')
  })

  // 유예는 성공을 기다리는 시간일 뿐, 성공이 끝내 오지 않으면 원래 오류로 실패해야 한다.
  it('오류 뒤에 성공이 오지 않으면 유예 후 실패로 확정한다', async () => {
    stubPermissionState('denied')
    stubGeolocation((_success, failure) => failure({ code: 1, message: 'User denied Geolocation' }))
    const { isFallbackLocation, locationError, locate } = useUserLocation(SEOUL)

    await expect(settleLocate(locate)).resolves.toBe(false)

    expect(isFallbackLocation.value).toBe(true)
    expect(locationError.value).toBe(
      '위치 권한이 꺼져 있어요. 주소창의 자물쇠 아이콘에서 위치를 허용해주세요',
    )
  })

  // 회귀 방지: 한 번 성공한 뒤 재시도가 실패했다고 해서 실제 위치를 기본 좌표로
  // 되돌리거나 fallback 상태로 되돌려선 안 된다.
  it('성공 후 재시도가 실패해도 직전 좌표와 상태를 유지한다', async () => {
    stubGeolocation((success) => success(positionOf(35.1796, 129.0756)))
    const { latitude, longitude, isFallbackLocation, locate } = useUserLocation(SEOUL)
    await locate()

    stubGeolocation((_success, failure) => failure({ code: 3, message: 'timeout' }))
    await expect(settleLocate(locate)).resolves.toBe(false)

    expect(latitude.value).toBe(35.1796)
    expect(longitude.value).toBe(129.0756)
    expect(isFallbackLocation.value).toBe(false)
  })
})
