export const mockSupportPrograms = [
  {
    id: 'seoul-neuter-support',
    title: '서울시 반려동물 중성화 지원',
    summary: '모든 조건 충족 · 최대 15만원',
    agency: '서울시 동물복지과',
    benefit: '최대 15만원',
    period: '2026년 12월 31일까지',
    eligible: true,
    conditions: [
      {
        met: true,
        title: '반려동물 등록 완료',
        description: '국가동물보호정보시스템에 등록되어 있어요.',
      },
      {
        met: true,
        title: '서울시 거주자',
        description: '프로필상 거주지 조건을 충족하고 있어요.',
      },
      {
        met: true,
        title: '중성화 조건 충족',
        description: '지원 대상 동물 기준을 충족하고 있어요.',
      },
    ],
  },
  {
    id: 'seoul-puppy-vaccine',
    title: '강아지 예방접종비 지원사업',
    summary: '만 2세 이하 반려견 대상',
    agency: '서울시 동물복지과',
    benefit: '최대 10만원',
    period: '예산 소진 시까지',
    eligible: true,
    conditions: [
      {
        met: true,
        title: '반려동물 등록 완료',
        description: '국가동물보호정보시스템에 등록되어 있어요.',
      },
      {
        met: true,
        title: '서울시 거주자',
        description: '프로필상 거주지 조건을 충족하고 있어요.',
      },
      {
        met: true,
        title: '만 2세 이하 반려견',
        description: '등록된 반려견의 연령 조건을 충족하고 있어요.',
      },
    ],
  },
  {
    id: 'jeju-adoption-support',
    title: '유기동물 입양비 지원',
    summary: '입양 후 6개월 이내 신청',
    agency: '제주도 동물복지과',
    benefit: '최대 20만원',
    period: '입양일로부터 6개월 이내',
    eligible: false,
    conditions: [
      {
        met: true,
        title: '반려동물 등록 완료',
        description: '국가동물보호정보시스템에 등록되어 있어요.',
      },
      {
        met: true,
        title: '제주도 거주자',
        description: '프로필상 거주지 조건을 충족하고 있어요.',
      },
      {
        met: false,
        title: '입양 후 6개월 이내 신청',
        description: '입양일로부터 8개월이 지나 신청 기간이 지났어요.',
      },
    ],
  },
]

export function getMockSupportProgram(programId) {
  return mockSupportPrograms.find((program) => program.id === programId)
}
