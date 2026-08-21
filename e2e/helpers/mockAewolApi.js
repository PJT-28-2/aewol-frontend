/** 발표 화면용 고정 데모 데이터. 실제 백엔드를 부르지 않는다. */
export const DEMO = {
  memberName: '이파리',
  petName: '포리',
  balance: 482600,
  email: 'demo@aewol.com',
  password: 'aewol1234',
}

function demoJwt() {
  const encode = (value) => Buffer.from(JSON.stringify(value)).toString('base64url')
  return `${encode({ alg: 'none', typ: 'JWT' })}.${encode({ sub: '1', role: 'USER' })}.demo`
}

function json(route, result, status = 200, message = 'success') {
  return route.fulfill({
    status: status >= 400 ? status : 200,
    contentType: 'application/json',
    body: JSON.stringify({ status, message, result }),
  })
}

/**
 * /api 요청을 가로채 시연용 응답을 돌려준다.
 * 백엔드·Toss·카카오 없이 로그인→홈→지갑 경로를 재현한다.
 */
export async function mockAewolApi(page, { loginOk = true } = {}) {
  const token = demoJwt()

  await page.route('**/api/**', async (route) => {
    const { pathname } = new URL(route.request().url())
    if (!pathname.startsWith('/api/')) {
      return route.continue()
    }
    const method = route.request().method()

    if (method === 'POST' && pathname === '/api/auth/login') {
      if (!loginOk) {
        return json(route, null, 401, '이메일 또는 비밀번호를 확인해 주세요.')
      }
      return json(route, { accessToken: token, refreshToken: 'demo-refresh' })
    }

    if (method === 'GET' && pathname === '/api/users/me') {
      return json(route, {
        id: '1',
        name: DEMO.memberName,
        hasSimplePassword: true,
        provider: 'LOCAL',
      })
    }

    if (method === 'GET' && pathname === '/api/pets') {
      return json(route, [
        { petId: '1', id: '1', name: DEMO.petName, species: 'DOG' },
      ])
    }

    if (method === 'GET' && pathname === '/api/dashboard/summary') {
      return json(route, {
        walletBalance: DEMO.balance,
        monthlySpend: { totalAmount: 73100, changeRate: -12 },
      })
    }

    if (method === 'GET' && pathname === '/api/home/insights') {
      return json(route, [])
    }

    if (method === 'GET' && pathname === '/api/wallet') {
      return json(route, {
        walletId: '1',
        memberId: '1',
        walletBalance: DEMO.balance,
      })
    }

    if (method === 'GET' && pathname.startsWith('/api/transactions')) {
      return json(route, [])
    }

    return json(route, null)
  })
}

export async function loginAsDemoUser(page) {
  await page.goto('/login')
  await page.locator('#email').fill(DEMO.email)
  await page.locator('#password').fill(DEMO.password)
  await page.getByRole('button', { name: '로그인', exact: true }).click()
  await page.getByRole('heading', { name: `안녕하세요, ${DEMO.memberName}님` }).waitFor()
}
