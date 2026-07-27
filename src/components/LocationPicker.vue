<script setup lang="ts">
// Interaktiv joylashuv tanlagich — landing "Ariza qoldiring" formasidagi
// xarita bilan bir xil ishlaydi: xaritaga bosib yoki markerni surib aniq
// joyni belgilash, manzil bo'yicha qidirish (Nominatim) va teskari geokodlash.
import { ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
import { getRegionCenter } from '@/data/uzRegions'

// Vite build'da Leaflet marker rasmlari to'g'ri chiqishi uchun
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
})

const props = defineProps<{
  latitude: number | null
  longitude: number | null
  /** Tanlangan viloyat value si — xarita boshlang'ich markazi uchun */
  region?: string
  invalid?: boolean
}>()

const emit = defineEmits<{
  (e: 'update', payload: { latitude: number; longitude: number; address?: string }): void
}>()

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org'

const mapRef = ref<HTMLElement | null>(null)
const mapReady = ref(false)
const foundAddress = ref('')

let map: L.Map | null = null
let placemark: L.Marker | null = null

/** Markerni yaratadi yoki mavjudini yangi koordinataga ko'chiradi */
function addPlacemark(coords: [number, number]) {
  if (!map) return
  if (placemark) {
    placemark.setLatLng(coords)
    return
  }
  placemark = L.marker(coords, { draggable: true }).addTo(map)
  placemark.on('dragend', () => {
    const { lat, lng } = placemark!.getLatLng()
    setLocation([lat, lng], false)
  })
}

/** Koordinatani yuqoriga uzatadi va markerni joylaydi */
function setLocation(coords: [number, number], pan = true) {
  addPlacemark(coords)
  if (pan && map) map.setView(coords, 16)
  emit('update', {
    latitude: Number(coords[0].toFixed(6)),
    longitude: Number(coords[1].toFixed(6)),
  })
  reverseGeocode(coords)
}

/** Koordinatadan o'qilishi mumkin bo'lgan manzilni topadi */
async function reverseGeocode(coords: [number, number]) {
  try {
    const res = await fetch(
      `${NOMINATIM_BASE}/reverse?format=json&lat=${coords[0]}&lon=${coords[1]}&accept-language=uz`,
    )
    if (!res.ok) return
    const data = await res.json()
    if (data.display_name) {
      foundAddress.value = data.display_name
      emit('update', {
        latitude: Number(coords[0].toFixed(6)),
        longitude: Number(coords[1].toFixed(6)),
        address: data.display_name,
      })
    }
  } catch {
    /* geokodlash muvaffaqiyatsiz bo'lsa jim o'tamiz */
  }
}

/** Tashqaridan chaqiriladi: manzil matni bo'yicha xaritadan qidiradi */
async function searchAddress(query: string) {
  if (!query || !query.trim()) return false
  try {
    const res = await fetch(
      `${NOMINATIM_BASE}/search?format=json&limit=1&countrycodes=uz&q=${encodeURIComponent(query)}`,
    )
    const results = res.ok ? await res.json() : []
    const first = results[0]
    if (first) {
      const coords: [number, number] = [parseFloat(first.lat), parseFloat(first.lon)]
      setLocation(coords, true)
      foundAddress.value = first.display_name
      return true
    }
  } catch {
    /* qidiruv muvaffaqiyatsiz */
  }
  return false
}

defineExpose({ searchAddress })

async function initMap() {
  await nextTick()
  if (!mapRef.value || map) return

  const hasCoords = props.latitude != null && props.longitude != null
  const center: [number, number] = hasCoords
    ? [props.latitude as number, props.longitude as number]
    : getRegionCenter(props.region ?? '')

  map = L.map(mapRef.value, { center, zoom: hasCoords ? 16 : 11, zoomControl: false })
  L.control.zoom({ position: 'bottomleft' }).addTo(map)

  // Sputnik (hybrid) + Ko'cha rejimlari — LocationMap.vue bilan bir xil
  const satellite = L.tileLayer(
    'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    { attribution: 'Tiles &copy; Esri', maxZoom: 19 },
  )
  const roads = L.tileLayer(
    'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}',
    { maxZoom: 19 },
  )
  const places = L.tileLayer(
    'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
    { maxZoom: 19 },
  )
  const hybrid = L.layerGroup([satellite, roads, places])
  const streets = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 19,
  })

  hybrid.addTo(map)
  L.control
    .layers({ '🛰 Sputnik': hybrid, "🗺 Ko'cha": streets }, undefined, { position: 'topright' })
    .addTo(map)

  mapReady.value = true
  if (hasCoords) addPlacemark(center)

  map.on('click', (e: L.LeafletMouseEvent) => setLocation([e.latlng.lat, e.latlng.lng], false))

  setTimeout(() => map && map.invalidateSize(), 200)
}

// Viloyat o'zgarsa va lokatsiya hali belgilanmagan bo'lsa — markazni ko'chiramiz
watch(
  () => props.region,
  (val) => {
    if (map && props.latitude == null) map.setView(getRegionCenter(val ?? ''), 11)
  },
)

onMounted(initMap)

onBeforeUnmount(() => {
  if (map) {
    map.remove()
    map = null
    placemark = null
  }
})
</script>

<template>
  <div>
    <div
      :class="[
        'relative w-full h-56 rounded-xl overflow-hidden border bg-muted/60 z-0',
        invalid ? 'border-destructive ring-2 ring-destructive/20' : 'border-border',
      ]"
    >
      <div ref="mapRef" class="absolute inset-0" />
      <div
        v-if="!mapReady"
        class="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground"
      >
        Xarita yuklanmoqda...
      </div>
    </div>

    <p v-if="foundAddress" class="text-xs text-primary mt-2 flex items-start gap-1.5">
      <span class="shrink-0">📍</span>
      <span>{{ foundAddress }}</span>
    </p>
    <p class="text-[11px] text-muted-foreground mt-1.5">
      Markerni surib yoki xaritaga bosib binoning aniq joyini belgilang.
    </p>
  </div>
</template>
