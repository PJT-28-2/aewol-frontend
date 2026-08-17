import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useUserLocation } from './useUserLocation'

const SEOUL = { defaultLatitude: 37.5665, defaultLongitude: 126.978 }

function positionOf(latitude, longitude) {
  return { coords: { latitude, longitude } }
}

/** getCurrentPosition의 성공/실패 콜백을 원하는 쪽으로 즉시 호출하는 스텁을 심어요. */
function stubGeolocation(impl) {
  const getCurrentPosition = vi.fn(impl)
  navigator.geolocation = { getCurrentPosition }
  return getCurrentPosition
}

describe('useUserLocation', () => {
  let warnSpy

  beforeEach(() => {
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    warnSpy.mockRestore()
    delete navigator.geolocation
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

  it('권한이 거부되면(code 1) 권한 안내 문구를 채우고 기본 좌표를 유지한다', async () => {
    stubGeolocation((_success, failure) => failure({ code: 1, message: 'User denied Geolocation' }))
    const { latitude, isFallbackLocation, locationError, locate } = useUserLocation(SEOUL)

    await expect(locate()).resolves.toBe(false)

    expect(locationError.value).toBe(
      '위치 권한이 꺼져 있어요. 주소창의 자물쇠 아이콘에서 위치를 허용해주세요',
    )
    expect(latitude.value).toBe(37.5665)
    expect(isFallbackLocation.value).toBe(true)
  })

  it('측위가 불가하면(code 2) 네트워크 안내 문구를 채운다', async () => {
    stubGeolocation((_success, failure) => failure({ code: 2, message: 'unavailable' }))
    const { locationError, locate } = useUserLocation(SEOUL)

    await locate()

    expect(locationError.value).toBe('현재 위치를 확인할 수 없어요. 네트워크 연결을 확인해주세요')
  })

  it('타임아웃이면(code 3) 재시도 안내 문구를 채운다', async () => {
    stubGeolocation((_success, failure) => failure({ code: 3, message: 'timeout' }))
    const { locationError, locate } = useUserLocation(SEOUL)

    await locate()

    expect(locationError.value).toBe('위치 확인이 오래 걸려요. 다시 시도해주세요')
  })

  it('알 수 없는 오류에도 기본 안내 문구를 채운다', async () => {
    stubGeolocation((_success, failure) => failure({ message: 'unknown' }))
    const { locationError, locate } = useUserLocation(SEOUL)

    await locate()

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

    await locate()

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

  // 회귀 방지: 한 번 성공한 뒤 재시도가 실패했다고 해서 실제 위치를 기본 좌표로
  // 되돌리거나 fallback 상태로 되돌려선 안 된다.
  it('성공 후 재시도가 실패해도 직전 좌표와 상태를 유지한다', async () => {
    stubGeolocation((success) => success(positionOf(35.1796, 129.0756)))
    const { latitude, longitude, isFallbackLocation, locate } = useUserLocation(SEOUL)
    await locate()

    stubGeolocation((_success, failure) => failure({ code: 3, message: 'timeout' }))
    await expect(locate()).resolves.toBe(false)

    expect(latitude.value).toBe(35.1796)
    expect(longitude.value).toBe(129.0756)
    expect(isFallbackLocation.value).toBe(false)
  })
})
