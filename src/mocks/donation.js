export const mockDonationPot = {
  balance: 12400,
  monthlySaved: 3200,
  impactMessage: '유기동물 3마리를 도울 수 있어요',
}

export const donationCategories = ['전체', '유기동물', '환경', '기타']

export const savingUnits = [10, 100, 1000]

export const donationAmountPresets = [1000, 3000, 5000]

export const mockCampaigns = [
  {
    id: 'happy-shelter-heating',
    organization: '행복한 유기동물보호소',
    title: '겨울나기, 유기견 난방비를 도와주세요',
    category: '유기동물',
    progress: 68,
    raised: 2046000,
    participants: 312,
    daysLeft: 8,
    preferred: true,
  },
  {
    id: 'kara-medical-fee',
    organization: '동물권행동 카라',
    title: '구조된 아이들의 병원비를 모아주세요',
    category: '유기동물',
    progress: 42,
    raised: 1284000,
    participants: 197,
    daysLeft: 14,
    preferred: false,
  },
  {
    id: 'jeju-shelter-supplies',
    organization: '제주 유기견 쉼터',
    title: '임시보호 물품 지원',
    category: '기타',
    progress: 55,
    raised: 892000,
    participants: 143,
    daysLeft: 21,
    preferred: true,
  },
  {
    id: 'karma-neutering',
    organization: '한국동물구조관리협회',
    title: '유기묘 중성화 수술',
    category: '유기동물',
    progress: 77,
    raised: 3120000,
    participants: 428,
    daysLeft: 5,
    preferred: false,
  },
]

export function getMockCampaign(campaignId) {
  return mockCampaigns.find((campaign) => campaign.id === campaignId)
}
