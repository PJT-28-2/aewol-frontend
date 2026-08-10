<script setup>
import { ref, onMounted, watch } from 'vue';
import { storeToRefs } from 'pinia';
import AppButton from '@/components/common/AppButton.vue';
import EmptyState from '@/components/common/EmptyState.vue';
import LoadingSpinner from '@/components/common/LoadingSpinner.vue';
import FeatureIconTile from '@/components/common/FeatureIconTile.vue';
import ToggleSwitch from '@/components/common/ToggleSwitch.vue';
import IconEmergencyCross from '@/components/common/icons/IconEmergencyCross.vue';
import IconPhone from '@/components/common/icons/IconPhone.vue';
import IconWarning from '@/components/common/icons/IconWarning.vue';
import { useEmergencyStore } from '@/stores/emergency';

const emergencyStore = useEmergencyStore();
const { hospitals, isLoading, error } = storeToRefs(emergencyStore);

const mapContainer = ref(null);
const mapError = ref(null);
const is24hOnly = ref(false);

// 서울 시청 기본 좌표 (위치 권한 거부 시 fallback — 애월은 지역 한정 서비스가 아니므로 유지)
const DEFAULT_LAT = 37.5665;
const DEFAULT_LNG = 126.978;
const userLat = ref(DEFAULT_LAT);
const userLng = ref(DEFAULT_LNG);

function hospitalKey(hospital) {
  return `${hospital.name}-${hospital.latitude}-${hospital.longitude}`;
}

function formatDistance(distanceKm) {
  const km = Number(distanceKm) || 0;
  if (km < 1) return `${Math.round(km * 1000)}m`;
  return `${km.toFixed(1)}km`;
}

function handleCall(phone) {
  window.location.href = `tel:${phone}`;
}

function handleNavigation(hospital) {
  const url = `https://map.kakao.com/link/to/${encodeURIComponent(hospital.name)},${hospital.latitude},${hospital.longitude}`;
  window.open(url, '_blank', 'noopener,noreferrer');
}

async function loadHospitals() {
  try {
    await emergencyStore.fetchHospitals({
      latitude: userLat.value,
      longitude: userLng.value,
      radiusKm: 5,
      is24h: is24hOnly.value,
    });
  } catch {
    // 실패 상태는 store의 error에 이미 반영됨 — 화면에서 별도로 표시하므로 여기서는 무시
  }
}

