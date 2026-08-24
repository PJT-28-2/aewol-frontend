<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import AppButton from '@/components/common/AppButton.vue';
import HospitalPeekSheet from '@/components/emergency/HospitalPeekSheet.vue';
import IconCurrentLocation from '@/components/common/icons/IconCurrentLocation.vue';
import IconEmergencyCross from '@/components/common/icons/IconEmergencyCross.vue';
import IconWarning from '@/components/common/icons/IconWarning.vue';
import { useEmergencyStore } from '@/stores/emergency';
import { useUserLocation } from '@/composables/useUserLocation';
import { formatDistance } from '@/utils/distance';

const emergencyStore = useEmergencyStore();
const { hospitals, isLoading, error } = storeToRefs(emergencyStore);

const mapContainer = ref(null);
const mapError = ref(null);
const is24hOnly = ref(false);
const selectedHospital = ref(null);
const isSheetExpanded = ref(false);

// 마커 DOM은 Vue가 그리고(아이콘 컴포넌트·디자인 토큰을 그대로 쓰려고), 그 노드를
// 카카오 CustomOverlay의 content로 넘긴다. MarkerImage를 쓰면 색을 하드코딩한
// 이미지가 필요해서 프로젝트의 색상/아이콘 규칙과 어긋난다.
const markerHost = ref(null);
const userMarkerEl = ref(null);

// 마커 DOM은 병원 key로 잡는다. 배열 index로 잡으면 v-for 항목이 언마운트될 때
// Vue가 옛 index를 담은 ref 콜백을 null로 호출하면서, 그 사이 새로 마운트된 노드가
// 들어간 슬롯을 덮어쓸 수 있다. 그러면 해당 병원 마커만 조용히 사라진다.
// 화면에 그리는 값이 아니라 DOM 핸들이라 반응형으로 두지 않는다.
const markerEls = new Map();

let map = null;
let overlays = [];
let userOverlay = null;
let mapClickListener = null;
let renderToken = 0;

// 서울 시청 기본 좌표 (위치 권한 거부 시 fallback — 애월은 지역 한정 서비스가 아니므로 유지)
const DEFAULT_LAT = 37.5665;
const DEFAULT_LNG = 126.978;
// 폴백 중이라는 안내에 쓰는 이름. 좌표와 같이 두어 한쪽만 바뀌는 걸 막는다.
const DEFAULT_LOCATION_LABEL = '서울시청';

const {
  latitude: userLat,
  longitude: userLng,
  isFallbackLocation,
  locationError,
  isLocating,
  locate,
} = useUserLocation({ defaultLatitude: DEFAULT_LAT, defaultLongitude: DEFAULT_LNG });

// 위치를 못 잡아 기본 좌표로 조회 중이면 반드시 알린다. 응급 병원 목록에서 기준점이
// 틀린 걸 모르면 "가장 가까운 병원"을 믿고 엉뚱한 곳으로 향할 수 있다.
const showLocationNotice = computed(() => isFallbackLocation.value && !!locationError.value);

// 선택한 마커가 시트에 가리지 않도록 지도 중심을 아래로 밀어 마커를 화면 위쪽에 둔다.
// 시트 상세 높이(--size-map-sheet-detail, 276px)의 절반 정도면 마커가 시트 위에 걸린다.
const SELECTED_MARKER_OFFSET_PX = 140;

function hospitalKey(hospital) {
  return `${hospital.name}-${hospital.latitude}-${hospital.longitude}`;
}

const selectedKey = computed(() =>
  selectedHospital.value ? hospitalKey(selectedHospital.value) : null,
);

// 응급 상황에서 제일 먼저 읽혀야 하는 건 "가장 가까운 곳"이라 마커 하나를 강조한다.
// 백엔드가 거리순 정렬을 보장한다고 가정하지 않고 직접 최솟값을 찾는다.
const nearestKey = computed(() => {
  if (!hospitals.value.length) return null;
  const nearest = hospitals.value.reduce((closest, hospital) =>
    Number(hospital.distanceKm) < Number(closest.distanceKm) ? hospital : closest,
  );
  return hospitalKey(nearest);
});

