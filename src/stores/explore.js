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
    // 느린 이전 요청이 최신 목록을 덮지 않게 한다. fetchFeed가 올라가고 fetchMore는
    // 그 세대가 그대로일 때만 이어 붙인다.
    feedRequestId: 0,
    profileRequestId: 0,

    // 공개 게시물 상세
    post: null,
    isPostLoading: false,
    postError: '',

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
      const requestId = this.feedRequestId + 1
      this.feedRequestId = requestId
      this.isLoading = true
      this.isLoadingMore = false
      this.error = ''
      try {
        const result = unwrap(await exploreApi.getFeed())
        if (requestId !== this.feedRequestId) return
        this.posts = result?.posts ?? []
        this.nextCursor = result?.nextCursor ?? null
      } catch (error) {
        if (requestId !== this.feedRequestId) return
        this.posts = []
        this.nextCursor = null
        this.error = errorMessage(error, '피드를 불러오지 못했어요. 다시 시도해 주세요.')
      } finally {
        if (requestId === this.feedRequestId) this.isLoading = false
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
      const requestId = this.feedRequestId
      this.isLoadingMore = true
      try {
        const result = unwrap(await exploreApi.getFeed({ cursor: this.nextCursor }))
        if (requestId !== this.feedRequestId) return
        this.posts = [...this.posts, ...(result?.posts ?? [])]
        this.nextCursor = result?.nextCursor ?? null
      } catch (error) {
        if (requestId !== this.feedRequestId) return
        // 이어 붙이기 실패는 이미 보고 있는 목록을 지우지 않는다. 커서를 그대로 둬서
        // 다음 스크롤에 다시 시도된다.
        this.error = errorMessage(error, '다음 게시물을 불러오지 못했어요.')
      } finally {
        if (requestId === this.feedRequestId) this.isLoadingMore = false
      }
    },

    async fetchPost(diaryId) {
      this.isPostLoading = true
      this.postError = ''
      this.post = null
      try {
        this.post = unwrap(await exploreApi.getPost(diaryId)) ?? null
      } catch (error) {
        // 신고로 내려갔거나 작성자가 비공개로 되돌린 글일 수 있다. 404를 그대로 알린다.
        this.postError = errorMessage(error, '게시물을 볼 수 없어요. 삭제되었거나 비공개로 바뀌었을 수 있어요.')
      } finally {
        this.isPostLoading = false
      }
    },

    async fetchPetProfile(petId) {
      const requestId = this.profileRequestId + 1
      this.profileRequestId = requestId
      this.isProfileLoading = true
      this.isLoadingMore = false
      this.profileError = ''
      try {
        const [profile, posts] = await Promise.all([
          exploreApi.getPetProfile(petId),
          exploreApi.getPetPosts(petId),
        ])
        if (requestId !== this.profileRequestId) return
        this.profile = unwrap(profile) ?? null
        const result = unwrap(posts)
        this.profilePosts = result?.posts ?? []
        this.profileNextCursor = result?.nextCursor ?? null
      } catch (error) {
        if (requestId !== this.profileRequestId) return
        this.profile = null
        this.profilePosts = []
        this.profileNextCursor = null
        this.profileError = errorMessage(error, '프로필을 불러오지 못했어요. 다시 시도해 주세요.')
      } finally {
        if (requestId === this.profileRequestId) this.isProfileLoading = false
      }
    },

    async fetchMorePetPosts(petId) {
      if (this.isLoadingMore || this.profileNextCursor == null) return
      const requestId = this.profileRequestId
      this.isLoadingMore = true
      try {
        const result = unwrap(await exploreApi.getPetPosts(petId, { cursor: this.profileNextCursor }))
        if (requestId !== this.profileRequestId) return
        this.profilePosts = [...this.profilePosts, ...(result?.posts ?? [])]
        this.profileNextCursor = result?.nextCursor ?? null
      } catch (error) {
        if (requestId !== this.profileRequestId) return
        this.profileError = errorMessage(error, '다음 게시물을 불러오지 못했어요.')
      } finally {
        if (requestId === this.profileRequestId) this.isLoadingMore = false
      }
    },
  },
})