async function initKakaoMap(lat, lng) {
  const key = import.meta.env.VITE_KAKAO_MAP_KEY;
  if (!mapContainer.value) return;

  if (!key) {
    mapError.value = '지도 설정을 확인해 주세요.';
    return;
  }

  if (!window.kakao?.maps) {
    try {
      await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${key}&autoload=false`;
        script.onload = resolve;
        script.onerror = () => reject(new Error('카카오맵 SDK 로드 실패'));
        document.head.appendChild(script);
      });
    } catch {
      mapError.value = '지도를 불러오지 못했습니다.';
      return;
    }
  }

  window.kakao.maps.load(() => {
    const center = new window.kakao.maps.LatLng(lat, lng);
    const map = new window.kakao.maps.Map(mapContainer.value, {
      center,
      level: 5,
      draggable: false,
      scrollwheel: false,
    });
    new window.kakao.maps.Marker({ map, position: center });
    hospitals.value.forEach((h) => {
      new window.kakao.maps.Marker({
        map,
        position: new window.kakao.maps.LatLng(h.latitude, h.longitude),
      });
    });
  });
}

watch(is24hOnly, async () => {
  await loadHospitals();
});

onMounted(async () => {
  try {
    const pos = await new Promise((resolve, reject) => {
      if (!navigator.geolocation) return reject(new Error('not supported'));
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        timeout: 5000,
      });
    });
    userLat.value = pos.coords.latitude;
    userLng.value = pos.coords.longitude;
  } catch {
    // 위치 권한 거부 또는 미지원 시 기본 좌표(서울시청)로 조회
  }

  await loadHospitals();
  await initKakaoMap(userLat.value, userLng.value);
});
</script>

<template>
  <div class="min-h-screen bg-(--color-app-bg) flex flex-col">
    <!-- 헤더 -->
    <header class="px-(--space-4) pt-(--space-5) pb-(--space-2)">
      <h1 class="text-(length:--font-2xl) font-bold text-(color:--color-navy)">
        응급 SOS
      </h1>
      <p
        class="text-(length:--font-md) text-(color:--color-slate-muted) mt-(--space-1)"
      >
        위급할 때 근처 응급병원을 찾아보세요
      </p>
    </header>

    <!-- 본문 -->
    <main
      class="flex-1 px-(--space-4) pt-(--space-3) pb-[calc(var(--bottom-nav-height)+var(--space-5))]"
    >
      <!-- 지도 미리보기 -->
      <section class="mb-(--space-6)">
        <h2
          class="text-(length:--font-base) font-semibold text-(color:--color-navy) mb-(--space-3)"
        >
          지도 미리보기
        </h2>
        <div class="relative overflow-hidden rounded-(--radius-2xl) border border-(--color-card-border) bg-(--color-white) shadow-(--shadow-card)">
          <div
            ref="mapContainer"
            class="w-full h-(--size-map-preview-height) bg-(--color-gray-200)"
          />
          <div
            v-if="mapError"
            class="absolute inset-0 flex flex-col items-center justify-center gap-(--space-2) bg-(--color-leaf-soft)"
          >
            <IconWarning
              :size="24"
              color="var(--color-slate-muted)"
            />
            <p class="text-(length:--font-sm) text-(color:--color-slate-muted)">
              {{ mapError }}
            </p>
          </div>
          <div
            v-else-if="hospitals.length"
            class="absolute bottom-3 left-3 flex items-center gap-(--space-1) bg-(--color-white) rounded-full px-(--space-3) py-1 shadow-(--shadow-sm)"
          >
            <span class="w-2 h-2 rounded-full bg-(--color-olive) shrink-0" />
            <span
              class="text-(length:--font-sm) font-semibold text-(color:--color-navy)"
            >
              {{ formatDistance(hospitals[0].distanceKm) }}
            </span>
          </div>
          <div
            v-if="!mapError && hospitals.length"
            class="absolute bottom-3 right-3 flex items-center gap-1 bg-(--color-white) rounded-full px-(--space-3) py-1 shadow-(--shadow-sm)"
          >
            <span
              class="text-(length:--font-sm) font-semibold text-(color:--color-navy)"
            >
              {{ hospitals.length }}
            </span>
          </div>
        </div>
      </section>

      <!-- 병원 목록 -->
      <section>
        <div class="flex items-center justify-between mb-(--space-3)">
          <h2
            class="text-(length:--font-base) font-semibold text-(color:--color-navy)"
          >
            {{ is24hOnly ? '가까운 24시 응급병원' : '가까운 응급병원' }}
          </h2>
          <div class="flex items-center gap-(--space-2)">
            <span class="text-(length:--font-sm) text-(color:--color-slate-muted)">
              24시간만
            </span>
            <ToggleSwitch
              v-model="is24hOnly"
              label="24시간 운영 병원만 보기"
            />
          </div>
        </div>

        <div
          v-if="error"
          class="mb-(--space-3) flex items-center gap-(--space-2) rounded-(--radius-xl) border border-(--color-card-border) bg-(--color-white) p-(--space-3)"
        >
          <IconWarning
            :size="18"
            color="var(--color-slate-muted)"
          />
          <p class="flex-1 text-(length:--font-sm) text-(color:--color-slate-muted)">
            병원 목록을 불러오지 못했습니다.
          </p>
          <AppButton
            variant="ghost"
            size="sm"
            @click="loadHospitals"
          >
            다시 시도
          </AppButton>
        </div>

        <div
          v-if="isLoading"
          class="flex justify-center py-(--space-8)"
        >
          <LoadingSpinner />
        </div>

        <EmptyState
          v-else-if="!hospitals.length"
          :icon="IconEmergencyCross"
          message="주변에 응급 동물병원이 없습니다."
        />

        <ul
          v-else
          class="flex flex-col gap-(--space-3)"
        >
          <li
            v-for="hospital in hospitals"
            :key="hospitalKey(hospital)"
            class="flex items-center gap-(--space-3) rounded-(--radius-2xl) border border-(--color-card-border) bg-(--color-white) p-(--space-4) shadow-(--shadow-card)"
          >
            <FeatureIconTile
              :icon="IconEmergencyCross"
              tone="blue"
            />

            <div class="flex-1 min-w-0">
              <p
                class="text-(length:--font-md) font-semibold text-(color:--color-navy) truncate"
              >
                {{ hospital.name }}
              </p>
              <p
                class="text-(length:--font-sm) text-(color:--color-slate-muted) mt-(--space-1) truncate"
              >
                {{ hospital.address }}
              </p>
              <p
                class="text-(length:--font-sm) text-(color:--color-slate-muted) mt-(--space-1)"
              >
                {{ formatDistance(hospital.distanceKm) }} · 차량 이동
              </p>
              <div class="flex gap-(--space-2) mt-(--space-2)">
                <AppButton
                  variant="secondary"
                  size="sm"
                  class="border-(--color-border)!"
                  @click="handleCall(hospital.phone)"
                >
                  <IconPhone
                    :size="13"
                    color="var(--color-navy)"
                    class="shrink-0 translate-y-px"
                  />
                  <span class="leading-none">전화</span>
                </AppButton>
                <AppButton
                  variant="navy"
                  size="sm"
                  @click="handleNavigation(hospital)"
                >
                  길찾기
                  <span class="text-(length:--font-lg) leading-none text-(color:--color-white)">&rsaquo;</span>
                </AppButton>
              </div>
            </div>
          </li>
        </ul>
      </section>
    </main>
  </div>
</template>
