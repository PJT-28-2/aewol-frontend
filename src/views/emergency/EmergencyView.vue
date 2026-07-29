<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AppButton from '@/components/common/AppButton.vue'
import BottomNavBar from '@/components/common/BottomNavBar.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import IconChevronLeft from '@/components/common/icons/IconChevronLeft.vue'
import IconHospital from '@/components/common/icons/IconHospital.vue'
import IconPhone from '@/components/common/icons/IconPhone.vue'

const router = useRouter()
const hospitals = ref([])
const isLoading = ref(true)
const mapContainer = ref(null)

// TODO: 백엔드 API 연동 후 제거
const mockHospitals = [
  {
    id: 1,
    name: '24시 제주동물의료센터',
    distance: 620,
    travelTime: 8,
    travelMode: '도보',
    phone: '064-123-4567',
    lat: 33.4996,
    lng: 126.5312,
  },
  {
    id: 2,
    name: '애월 24시 동물병원',
    distance: 1100,
    travelTime: 15,
    travelMode: '도보',
    phone: '064-234-5678',
    lat: 33.5024,
    lng: 126.5278,
  },
  {
    id: 3,
    name: '한라 응급동물병원',
    distance: 2400,
    travelTime: 6,
    travelMode: '차량',
    phone: '064-345-6789',
    lat: 33.4953,
    lng: 126.5358,
  },
]

function formatDistance(meters) {
  if (meters < 1000) return `${meters}m`
  return `${(meters / 1000).toFixed(1)}km`
}

function handleCall(phone) {
  window.location.href = `tel:${phone}`
}

function handleNavigation(hospital) {
  const url = `https://map.kakao.com/link/to/${encodeURIComponent(hospital.name)},${hospital.lat},${hospital.lng}`
  window.open(url, '_blank')
}

async function initKakaoMap(lat, lng) {
  const key = import.meta.env.VITE_KAKAO_MAP_KEY
  if (!key || !mapContainer.value) return

  await new Promise((resolve) => {
    const script = document.createElement('script')
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${key}&autoload=false`
    script.onload = resolve
    document.head.appendChild(script)
  })

  window.kakao.maps.load(() => {
    const center = new window.kakao.maps.LatLng(lat, lng)
    const map = new window.kakao.maps.Map(mapContainer.value, {
      center,
      level: 5,
      draggable: false,
      scrollwheel: false,
    })
    new window.kakao.maps.Marker({ map, position: center })
    hospitals.value.forEach((h) => {
      new window.kakao.maps.Marker({
        map,
        position: new window.kakao.maps.LatLng(h.lat, h.lng),
      })
    })
  })
}

onMounted(async () => {
  try {
    const pos = await new Promise((resolve, reject) => {
      if (!navigator.geolocation) return reject(new Error('not supported'))
      navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 })
    })
    const { latitude: lat, longitude: lng } = pos.coords

    // TODO: 백엔드 API 연동 시 아래 주석 해제 후 mock 제거
    // const res = await emergencyApi.searchHospitals({ lat, lng })
    // hospitals.value = res.data
    hospitals.value = mockHospitals

    await initKakaoMap(lat, lng)
  } catch {
    hospitals.value = mockHospitals
  } finally {
    isLoading.value = false
  }
})
</script>

<template>
  <div class="min-h-screen bg-(--color-bg) flex flex-col">
    <!-- 헤더 -->
    <header class="bg-(--color-navy) px-(--space-4) pt-(--space-5) pb-(--space-6)">
      <button
        class="flex items-center justify-center w-10 h-10 -ml-2 mb-(--space-1)"
        aria-label="뒤로 가기"
        @click="router.back()"
      >
        <IconChevronLeft :size="24" color="var(--color-white)" />
      </button>
      <h1 class="text-(length:--font-2xl) font-bold text-(color:--color-white)">
        응급 SOS
      </h1>
      <p class="text-(length:--font-sm) text-(color:--color-slate) mt-(--space-1)">
        위급할 때 근처 응급병원을 찾아보세요
      </p>
    </header>

    <!-- 본문 -->
    <main class="flex-1 px-(--space-4) pt-(--space-5) pb-[calc(var(--bottom-nav-height)+var(--space-5))]">
      <!-- 지도 미리보기 -->
      <section class="mb-(--space-6)">
        <h2 class="text-(length:--font-base) font-semibold text-(color:--color-navy) mb-(--space-3)">
          지도 미리보기
        </h2>
        <div class="relative rounded-(--radius-lg) overflow-hidden shadow-(--shadow-sm)">
          <div
            ref="mapContainer"
            class="w-full h-[180px] bg-(--color-gray-200)"
          />
          <div
            v-if="hospitals.length"
            class="absolute bottom-3 left-3 flex items-center gap-(--space-1) bg-(--color-white) rounded-full px-(--space-3) py-1 shadow-(--shadow-sm)"
          >
            <span class="w-2 h-2 rounded-full bg-(--color-success) shrink-0" />
            <span class="text-(length:--font-sm) font-semibold text-(color:--color-navy)">
              {{ formatDistance(hospitals[0].distance) }}
            </span>
          </div>
          <div
            v-if="hospitals.length"
            class="absolute bottom-3 right-3 flex items-center gap-1 bg-(--color-white) rounded-full px-(--space-3) py-1 shadow-(--shadow-sm)"
          >
            <span class="text-(length:--font-sm) font-semibold text-(color:--color-navy)">
              {{ hospitals.length }}
            </span>
          </div>
        </div>
      </section>

      <!-- 병원 목록 -->
      <section>
        <h2 class="text-(length:--font-base) font-semibold text-(color:--color-navy) mb-(--space-3)">
          가까운 24시 응급병원
        </h2>

        <div
          v-if="isLoading"
          class="flex justify-center py-(--space-8)"
        >
          <LoadingSpinner />
        </div>

        <EmptyState
          v-else-if="!hospitals.length"
          :icon="IconHospital"
          message="주변에 응급 동물병원이 없습니다."
        />

        <ul
          v-else
          class="flex flex-col gap-(--space-3)"
        >
          <li
            v-for="hospital in hospitals"
            :key="hospital.id"
            class="flex items-center gap-(--space-3) bg-(--color-white) rounded-(--radius-lg) p-(--space-4) shadow-(--shadow-sm)"
          >
            <div class="flex items-center justify-center w-[48px] h-[48px] rounded-(--radius-md) bg-(--color-gray-100) shrink-0">
              <IconHospital :size="26" color="var(--color-slate-dark)" />
            </div>

            <div class="flex-1 min-w-0">
              <p class="text-(length:--font-md) font-semibold text-(color:--color-navy) truncate">
                {{ hospital.name }}
              </p>
              <p class="text-(length:--font-sm) text-(color:--color-slate-muted) mt-(--space-1)">
                {{ formatDistance(hospital.distance) }} · {{ hospital.travelMode }} {{ hospital.travelTime }}분
              </p>
              <div class="flex gap-(--space-2) mt-(--space-2)">
                <AppButton
                  variant="secondary"
                  size="sm"
                  @click="handleCall(hospital.phone)"
                >
                  <IconPhone :size="13" color="var(--color-navy)" class="shrink-0 translate-y-[1px]" />
                  전화
                </AppButton>
                <AppButton
                  variant="navy"
                  size="sm"
                  @click="handleNavigation(hospital)"
                >
                  길찾기 &rsaquo;
                </AppButton>
              </div>
            </div>
          </li>
        </ul>
      </section>
    </main>

    <BottomNavBar />
  </div>
</template>
