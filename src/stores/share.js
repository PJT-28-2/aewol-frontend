import { defineStore } from 'pinia'
import { shareApi } from '@/api/share'

const MEMBER_AVATAR_CLASSES = [
  'bg-(--color-gold)',
  'bg-(--color-slate-dark)',
  'bg-(--color-olive)',
  'bg-(--color-slate)',
]
const CONTRIBUTION_TONES = [
  ['bg-(--color-navy)', '--color-navy'],
  ['bg-(--color-gold)', '--color-gold'],
  ['bg-(--color-olive)', '--color-olive'],
  ['bg-(--color-slate)', '--color-slate'],
]

const unwrap = (response) => response.data?.data
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
        this.members = (unwrap(membersResponse) ?? []).map((member, index) => ({
          ...member,
          avatarClass: MEMBER_AVATAR_CLASSES[index % MEMBER_AVATAR_CLASSES.length],
        }))
        this.contributions = (unwrap(contributionsResponse) ?? []).map((contribution, index) => {
          const [toneClass, colorToken] = CONTRIBUTION_TONES[index % CONTRIBUTION_TONES.length]
          return { ...contribution, toneClass, colorToken }
        })
        this.activities = unwrap(logsResponse) ?? []
      } catch (error) {
        if (requestId !== this.sharedCareRequestId) return
        this.members = []
        this.contributions = []
        this.activities = []
        this.error = errorMessage(error, '공동 육아 정보를 불러오지 못했어요. 다시 시도해 주세요.')
      } finally {
        if (requestId === this.sharedCareRequestId) this.isLoading = false
      }
    },

    async invite(petId, recipient) {
      this.isInviting = true
      try {
        return unwrap(await shareApi.invite({ petId, recipient, role: 'VIEWER' }))
      } finally {
        this.isInviting = false
      }
    },

    async createLinkInvite(petId) {
      this.isInviting = true
      try {
        return unwrap(await shareApi.createLinkInvite({ petId, role: 'VIEWER' }))
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
