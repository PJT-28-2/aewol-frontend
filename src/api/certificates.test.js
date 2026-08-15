import { beforeEach, describe, expect, it, vi } from 'vitest'
import api from './index'
import { certificatesApi } from './certificates'

vi.mock('./index', () => ({
  default: {
    post: vi.fn(),
  },
}))

describe('certificatesApi.resyncRegistration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('저장된 등록증 식별자로 재동기화 API를 호출한다', () => {
    certificatesApi.resyncRegistration('pet-1', 'doc-1')

    expect(api.post).toHaveBeenCalledWith('/pets/pet-1/documents/doc-1/resync')
  })
})
