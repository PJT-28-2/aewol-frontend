import api from './index'

/**
 * 멍스타그램 탐색 API.
 *
 * 계정 주체가 사람이 아니라 반려동물이라, 응답에 작성자 이름이나 회원 id가 들어오지
 * 않는다. 화면에서도 사람 정보를 만들어 붙이지 않는다.
 *
 * 목록은 커서 페이징이다. 응답의 nextCursor를 그대로 다음 요청에 실어 보내고,
 * null이면 마지막 장이다.
 */
export const exploreApi = {
  /** result: { posts: [{ diaryId, petId, petName, imageUrl, content, diaryDate, createdAt }], nextCursor } */
  getFeed({ cursor, size } = {}) {
    return api.get('/explore/diaries', { params: { cursor, size } })
  },

  getPetPosts(petId, { cursor, size } = {}) {
    return api.get(`/explore/pets/${petId}/diaries`, { params: { cursor, size } })
  },

  /** result: { petId, name, species, breed, profileImage, instagramId, postCount } */
  getPetProfile(petId) {
    return api.get(`/explore/pets/${petId}/profile`)
  },
}
