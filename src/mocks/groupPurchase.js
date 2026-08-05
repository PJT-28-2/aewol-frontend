import productImage from '@/assets/images/mock-product-dogfood.png'

// 공동구매 목록 화면(GroupPurchaseListView) 목데이터
// isOwner: 로그인 유저가 이 글의 작성자인지 여부. isParticipating: 로그인 유저가 이미 참여(결제 완료)한 글인지 여부.
// 진행중 글에서 '확인하기'(작성자) / '참여중'(이미 참여) / '참여하기'(미참여) 3분기 버튼에 사용
// 실 API에서는 item.memberId와 로그인 유저 memberId를 비교해 isOwner를 판정 (GroupPurchaseMyView와 동일 방식).
// isParticipating은 목록 응답에 없는 값이라 백엔드에 참여 여부 플래그 추가가 필요함
// TODO: 백엔드 API 연동 후 제거하고 groupPurchaseApi.getList()로 교체
export const MOCK_GROUP_PURCHASE_LIST = [
  {
    id: 1,
    productName: '프리미엄 사료 15kg',
    category: '사료',
    status: '진행중',
    currentQuantity: 32,
    targetQuantity: 50,
    dDay: 'D-3',
    unitPrice: 40000,
    groupPrice: 28000,
    badgeText: '30% 할인',
    isOwner: false,
    isParticipating: false,
  },
  {
    id: 2,
    productName: '강아지 관절 영양제 3개월분',
    category: '영양제',
    status: '진행중',
    currentQuantity: 8,
    targetQuantity: 30,
    dDay: 'D-7',
    unitPrice: 30000,
    groupPrice: 24000,
    badgeText: '20% 할인',
    isOwner: true,
    isParticipating: false,
  },
  {
    id: 3,
    productName: '고양이 스크래처 장난감 세트',
    category: '장난감',
    status: '마감(성공)',
    currentQuantity: 20,
    targetQuantity: 20,
    dDay: 'D-0',
    unitPrice: 20000,
    groupPrice: 17000,
    badgeText: '15% 할인',
    isOwner: false,
    isParticipating: true,
  },
  {
    id: 4,
    productName: '강아지 방한 조끼',
    category: '기타',
    status: '마감(미달)',
    currentQuantity: 12,
    targetQuantity: 30,
    dDay: 'D-0',
    unitPrice: 40000,
    groupPrice: 30000,
    badgeText: '25% 할인',
    isOwner: true,
    isParticipating: false,
  },
  {
    id: 5,
    productName: '강아지 유산균 6개월분',
    category: '영양제',
    status: '진행중',
    currentQuantity: 14,
    targetQuantity: 20,
    dDay: 'D-5',
    unitPrice: 36000,
    groupPrice: 27000,
    badgeText: '25% 할인',
    isOwner: false,
    isParticipating: true,
  },
]

// 공동구매 상세 화면(GroupPurchaseDetailView) 목데이터
// 필드명은 group_purchase 테이블 컬럼(gp_id, delivery_method, delivery_fee, delivery_date, deadline 등) 기준
// memberId는 작성자 member_id (실 API 응답 형태 맞춤). isOwner는 mock 전용 필드로, 작성자가 이 화면에
// 직접 진입했을 때 상태 화면으로 리다이렉트되는지 확인용 — true로 바꾸면 리다이렉트 동작을 볼 수 있음
// TODO: 백엔드 API 연동 후 제거하고 groupPurchaseApi.getDetail(id)로 교체 (상세 데이터 연동은 별도 작업에서 진행)
export const MOCK_GROUP_PURCHASE_DETAIL = {
  memberId: 1,
  isOwner: false,
  productName: '프리미엄 사료 15kg',
  image: productImage,
  groupPrice: 28000,
  unitPrice: 40000,
  currentQuantity: 32,
  targetQuantity: 50,
  deadline: '2026-08-05',
  deliveryMethod: '공동구매 마감 후 3일 이내 발송',
  deliveryFee: 0,
  deliveryDate: '2026-08-04',
}

