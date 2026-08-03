import productImage from '@/assets/images/mock-product-dogfood.png'

// 공동구매 목록 화면(GroupPurchaseListView) 목데이터
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
    badgeText: '30% 할인',
  },
  {
    id: 2,
    productName: '강아지 관절 영양제 3개월분',
    category: '영양제',
    status: '진행중',
    currentQuantity: 8,
    targetQuantity: 30,
    dDay: 'D-7',
    badgeText: '20% 할인',
  },
  {
    id: 3,
    productName: '고양이 스크래처 장난감 세트',
    category: '장난감',
    status: '마감(성공)',
    currentQuantity: 20,
    targetQuantity: 20,
    dDay: 'D-0',
    badgeText: '15% 할인',
  },
  {
    id: 4,
    productName: '강아지 방한 조끼',
    category: '기타',
    status: '마감(미달)',
    currentQuantity: 12,
    targetQuantity: 30,
    dDay: 'D-0',
    badgeText: '25% 할인',
  },
]

// 공동구매 상세 화면(GroupPurchaseDetailView) 목데이터
// 필드명은 group_purchase 테이블 컬럼(gp_id, delivery_method, delivery_fee, delivery_date, deadline 등) 기준
// TODO: 백엔드 API 연동 후 제거하고 groupPurchaseApi.getDetail(id)로 교체 (상세 데이터 연동은 별도 작업에서 진행)
export const MOCK_GROUP_PURCHASE_DETAIL = {
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
// '참여'는 GroupPurchaseStatusView(결제/취소)로, '작성'은 GroupPurchaseDetailView(읽기 전용)로 이동
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

// 공동구매 상태 조회(GroupPurchaseStatusView) 목데이터 — 응답 포맷과 동일한 구조
// gpId는 route.params.gpId를 그대로 써야 해서 화면에서 덧붙여 사용
// productName은 API 응답의 title 필드에 대응
// TODO: 백엔드 API 연동 후 제거하고 groupPurchaseApi.getStatus(id)로 교체
export const MOCK_GROUP_PURCHASE_STATUS = {
  productName: '프리미엄 사료 15kg',
  status: 'waiting',
  currentQuantity: 3,
  targetQuantity: 5,
  deadline: '2026-07-30T23:59:59',
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

// 등록된 결제 수단(계좌) 목데이터 — 잔액부족 상태를 확인하기 위해 결제 금액(28,000원)보다 적은 잔액으로 설정
// TODO: 백엔드 API 연동 후 제거하고 실제 결제 수단 조회 API로 교체
export const MOCK_GROUP_PURCHASE_PAYMENT_METHOD = {
  name: '애월 통합 지갑',
  balance: 415000,
}