// 마커는 selected > nearest > default 3단계로만 구분한다. 단계가 더 늘어나면
// 지도 위에서 색이 서로 경쟁해서 오히려 안 읽힌다.
const markerViews = computed(() =>
  hospitals.value.map((hospital) => {
    const key = hospitalKey(hospital);
    const state =
      key === selectedKey.value
        ? 'selected'
        : key === nearestKey.value
          ? 'nearest'
          : 'default';
    return { hospital, key, state };
  }),
);

const markerPillClasses = {
  selected: 'bg-(--color-brand-dark) text-(color:--color-contrast)',
  nearest: 'bg-(--color-danger-strong) text-(color:--color-contrast)',
  default: 'bg-(--color-white) text-(color:--color-navy)',
};

// 꼬리는 pill 배경과 같은 색이어야 말풍선으로 읽힌다
const markerTailClasses = {
  selected: 'border-t-[color:var(--color-navy)]',
  nearest: 'border-t-[color:var(--color-danger-strong)]',
  default: 'border-t-[color:var(--color-white)]',
};

const markerIconColors = {
  selected: 'var(--color-contrast)',
  nearest: 'var(--color-contrast)',
  default: 'var(--color-danger-strong)',
};

const markerZIndexes = { selected: 30, nearest: 20, default: 10 };

function setMarkerEl(el, key) {
  if (el) markerEls.set(key, el);
  else markerEls.delete(key);
}

function handleCall(hospital) {
  window.location.href = `tel:${hospital.phone}`;
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
    // 실패 상태는 store의 error에 이미 반영됨 — 시트에서 별도로 표시하므로 여기서는 무시
  }
}

function selectHospital(hospital) {
  selectedHospital.value = hospital;
  isSheetExpanded.value = false;
  panToSelected(hospital);
}

function clearSelection() {
  selectedHospital.value = null;
  isSheetExpanded.value = false;
}

function panToSelected(hospital) {
  if (!map || !window.kakao?.maps) return;
  const target = new window.kakao.maps.LatLng(hospital.latitude, hospital.longitude);
  try {
    // 지도 중심을 마커보다 아래로 잡아야 마커가 시트 위쪽 영역에 보인다.
    const projection = map.getProjection();
    const point = projection.pointFromCoords(target);
    point.y += SELECTED_MARKER_OFFSET_PX;
    map.panTo(projection.coordsFromPoint(point));
  } catch {
    // projection API를 쓸 수 없는 상황이면 오프셋 없이 마커 위치로만 이동한다
    map.panTo(target);
  }
}

function moveToUserLocation() {
  if (!map || !window.kakao?.maps) return;
  map.panTo(new window.kakao.maps.LatLng(userLat.value, userLng.value));
}

// 오버레이를 만들면 카카오가 content 노드를 지도 레이어로 옮겨 간다. 그 상태로 Vue가
// v-for를 patch하면 Vue가 기억하는 부모와 실제 부모가 달라 순서가 꼬일 수 있으므로,
// 정리할 때 노드를 원래 host로 되돌려 놓고 나서 다시 렌더링한다.
function clearOverlays() {
  overlays.forEach(({ overlay, content }) => {
    overlay.setMap(null);
    if (content && markerHost.value) markerHost.value.appendChild(content);
  });
  overlays = [];
}

// hospitals가 바뀔 때마다 오버레이를 다시 만든다. (기존 코드는 onMounted에서 한 번만
// 마커를 그려서 24시간 필터를 토글해도 지도의 마커가 그대로 남아 있었다)
async function renderMarkers() {
  if (!map || !window.kakao?.maps) return;

  // onMounted의 직접 호출과 hospitals watcher가 겹칠 수 있어서, 마지막 호출만 반영한다
  const token = ++renderToken;
  clearOverlays();
  await nextTick();
  if (token !== renderToken) return;

  markerViews.value.forEach(({ hospital, key, state }) => {
    const content = markerEls.get(key);
    if (!content) return;

    const overlay = new window.kakao.maps.CustomOverlay({
      map,
      content,
      position: new window.kakao.maps.LatLng(hospital.latitude, hospital.longitude),
      yAnchor: 1,
      clickable: true,
      zIndex: markerZIndexes[state],
    });
    overlays.push({ overlay, content, key });
  });

  if (userMarkerEl.value) {
    userOverlay?.setMap(null);
    userOverlay = new window.kakao.maps.CustomOverlay({
      map,
      content: userMarkerEl.value,
      position: new window.kakao.maps.LatLng(userLat.value, userLng.value),
      zIndex: 5,
    });
  }
}

