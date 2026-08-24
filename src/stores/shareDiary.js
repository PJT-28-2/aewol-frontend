import { defineStore } from 'pinia'
import { shareApi } from '@/api/share'

// 작성자 아바타 색은 share 스토어의 구성원 목록과 같은 팔레트를 쓴다.
const AUTHOR_AVATAR_CLASSES = [
  'bg-(--color-gold)',
  'bg-(--color-slate-dark)',
  'bg-(--color-olive)',
  'bg-(--color-slate)',
]

// 백엔드 공통 응답은 { status, message, result } 래퍼라 실제 페이로드는 data.result에 있다
const unwrap = (response) => response.data?.result
const errorMessage = (error, fallback) => error.response?.data?.message || fallback

/** 같은 작성자는 목록 어디에서나 같은 색을 갖도록 회원 ID로 색을 고정한다. */
function avatarClassOf(authorId) {
  const text = String(authorId ?? '')
  let hash = 0
  for (let index = 0; index < text.length; index += 1) {
    hash = (hash * 31 + text.charCodeAt(index)) % AUTHOR_AVATAR_CLASSES.length
  }
  return AUTHOR_AVATAR_CLASSES[hash]
}

/** `2026-08` 형태로 맞춘다. */
function toYearMonth(year, month) {
  return `${year}-${String(month).padStart(2, '0')}`
}

export const useShareDiaryStore = defineStore('shareDiary', {
  state: () => {
    const today = new Date()
    return {
      // 월을 빠르게 넘길 때 늦게 도착한 이전 응답이 최신 상태를 덮어쓰지 않도록
      // 요청마다 순번을 매기고 마지막 요청만 상태를 갱신한다.
      diaryRequestId: 0,
      petId: '',
      year: today.getFullYear(),
      month: today.getMonth() + 1,
      diaries: [],
      isLoading: false,
      isSubmitting: false,
      error: '',
    }
  },

  getters: {
    yearMonth: (state) => toYearMonth(state.year, state.month),

    /** 화면이 날짜 헤더 단위로 그릴 수 있게 같은 날짜끼리 묶는다. */
    diariesByDate: (state) => {
      const groups = []
      for (const diary of state.diaries) {
        const last = groups[groups.length - 1]
        if (last && last.date === diary.diaryDate) {
          last.items.push(diary)
        } else {
          groups.push({ date: diary.diaryDate, items: [diary] })
        }
      }
      return groups
    },

    /** 다음 달이 미래면 이동할 수 없다. */
    canGoNextMonth: (state) => {
      const today = new Date()
      return state.year < today.getFullYear()
        || (state.year === today.getFullYear() && state.month < today.getMonth() + 1)
    },
  },

  actions: {
    async fetchDiaries(petId = this.petId) {
      if (!petId) return
      this.petId = petId
      const requestId = ++this.diaryRequestId
      this.isLoading = true
      this.error = ''
      try {
        const result = unwrap(await shareApi.getDiaries(petId, this.yearMonth)) ?? []
        if (requestId !== this.diaryRequestId) return
        this.diaries = result.map((diary) => ({
          ...diary,
          avatarClass: avatarClassOf(diary.authorId),
        }))
      } catch (error) {
        if (requestId !== this.diaryRequestId) return
        this.diaries = []
        this.error = errorMessage(error, '일기를 불러오지 못했어요. 다시 시도해 주세요.')
      } finally {
        if (requestId === this.diaryRequestId) this.isLoading = false
      }
    },

    async moveMonth(offset) {
      const moved = new Date(this.year, this.month - 1 + offset, 1)
      this.year = moved.getFullYear()
      this.month = moved.getMonth() + 1
      await this.fetchDiaries()
    },

    async createDiary({ petId, diaryDate, content, image }) {
      this.isSubmitting = true
      try {
        const created = unwrap(await shareApi.createDiary({ petId, diaryDate, content, image }))
        // 작성한 날짜가 보고 있던 달과 다르면 그 달로 옮겨 방금 쓴 글이 보이게 한다.
        const [year, month] = diaryDate.split('-').map(Number)
        this.petId = petId
        this.year = year
        this.month = month
        await this.fetchDiaries(petId)
        return created
      } finally {
        this.isSubmitting = false
      }
    },

    /**
     * 사진은 바꾸지 않는다. 서버 PUT이 날짜와 내용만 받기 때문이다.
     *
     * version을 함께 보내 그 사이 다른 곳에서 저장됐는지 서버가 판정하게 한다. 409면
     * 화면이 다시 불러오도록 안내해야 하므로 여기서 삼키지 않고 그대로 올려보낸다.
     */
    async updateDiary(diaryId, { diaryDate, content, version }) {
      this.isSubmitting = true
      try {
        const updated = unwrap(await shareApi.updateDiary(diaryId, { diaryDate, content, version }))
        // 날짜를 바꿨으면 그 달로 옮겨 수정한 글이 보이게 한다.
        const [year, month] = diaryDate.split('-').map(Number)
        this.year = year
        this.month = month
        await this.fetchDiaries()
        return updated
      } finally {
        this.isSubmitting = false
      }
    },

    /**
     * 공개 여부 전환. 권한은 서버가 최종 판정한다.
     *
     * 화면에서 버튼을 감추는 것은 편의일 뿐이고, 실제 차단은 서버 몫이다. 그래서 403/409를
     * 삼키지 않고 그대로 올려보내 화면이 사유를 보여줄 수 있게 한다.
     */
    async changeDiaryVisibility(diaryId, visibility) {
      this.isSubmitting = true
      try {
        const updated = unwrap(await shareApi.changeDiaryVisibility(diaryId, visibility))
        const index = this.diaries.findIndex((diary) => diary.id === diaryId)
        if (index !== -1) {
          this.diaries[index] = { ...this.diaries[index], ...updated }
        }
        return updated
      } finally {
        this.isSubmitting = false
      }
    },

    /** 임계치에 닿아 숨겨진 글만 목록에서 뺀다. 접수만 된 글은 그대로 둔다. */
    async reportDiary(diaryId, reason) {
      this.isSubmitting = true
      try {
        const result = unwrap(await shareApi.reportDiary(diaryId, reason))
        if (result?.hidden) {
          this.diaries = this.diaries.filter((diary) => diary.id !== diaryId)
        }
        return result
      } finally {
        this.isSubmitting = false
      }
    },

    async deleteDiary(diaryId) {
      this.isSubmitting = true
      try {
        await shareApi.deleteDiary(diaryId)
        this.diaries = this.diaries.filter((diary) => diary.id !== diaryId)
      } finally {
        this.isSubmitting = false
      }
    },
  },
})
