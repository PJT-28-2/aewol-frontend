import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, nextTick } from 'vue'
import { createPinia, setActivePinia } from 'pinia'

const mocks = vi.hoisted(() => ({ reportDiary: vi.fn() }))

vi.mock('@/stores/shareDiary', async () => {
  const { defineStore } = await import('pinia')
  return {
    useShareDiaryStore: defineStore('shareDiary', {
      state: () => ({ isSubmitting: false }),
      actions: { reportDiary: mocks.reportDiary },
    }),
  }
})

import DiaryReportDialog from './DiaryReportDialog.vue'

let app
let host

const flush = async () => {
  for (let i = 0; i < 8; i += 1) await Promise.resolve()
  await nextTick()
}

const mount = async () => {
  host = document.createElement('div')
  document.body.appendChild(host)
  app = createApp(DiaryReportDialog, { diaryId: 'd-1' })
  app.use(createPinia())
  app.mount(host)
  await flush()
}

const submitButton = () =>
  [...host.querySelectorAll('button')].find((button) => button.textContent.includes('신고하기'))

const pickReason = async (value) => {
  const radio = host.querySelector(`input[value="${value}"]`)
  radio.checked = true
  radio.dispatchEvent(new Event('change'))
  await flush()
}

describe('DiaryReportDialog', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    mocks.reportDiary.mockResolvedValue({ reportId: '1', inquiryNumber: 'AEW-20260821-0055', hidden: true })
  })

  afterEach(() => {
    app?.unmount()
    host?.remove()
  })

  it('사유를 고르기 전에는 신고할 수 없다', async () => {
    await mount()

    expect(submitButton().disabled).toBe(true)
  })

  it('고른 사유를 그대로 보낸다', async () => {
    await mount()
    await pickReason('PRIVACY')

    submitButton().click()
    await flush()

    expect(mocks.reportDiary).toHaveBeenCalledWith('d-1', 'PRIVACY')
  })

  // 신고했는데 아무 반응이 없으면 사용자가 다시 누른다.
  it('접수 후 처리 결과와 접수번호를 알려준다', async () => {
    await mount()
    await pickReason('SPAM')

    submitButton().click()
    await flush()

    expect(host.textContent).toContain('신고를 접수했어요')
    expect(host.textContent).toContain('바로 보이지 않게 처리했어요')
    // 개별 통지를 보장할 수 없으므로 결과를 알려준다고 쓰지 않는다.
    expect(host.textContent).not.toContain('결과를 알려드릴게요')
    expect(host.textContent).toContain('AEW-20260821-0055')
  })

  // 문의 생성이 실패해도 신고 자체는 접수된다. 접수번호만 없다.
  it('접수번호가 없어도 접수 사실은 알려준다', async () => {
    mocks.reportDiary.mockResolvedValue({ reportId: '1', inquiryNumber: null, hidden: true })
    await mount()
    await pickReason('ETC')

    submitButton().click()
    await flush()

    expect(host.textContent).toContain('신고를 접수했어요')
    expect(host.textContent).not.toContain('접수번호')
  })

  it('이미 신고한 글이면 사유를 보여준다', async () => {
    mocks.reportDiary.mockRejectedValue({
      response: { data: { message: '이미 신고한 게시물이에요. 처리 결과를 기다려 주세요.' } },
    })
    await mount()
    await pickReason('ABUSE')

    submitButton().click()
    await flush()

    expect(host.textContent).toContain('이미 신고한 게시물이에요')
  })
})