// 스크립트 로드도 kakao.maps.load 콜백도 "영영 안 오는" 경우가 있다. 응답이 없으면
// 실패 통보가 없어서 Promise가 안 풀리고 뒤 단계가 통째로 멈추므로 타임아웃을 건다.
const KAKAO_MAP_TIMEOUT_MS = 10000;

function withTimeout(promise, message) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(message)), KAKAO_MAP_TIMEOUT_MS);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

function loadKakaoSdk(key) {
  if (window.kakao?.maps) return Promise.resolve();
  return withTimeout(
    new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${key}&autoload=false`;
      script.onload = resolve;
      script.onerror = () => reject(new Error('카카오맵 SDK 로드 실패'));
      document.head.appendChild(script);
    }),
    '카카오맵 SDK 로드 시간 초과',
  );
}

function createMap() {
  return withTimeout(
    new Promise((resolve, reject) => {
      window.kakao.maps.load(() => {
        try {
          map = new window.kakao.maps.Map(mapContainer.value, {
            center: new window.kakao.maps.LatLng(userLat.value, userLng.value),
            level: 5,
          });
          // 지도 빈 곳을 누르면 선택을 해제해 지도 전체를 다시 볼 수 있게 한다
          mapClickListener = () => clearSelection();
          window.kakao.maps.event.addListener(map, 'click', mapClickListener);
          resolve();
        } catch (error) {
          reject(error);
        }
      });
    }),
    '카카오맵 초기화 시간 초과',
  );
}

async function initKakaoMap() {
  const key = import.meta.env.VITE_KAKAO_MAP_KEY;
  if (!mapContainer.value) return;

  if (!key) {
    mapError.value = '지도 설정을 확인해 주세요.';
    return;
  }

  try {
    await loadKakaoSdk(key);
    await createMap();
  } catch (error) {
    // 지도는 못 띄워도 병원 목록은 그대로 쓸 수 있어야 한다 — 시트가 목록을 계속 보여준다
    console.warn('[EmergencyView] 지도 초기화 실패', error);
    mapError.value = '지도를 불러오지 못했습니다.';
  }
}

// hospitals watcher는 배열 "참조"가 바뀔 때만 돈다. 목 모드처럼 같은 배열을 그대로
// 다시 넣는 경우엔 watcher가 돌지 않으므로, 다시 조회할 때는 항상 이 함수를 거쳐
// 마커를 직접 한 번 더 그린다. (renderToken 가드가 있어서 watcher와 겹쳐도
// 마지막 호출만 반영된다)
async function refreshHospitals() {
  await loadHospitals();
  await renderMarkers();
}

watch(is24hOnly, async () => {
  clearSelection();
  await refreshHospitals();
});

watch(hospitals, async () => {
  // 목록이 바뀌면 이전 선택은 더 이상 유효하지 않을 수 있다
  if (
    selectedHospital.value &&
    !hospitals.value.some((h) => hospitalKey(h) === hospitalKey(selectedHospital.value))
  ) {
    selectedHospital.value = null;
  }
  await renderMarkers();
});

// 선택이 바뀌면 강조된 마커가 다른 마커에 가리지 않도록 쌓임 순서만 다시 잡는다
// (색/라벨은 markerViews가 반응형이라 Vue가 알아서 갱신한다)
watch(markerViews, (views) => {
  const stateByKey = new Map(views.map(({ key, state }) => [key, state]));
  overlays.forEach(({ overlay, key }) => {
    overlay.setZIndex(markerZIndexes[stateByKey.get(key) ?? 'default']);
  });
});

// 지도를 못 띄우면 목록이라도 바로 보이도록 시트를 펼쳐 둔다
watch(mapError, (value) => {
  if (value) isSheetExpanded.value = true;
});

// 위치 조회 실패 후 재시도. 성공하면 새 좌표로 병원을 다시 불러오고(renderMarkers가
// 내 위치 마커도 새 좌표로 다시 만든다) 지도를 그 위치로 옮긴다.
async function retryLocation() {
  const located = await locate();
  if (!located) return;
  clearSelection();
  await refreshHospitals();
  moveToUserLocation();
}

onMounted(async () => {
  // 병원 목록은 지도 없이도 성립하는 정보다. 측위(최대 15초)와 지도 SDK 로딩 뒤로
  // 밀면 첫 진입에서 그동안 아무 요청도 나가지 않아 빈 화면이 오래 남는다.
  // 기본 좌표로 즉시 조회를 띄우고, 측위와 지도 초기화는 병렬로 돌린다.
  const initialList = loadHospitals();

  // 측위에 성공하면 실제 좌표로 다시 조회한다. store가 요청 순번 + AbortController로
  // 앞선 요청을 무효화하므로 두 조회가 겹쳐도 최신 결과만 반영된다.
  // 실패해도 기본 좌표 결과를 그대로 두고, 사유는 locationError로 화면에 표시된다.
  const locating = locate().then((located) => (located ? refreshHospitals() : null));

  // 지도가 준비되기 전에 목록이 먼저 와도 renderMarkers는 map이 없어 그냥 빠진다.
  // 그래서 지도 준비 직후 한 번 명시적으로 그려준다.
  await initKakaoMap();
  await initialList;
  await renderMarkers();

  await locating;

  // 지도는 측위를 기다리지 않고 기본 좌표로 먼저 띄운다. 그래서 측위가 끝나면 지도도
  // 따라 옮겨줘야 한다. 이게 없으면 목록만 내 위치 기준으로 바뀌고 화면은 기본 좌표에
  // 머물러서, 사용자가 재시도를 눌러야 비로소 내 위치가 보였다.
  // 여기는 initKakaoMap() 이후라 map이 준비돼 있다.
  if (!isFallbackLocation.value) moveToUserLocation();
});

onBeforeUnmount(() => {
  if (map && mapClickListener && window.kakao?.maps) {
    window.kakao.maps.event.removeListener(map, 'click', mapClickListener);
  }
  clearOverlays();
  userOverlay?.setMap(null);
  userOverlay = null;
  map = null;
});
</script>

<template>
  <!-- DefaultLayout의 헤더/하단 네비를 뺀 영역을 지도가 가득 채운다 -->
  <div
    class="relative w-full overflow-hidden bg-(--color-app-bg) h-[calc(100svh-var(--header-height)-var(--bottom-nav-height)-var(--space-6)-env(safe-area-inset-bottom,0px))]"
  >
    <div
      ref="mapContainer"
      class="absolute inset-0 bg-(--color-gray-200)"
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

    <!-- 지도 위 플로팅 컨트롤 -->
    <div
      class="pointer-events-none absolute inset-x-(--space-4) top-(--space-3) z-10 flex flex-col gap-(--space-2)"
    >
      <div class="flex items-center gap-(--space-2)">
        <span
          class="rounded-(--radius-full) bg-(--color-white) px-(--space-4) py-(--space-2) text-(length:--font-md) font-bold text-(color:--color-navy) shadow-(--shadow-md)"
        >
          응급 SOS
        </span>
        <button
          type="button"
          class="pointer-events-auto cursor-pointer rounded-(--radius-full) px-(--space-4) py-(--space-2) text-(length:--font-sm) font-semibold shadow-(--shadow-md) transition-colors"
          :class="
            is24hOnly
              ? 'bg-(--color-brand-dark) text-(color:--color-contrast)'
              : 'bg-(--color-white) text-(color:--color-slate-dark)'
          "
          :aria-pressed="is24hOnly"
          @click="is24hOnly = !is24hOnly"
        >
          24시간만
        </button>
      </div>

      <!-- 위치를 못 잡았을 때만 뜬다. 기준점이 내 위치가 아니라는 걸 알려야 사용자가
           거리를 잘못 믿지 않는다. -->
      <div
        v-if="showLocationNotice"
        role="status"
        class="pointer-events-auto flex items-start gap-(--space-2) rounded-(--radius-md) bg-(--color-white) px-(--space-3) py-(--space-2) shadow-(--shadow-md)"
      >
        <IconWarning
          :size="16"
          color="var(--color-warning-strong)"
          class="mt-[2px] shrink-0"
        />
        <div class="flex-1">
          <p class="text-(length:--font-sm) font-semibold text-(color:--color-navy)">
            {{ DEFAULT_LOCATION_LABEL }} 기준으로 표시 중이에요
          </p>
          <p class="text-(length:--font-xs) text-(color:--color-slate-muted)">
            {{ locationError }}
          </p>
        </div>
        <AppButton
          variant="secondary"
          size="sm"
          :loading="isLocating"
          @click="retryLocation"
        >
          재시도
        </AppButton>
      </div>
    </div>

    <button
      v-if="!mapError"
      type="button"
      class="absolute right-(--space-4) z-10 flex size-[40px] cursor-pointer items-center justify-center rounded-(--radius-full) bg-(--color-white) shadow-(--shadow-md) transition-[bottom] duration-300 ease-out"
      :class="
        isSheetExpanded
          ? 'bottom-[calc(var(--size-map-sheet-list)+var(--space-3))]'
          : selectedHospital
            ? 'bottom-[calc(var(--size-map-sheet-detail)+var(--space-3))]'
            : 'bottom-[calc(var(--size-map-sheet-summary)+var(--space-3))]'
      "
      aria-label="내 위치로 이동"
      @click="moveToUserLocation"
    >
      <IconCurrentLocation
        :size="20"
        color="var(--color-navy)"
      />
    </button>

    <!-- 카카오 CustomOverlay의 content로 넘길 마커 DOM. 오버레이가 생성되면
         카카오가 이 노드를 지도 레이어로 옮기므로 여기서는 비어 보인다. -->
    <div
      ref="markerHost"
      class="hidden"
    >
      <button
        v-for="view in markerViews"
        :key="view.key"
        :ref="(el) => setMarkerEl(el, view.key)"
        type="button"
        class="flex cursor-pointer flex-col items-center"
        :aria-label="`${view.hospital.name} 선택`"
        :aria-current="view.state === 'selected' ? 'true' : undefined"
        @click="selectHospital(view.hospital)"
      >
        <span
          class="flex items-center gap-(--space-1) rounded-(--radius-full) border-2 border-(--color-white) px-(--space-2) py-[3px] shadow-(--shadow-md) transition-colors"
          :class="markerPillClasses[view.state]"
        >
          <IconEmergencyCross
            :size="14"
            :color="markerIconColors[view.state]"
            class="shrink-0"
          />
          <!-- 이름은 선택된 마커에만 붙인다. 전부 붙이면 라벨끼리 겹쳐서 못 읽는다 -->
          <span
            v-if="view.state === 'selected'"
            class="max-w-[120px] truncate text-(length:--font-sm) font-semibold"
          >
            {{ view.hospital.name }}
          </span>
          <span class="text-(length:--font-sm) font-bold whitespace-nowrap">
            {{ formatDistance(view.hospital.distanceKm) }}
          </span>
        </span>
        <!-- 말풍선 꼬리 — 알약만 떠 있으면 어느 지점을 가리키는지 모호하다 -->
        <span
          class="h-0 w-0 border-x-[5px] border-x-transparent border-t-[7px]"
          :class="markerTailClasses[view.state]"
        />
      </button>
    </div>

    <!-- 내 위치 마커는 병원 목록과 생명주기가 달라 host를 분리해 둔다 -->
    <div class="hidden">
      <span
        ref="userMarkerEl"
        class="block size-[16px] rounded-(--radius-full) border-[3px] border-(--color-white) bg-(--color-icon-blue) shadow-(--shadow-md)"
        aria-hidden="true"
      />
    </div>

    <HospitalPeekSheet
      v-model:expanded="isSheetExpanded"
      :hospitals="hospitals"
      :selected="selectedHospital"
      :is-loading="isLoading"
      :has-error="!!error"
      :is24h-filter="is24hOnly"
      @select="selectHospital"
      @call="handleCall"
      @navigate="handleNavigation"
      @retry="refreshHospitals"
    />
  </div>
</template>