// 나의 공동구매 목록(GroupPurchaseMyView) 목데이터
// role: group_purchase_participant에 로그인 유저 member_id의 참여 row가 있으면 '참여',
// 없이 group_purchase 작성자 member_id만 일치하면 '작성'으로 판정
// role과 무관하게 항상 GroupPurchaseStatusView로 이동하고, 화면 안에서 역할에 따라 버튼만 달라짐
// (참여: 참여 취소하기 / 작성: 공동구매 취소)
// TODO: 백엔드 API 연동 후 제거하고 groupPurchaseApi.getMyList()로 교체
export const MOCK_MY_GROUP_PURCHASES = [
  {
    gpId: 1,
    productName: '프리미엄 사료 15kg',
    role: '참여',
    status: '진행중',
    currentQuantity: 32,
    targetQuantity: 50,
    dDay: 'D-3',
    createdAt: '2026-07-27T10:00:00',
  },
  {
    gpId: 2,
    productName: '강아지 사료 정기배송',
    role: '작성',
    status: '진행중',
    currentQuantity: 18,
    targetQuantity: 20,
    dDay: 'D-2',
    createdAt: '2026-07-26T09:30:00',
  },
  {
    gpId: 3,
    productName: '고양이 화장실 모래 대용량',
    role: '참여',
    status: '마감(성공)',
    currentQuantity: 15,
    targetQuantity: 15,
    dDay: 'D-0',
    createdAt: '2026-07-18T09:30:00',
  },
  {
    gpId: 4,
    productName: '강아지 간식 세트',
    role: '작성',
    status: '마감(미달)',
    currentQuantity: 8,
    targetQuantity: 10,
    dDay: 'D-0',
    createdAt: '2026-07-15T18:20:00',
  },
]

// gpId별 작성자 여부 mock — MOCK_GROUP_PURCHASE_LIST/MOCK_MY_GROUP_PURCHASES의 역할과 동일하게 맞춤
// (1: 참여, 2: 작성, 3: 참여, 4: 작성). 실 API에서는 상태 응답의 memberId와 로그인 유저 memberId를
// 비교해서 자연히 정해지는 값이라, gpId 무관하게 단일 객체인 mock에서만 따로 gpId로 찾아줘야 함
export const MOCK_GROUP_PURCHASE_STATUS_OWNER_BY_GP_ID = {
  1: false,
  2: true,
  3: false,
  4: true,
}

// 공동구매 상태 조회(GroupPurchaseStatusView) 목데이터 — 응답 포맷과 동일한 구조
// gpId는 route.params.gpId를 그대로 써야 해서 화면에서 덧붙여 사용
// productName은 API 응답의 title 필드에 대응
// TODO: 백엔드 API 연동 후 제거하고 groupPurchaseApi.getStatus(id)로 교체
export const MOCK_GROUP_PURCHASE_STATUS = {
  productName: '프리미엄 사료 15kg',
  status: 'waiting',
  currentQuantity: 3,
  targetQuantity: 5,
  // 참여/작성 취소 버튼(마감 전에만 활성화)을 mock에서 확인할 수 있도록 항상 미래 시각으로 유지
  deadline: '2026-08-10T23:59:59',
  participantInfo: {
    participantId: 10523,
    paidAmount: 28000,
    paymentStatus: 'COMPLETED',
    paidAt: '2026-07-22T14:45:00',
  },
  noticeMessage: '목표 인원이 모두 모이면 공동구매가 최종 확정됩니다.',
}

// 결제 확인 화면(GroupPurchasePaymentPreview) 목데이터
// 실제로는 공동구매 참여 화면에서 선택한 상품/가격 정보를 전달받아야 함 (purchaseQuantity는 query.quantity로 전달됨)
// TODO: 백엔드 API 연동 후 제거하고 groupPurchaseApi.getDetail(id) 응답으로 교체
export const MOCK_GROUP_PURCHASE_PAYMENT_PRODUCT = {
  productName: '프리미엄 사료 15kg',
  optionText: '옵션 없음',
  unitPrice: 40000,
  groupPrice: 28000,
}

// 등록된 결제 수단(계좌) 목데이터 — 정상 결제 흐름을 보여주는 기본값(다른 화면의 지갑 잔액 mock인
// mockWalletBalance와 비슷한 규모). 잔액부족 분기를 확인하려면 balance를 결제 금액보다 낮게 바꿔서 테스트할 것
// TODO: 백엔드 API 연동 후 제거하고 실제 결제 수단 조회 API로 교체
export const MOCK_GROUP_PURCHASE_PAYMENT_METHOD = {
  name: '애월 통합 지갑',
  balance: 415000,
}

// 결제 확인 화면 기본 배송지 — 실제로는 memberApi.getProfile() 응답의 주소를 그대로 사용
// (배송지를 바꾸면 회원 프로필이 아니라 이번 참여 건의 group_purchase_participant 레코드에만 저장됨)
// TODO: 백엔드 API 연동 후 제거
export const MOCK_MEMBER_SHIPPING_ADDRESS = {
  recipientName: '김애월',
  recipientPhone: '010-1234-5678',
  zipCode: '16856',
  address: '서울특별시 광진구 화양동',
  addressDetail: '세종대점 컴포즈 302호',
}
