import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import router from './index'

const getKakaoAdditionalInfoGuard = () => {
  const route = router
    .getRoutes()
    .find(({ name }) => name === 'KakaoAdditionalInfo')
  return route.beforeEnter
}

describe('Kakao 추가정보 route', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    setActivePinia(createPinia())
  })

  it('registrationToken이 없으면 로그인 화면으로 보낸다', () => {
    expect(getKakaoAdditionalInfoGuard()()).toBe('/login')
  })

  it('sessionStorage에서 registrationToken을 복구하면 접근을 허용한다', () => {
    sessionStorage.setItem(
      'kakaoRegistrationToken',
      'restored-registration-token',
    )
    setActivePinia(createPinia())

    expect(getKakaoAdditionalInfoGuard()()).toBeUndefined()
  })
})
