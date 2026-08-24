import { defineStore } from 'pinia'
import { shareApi } from '@/api/share'

// 가족 한 사람에게 색 하나. 아바타와 기여도 도넛이 같은 색을 써야 두 영역을
// 눈으로 이어 볼 수 있다.
//
// 예전에는 아바타와 기여도가 서로 다른 팔레트를 배열 순번으로 나눠 썼다. 그래서
// 같은 사람이 두 곳에서 다른 색으로 보였고, 지출이 없어 기여도 목록에서 빠진
// 가족이 있으면 그 뒤 사람들의 색까지 통째로 밀렸다. 그래서 순번이 아니라
// 회원 id로 색을 고정한다.
//
// 도넛 조각으로 구분되도록 만들어 둔 차트 팔레트를 아바타에도 그대로 쓴다.
// (예전 아바타 팔레트의 --color-gold 와 --color-olive 는 값이 같은 색이라
//  가족이 셋만 돼도 두 명이 같은 색으로 보였다.)
const MEMBER_TONES = [
  ['bg-(--color-chart-leaf)', '--color-chart-leaf'],
  ['bg-(--color-chart-teal)', '--color-chart-teal'],
  ['bg-(--color-chart-lilac)', '--color-chart-lilac'],
  ['bg-(--color-chart-amber)', '--color-chart-amber'],
  ['bg-(--color-chart-sage)', '--color-chart-sage'],
  ['bg-(--color-chart-blue)', '--color-chart-blue'],
]

/**
 * 회원 id로 색을 찾을 수 있는 표를 만든다.
 *
 * <p>기여도 응답에만 있고 멤버 목록에는 없는 사람이 나올 수 있어(탈퇴 등),
 * 조회 시점에 표에 없으면 그 자리에서 다음 색을 내어준다.
 */
function createToneLookup() {
  const assigned = new Map()
  return (memberId) => {
    const key = String(memberId ?? '')
    if (!assigned.has(key)) {
      assigned.set(key, MEMBER_TONES[assigned.size % MEMBER_TONES.length])
    }
    return assigned.get(key)
  }
}

// 백엔드 공통 응답은 { status, message, result } 래퍼라 실제 페이로드는 data.result에 있다
const unwrap = (response) => response.data?.result
const errorMessage = (error, fallback) => error.response?.data?.message || fallback

export const useShareStore = defineStore('share', {
  state: () => ({
    // 반려동물을 빠르게 바꿀 때 늦게 도착한 이전 응답이 최신 상태를 덮어쓰지 않도록
    // 요청마다 순번을 매기고 마지막 요청만 상태를 갱신한다.
    sharedCareRequestId: 0,
    pets: [],
    members: [],
    contributions: [],
    activities: [],
    isLoading: false,
    isInviting: false,
    error: '',
  }),

  getters: {
    /** 대표 보호자(목록에서 ADMIN)와 MANAGER만 일기를 쓸 수 있다. VIEWER는 조회만. */
    canWriteDiary: (state) => (memberId) => {
      if (!memberId) return false
      const me = state.members.find((member) => String(member.id) === String(memberId))
      const role = String(me?.role ?? '').toUpperCase()
      return role === 'ADMIN' || role === 'MANAGER'
    },
  },

  actions: {
    async fetchPets() {
      this.isLoading = true
      this.error = ''
      try {
        this.pets = unwrap(await shareApi.getPets()) ?? []
        return this.pets
      } catch (error) {
        this.pets = []
        this.error = errorMessage(error, '반려동물 정보를 불러오지 못했어요. 다시 시도해 주세요.')
        return []
      } finally {
        this.isLoading = false
      }
    },

    async fetchSharedCare(petId) {
      if (!petId) return
      const requestId = ++this.sharedCareRequestId
      this.isLoading = true
      this.error = ''
      try {
        const [membersResponse, contributionsResponse, logsResponse] = await Promise.all([
          shareApi.getMembers(petId),
          shareApi.getContributions(petId),
          shareApi.getLogs(petId),
        ])
        if (requestId !== this.sharedCareRequestId) return
        // 멤버 목록을 먼저 훑어 색을 정한다. 기여도는 그 색을 id로 찾아 쓰기만 한다.
        const toneOf = createToneLookup()
        this.members = (unwrap(membersResponse) ?? []).map((member) => {
          const [avatarClass, colorToken] = toneOf(member.id)
          return { ...member, avatarClass, colorToken }
        })
        this.contributions = (unwrap(contributionsResponse) ?? []).map((contribution) => {
          const [toneClass, colorToken] = toneOf(contribution.id)
          return { ...contribution, toneClass, colorToken }
        })
        this.activities = unwrap(logsResponse) ?? []
      } catch (error) {
        if (requestId !== this.sharedCareRequestId) return
        this.members = []
        this.contributions = []
        this.activities = []
        this.error = errorMessage(error, '공동육아 정보를 불러오지 못했어요. 다시 시도해 주세요.')
      } finally {
        if (requestId === this.sharedCareRequestId) this.isLoading = false
      }
    },

    // 받는 사람을 지정하지 않는 대신 유효시간으로 위험을 줄인다. 시간이 유일한
    // 방어선이라 호출부가 반드시 값을 정해서 넘기게 둔다.
    async createLinkInvite(petId, expiresInMinutes) {
      this.isInviting = true
      try {
        return unwrap(await shareApi.createLinkInvite({
          petId,
          role: 'VIEWER',
          expiresInMinutes,
        }))
      } finally {
        this.isInviting = false
      }
    },

    async getInvite(inviteCode) {
      return unwrap(await shareApi.getInvite(inviteCode))
    },

    async joinSharedCare(inviteCode) {
      await shareApi.acceptInvite(inviteCode)
      await this.fetchPets()
      return true
    },
  },
})
