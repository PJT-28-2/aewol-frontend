export const MOCK_INVITE_CODE = 'share-preview'

export const mockSharePets = [
  {
    id: 'pet-bori',
    name: '보리',
    type: 'dog',
    species: '말티푸',
  },
  {
    id: 'pet-maru',
    name: '마루',
    type: 'cat',
    species: '코리안숏헤어',
  },
]

const mockSharedCareByPet = {
  'pet-bori': {
    members: [
      {
        id: 'member-aewol',
        name: '김애월',
        role: '대표 보호자',
        avatarClass: 'bg-(--color-navy)',
        badgeClass: 'bg-(--color-info-surface) text-(--color-navy)',
      },
      {
        id: 'member-jiwon',
        name: '이지원',
        role: '함께 돌봄',
        avatarClass: 'bg-(--color-gold)',
        badgeClass: 'bg-(--color-olive-surface) text-(--color-olive-dark)',
      },
      {
        id: 'member-minsu',
        name: '박민수',
        role: '기록 담당',
        avatarClass: 'bg-(--color-olive)',
        badgeClass: 'bg-(--color-gold-surface) text-(--color-gold-dark)',
      },
      {
        id: 'member-yujin',
        name: '최유진',
        role: '가족 구성원',
        avatarClass: 'bg-(--color-slate)',
        badgeClass: 'bg-(--color-slate-light) text-(--color-slate-dark)',
      },
    ],
    contributions: [
      {
        id: 'contribution-aewol',
        name: '김애월',
        amount: 180000,
        percentage: 45,
        barClass: 'w-[45%]',
        toneClass: 'bg-(--color-navy)',
        colorToken: '--color-navy',
      },
      {
        id: 'contribution-jiwon',
        name: '이지원',
        amount: 120000,
        percentage: 30,
        barClass: 'w-[30%]',
        toneClass: 'bg-(--color-gold)',
        colorToken: '--color-gold',
      },
      {
        id: 'contribution-minsu',
        name: '박민수',
        amount: 60000,
        percentage: 15,
        barClass: 'w-[15%]',
        toneClass: 'bg-(--color-olive)',
        colorToken: '--color-olive',
      },
      {
        id: 'contribution-yujin',
        name: '최유진',
        amount: 40000,
        percentage: 10,
        barClass: 'w-[10%]',
        toneClass: 'bg-(--color-slate)',
        colorToken: '--color-slate',
      },
    ],
    activities: [
      {
        id: 'activity-1',
        title: '이번 달 병원비를 함께 정산했어요',
        description: '정기 검진 · 72,000원',
        time: '오늘',
      },
      {
        id: 'activity-2',
        title: '이지원님이 돌봄 기록을 남겼어요',
        description: '오후 산책 30분 완료',
        time: '어제',
      },
      {
        id: 'activity-3',
        title: '박민수님이 공동육아에 참여했어요',
        description: '기록 담당 권한',
        time: '3일 전',
      },
    ],
  },
  'pet-maru': {
    members: [
      {
        id: 'member-aewol',
        name: '김애월',
        role: '대표 보호자',
        avatarClass: 'bg-(--color-navy)',
        badgeClass: 'bg-(--color-info-surface) text-(--color-navy)',
      },
      {
        id: 'member-hana',
        name: '최하나',
        role: '함께 돌봄',
        avatarClass: 'bg-(--color-slate-dark)',
        badgeClass: 'bg-(--color-slate-light) text-(--color-slate-dark)',
      },
    ],
    contributions: [
      {
        id: 'contribution-aewol',
        name: '김애월',
        amount: 96000,
        percentage: 60,
        barClass: 'w-[60%]',
        toneClass: 'bg-(--color-navy)',
        colorToken: '--color-navy',
      },
      {
        id: 'contribution-hana',
        name: '최하나',
        amount: 64000,
        percentage: 40,
        barClass: 'w-[40%]',
        toneClass: 'bg-(--color-slate-dark)',
        colorToken: '--color-slate-dark',
      },
    ],
    activities: [
      {
        id: 'activity-4',
        title: '사료 구매 비용을 정산했어요',
        description: '공동 구매 · 48,000원',
        time: '오늘',
      },
      {
        id: 'activity-5',
        title: '최하나님이 공동육아에 참여했어요',
        description: '함께 돌봄 권한',
        time: '지난주',
      },
    ],
  },
}

export function getMockSharedCare(petId) {
  return mockSharedCareByPet[petId]
}

export function buildMockInviteLink(origin = window.location.origin) {
  return `${origin}/share/join?invite=${MOCK_INVITE_CODE}`
}
