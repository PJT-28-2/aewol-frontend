// 거리 표기는 지도 마커 라벨과 병원 카드 양쪽에서 쓰므로 화면마다 구현하지 않고 여기서 관리한다.

// 1km 미만은 m 단위 정수, 그 이상은 소수 첫째 자리 km로 표기한다. (예: 620m, 1.1km)
export function formatDistance(distanceKm) {
  const km = Number(distanceKm) || 0
  if (km < 1) return `${Math.round(km * 1000)}m`
  return `${km.toFixed(1)}km`
}

// 차량 이동 시간 어림값. 도심 평균 시속 25km 기준이고, 실제 경로/교통량은 반영하지 않는다.
// 응급 상황에서 "얼마나 걸리나"를 가늠하는 용도이므로 최소 1분으로 올림한다.
const AVERAGE_DRIVING_SPEED_KMH = 25

export function formatDrivingTime(distanceKm) {
  const km = Number(distanceKm) || 0
  const minutes = Math.max(1, Math.round((km / AVERAGE_DRIVING_SPEED_KMH) * 60))
  return `차로 ${minutes}분`
}
