import { expect, test } from '@playwright/test'
import { DEMO, loginAsDemoUser, mockAewolApi } from './helpers/mockAewolApi.js'

test.describe('발표 핵심 시나리오', () => {
  test('이메일 로그인 후 홈에서 이름과 지갑 잔액이 보인다', async ({ page }) => {
    await mockAewolApi(page)
    await loginAsDemoUser(page)

    await expect(page.getByText('MY PET')).toBeVisible()
    await expect(page.getByText(DEMO.petName, { exact: true }).first()).toBeVisible()
    await expect(page.getByText(`${DEMO.memberName}님의 애월지갑`)).toBeVisible()
    await expect(page.getByRole('link', { name: '482,600원' })).toBeVisible()
  })

  test('홈에서 지갑으로 이동하면 같은 잔액이 보인다', async ({ page }) => {
    await mockAewolApi(page)
    await loginAsDemoUser(page)

    await page.getByRole('link', { name: '지갑', exact: true }).click()
    await expect(page.getByText(`${DEMO.memberName}님의 애월지갑`)).toBeVisible()
    await expect(page.getByText('482,600원')).toBeVisible()
  })

  test('잘못된 비밀번호면 로그인 오류가 보인다', async ({ page }) => {
    await mockAewolApi(page, { loginOk: false })
    await page.goto('/login')
    await page.locator('#email').fill(DEMO.email)
    await page.locator('#password').fill('wrong-password')
    await page.getByRole('button', { name: '로그인', exact: true }).click()

    await expect(page.getByRole('alert')).toHaveText('이메일 또는 비밀번호를 확인해 주세요.')
    await expect(page).toHaveURL(/\/login/)
  })
})
