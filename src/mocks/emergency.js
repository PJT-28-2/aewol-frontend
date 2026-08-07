// TODO: 백엔드 API 연동 후 제거 (VITE_USE_MOCK_DATA=true일 때만 사용)
// 필드는 실제 백엔드 HospitalResponse(name, address, phone, latitude, longitude, distanceKm)와 동일한 형태로 맞춰요.
export const mockHospitals = [
  {
    id: 1,
    name: '24시 제주동물의료센터',
    address: '제주특별자치도 제주시 첨단동길 8',
    distanceKm: 0.62,
    phone: '064-123-4567',
    latitude: 33.4996,
    longitude: 126.5312,
  },
  {
    id: 2,
    name: '애월 24시 동물병원',
    address: '제주특별자치도 제주시 애월읍 애월로 12',
    distanceKm: 1.1,
    phone: '064-234-5678',
    latitude: 33.5024,
    longitude: 126.5278,
  },
  {
    id: 3,
    name: '한라 응급동물병원',
    address: '제주특별자치도 제주시 한라대학로 6',
    distanceKm: 2.4,
    phone: '064-345-6789',
    latitude: 33.4953,
    longitude: 126.5358,
  },
]
