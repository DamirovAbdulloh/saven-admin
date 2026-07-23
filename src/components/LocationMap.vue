<script setup lang="ts">
// Biznes egasi landing arizasida xaritada belgilagan lokatsiyani ko'rsatадиган
// xarita (faqat ko'rish uchun). Sputnik (hybrid) va Ko'cha (OSM, POI'lar bilan)
// rejimlari o'rtasida almashtirish mumkin.
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

// Vite build'da Leaflet marker rasmlari to'g'ri chiqishi uchun
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
})

const props = defineProps<{
  latitude: number | string | null
  longitude: number | string | null
  label?: string
}>()

const mapRef = ref<HTMLElement | null>(null)
let map: L.Map | null = null

function coords(): [number, number] | null {
  const lat = Number(props.latitude)
  const lng = Number(props.longitude)
  if (!props.latitude || !props.longitude || isNaN(lat) || isNaN(lng)) return null
  return [lat, lng]
}

onMounted(() => {
  const c = coords()
  if (!mapRef.value || !c) return

  map = L.map(mapRef.value, { center: c, zoom: 16, scrollWheelZoom: false })

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
    .layers({ '🛰 Sputnik': hybrid, '🗺 Koʻcha': streets }, undefined, {
      position: 'topright',
    })
    .addTo(map)

  const marker = L.marker(c).addTo(map)
  if (props.label) marker.bindPopup(props.label)

  setTimeout(() => map && map.invalidateSize(), 200)
})

watch(
  () => [props.latitude, props.longitude],
  () => {
    const c = coords()
    if (map && c) map.setView(c, 16)
  },
)

onBeforeUnmount(() => {
  if (map) {
    map.remove()
    map = null
  }
})
</script>

<template>
  <div
    v-if="coords()"
    ref="mapRef"
    class="h-64 w-full rounded-xl overflow-hidden border border-border relative z-0"
  />
  <div
    v-else
    class="rounded-xl bg-muted/60 border border-border h-48 flex items-center justify-center text-sm text-muted-foreground"
  >
    Lokatsiya belgilanmagan
  </div>
</template>
