export function diaryReportResolutionLabel(resolution) {
  if (resolution === 'RESTORE') return '게시물 복원 완료'
  if (resolution === 'DISMISS') return '게시물 공개 유지 완료'
  return '게시물 숨김 유지 완료'
}
