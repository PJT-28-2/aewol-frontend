import { defineStore } from 'pinia'
import { exploreApi } from '@/api/explore'

// 백엔드 공통 응답은 { status, message, result } 래퍼라 실제 페이로드는 data.result에 있다
const unwrap = (response) => response.data?.result
const errorMessage = (error, fallback) => error.response?.data?.message || fallback

export const useExploreStore = defineStore('explore', {
  state: () => ({
    // 탐색 그리드
    posts: [],
    nextCursor: null,
    isLoading: false,
    isLoadingMore: false,
    error: '',

    // 반려동물 프로필
    profile: null,
    profilePosts: [],
    profileNextCursor: null,
    isProfileLoading: false,
    profileError: '',
  }),

  getters: {
    hasMore: (state) => state.nextCursor != null,
    profileHasMore: (state) => state.profileNextCursor != null,
  },

  actions: {
    /** 첫 장. 다시 부르면 목록을 갈아끼운다. */
    async fetchFeed() {
      this.isLoading = true
      this.error = ''
      try {
        const result = unwrap(await exploreApi.getFeed())
        this.posts = result?.posts ?? []
        this.nextCursor = result?.nextCursor ?? null
      } catch (error) {
        this.posts = []
        this.nextCursor = null
        this.error = errorMessage(error, '피드를 불러오지 못했어요. 다시 시도해 주세요.')
      } finally {
        this.isLoading = false
      }
    },

    /**
     * 다음 장을 이어 붙인다.
     *
     * 무한 스크롤은 같은 커서로 두 번 요청하기 쉽다(스크롤 이벤트가 연달아 뜬다).
     * isLoadingMore로 막지 않으면 같은 글이 두 번 붙는다.
     */
    async fetchMore() {
      if (this.isLoadingMore || this.nextCursor == null) return
      this.isLoadingMore = true
      try {
        const result = unwrap(await exploreApi.getFeed({ cursor: this.nextCursor }))
        this.posts = [...this.posts, ...(result?.posts ?? [])]
        this.nextCursor = result?.nextCursor ?? null
      } catch (error) {
        // 이어 붙이기 실패는 이미 보고 있는 목록을 지우지 않는다. 커서를 그대로 둬서
        // 다음 스크롤에 다시 시도된다.
        this.error = errorMessage(error, '다음 게시물을 불러오지 못했어요.')
      } finally {
        this.isLoadingMore = false
      }
    },

    async fetchPetProfile(petId) {
      this.isProfileLoading = true
      this.profileError = ''
      try {
        const [profile, posts] = await Promise.all([
          exploreApi.getPetProfile(petId),
          exploreApi.getPetPosts(petId),
        ])
        this.profile = unwrap(profile) ?? null
        const result = unwrap(posts)
        this.profilePosts = result?.posts ?? []
        this.profileNextCursor = result?.nextCursor ?? null
      } catch (error) {
        this.profile = null
        this.profilePosts = []
        this.profileNextCursor = null
        this.profileError = errorMessage(error, '프로필을 불러오지 못했어요. 다시 시도해 주세요.')
      } finally {
        this.isProfileLoading = false
      }
    },

    async fetchMorePetPosts(petId) {
      if (this.isLoadingMore || this.profileNextCursor == null) return
      this.isLoadingMore = true
      try {
        const result = unwrap(await exploreApi.getPetPosts(petId, { cursor: this.profileNextCursor }))
        this.profilePosts = [...this.profilePosts, ...(result?.posts ?? [])]
        this.profileNextCursor = result?.nextCursor ?? null
      } catch (error) {
        this.profileError = errorMessage(error, '다음 게시물을 불러오지 못했어요.')
      } finally {
        this.isLoadingMore = false
      }
    },
  },
})
