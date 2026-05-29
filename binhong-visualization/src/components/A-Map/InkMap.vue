<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useGlobalStore } from '../../stores/globalStore'

const store = useGlobalStore()
const mapContainer = ref<HTMLDivElement>()
let map: L.Map | null = null
const markers = new Map<string, L.Marker>()

const defaultView: [number, number] = [32.0, 110.0]
const defaultZoom = 5

onMounted(() => {
  if (!mapContainer.value) return

  map = L.map(mapContainer.value, {
    center: defaultView,
    zoom: defaultZoom,
    zoomControl: false,
    attributionControl: false,
  })

  // De-saturated tile layer for ink-wash look
  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    maxZoom: 18,
  }).addTo(map)

  // Add CSS filter to tile pane
  const tilePane = mapContainer.value.querySelector('.leaflet-tile-pane') as HTMLElement
  if (tilePane) {
    tilePane.style.filter = 'saturate(0.1) sepia(0.3) brightness(1.1)'
  }
})

// Create ink-wash marker icon
function createInkIcon(active = false): L.DivIcon {
  const size = active ? 50 : 30
  return L.divIcon({
    className: 'ink-marker',
    html: `<div class="ink-dot ${active ? 'active' : ''}" style="width:${size}px;height:${size}px;"></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  })
}

// Update markers when filtered data changes
watch(() => store.activeLocations, (locations) => {
  if (!map) return

  // Remove old markers
  markers.forEach(m => map!.removeLayer(m))
  markers.clear()

  // Add new markers
  locations.forEach(loc => {
    if (!loc.coords) return
    const marker = L.marker([loc.coords[0], loc.coords[1]], {
      icon: createInkIcon(),
    })
    marker.on('click', () => store.selectLocation(loc.name))
    marker.addTo(map!)
    markers.set(loc.name, marker)
  })
}, { deep: true })

// Fly to location when active entry changes
watch(() => store.activeEntry, (entry) => {
  if (!map || !entry) return
  const loc = entry.locations[0]
  if (loc?.coords) {
    map.flyTo([loc.coords[0], loc.coords[1]], 8, { duration: 1.5 })
  }
})
</script>

<template>
  <div ref="mapContainer" class="ink-map"></div>
</template>

<style lang="scss" scoped>
.ink-map {
  width: 100%;
  height: 100%;
  background-color: #F4F1EA;
}

:deep(.ink-marker) {
  background: none;
  border: none;
}

:deep(.ink-dot) {
  border-radius: 50%;
  background: radial-gradient(circle,
    rgba(44, 44, 44, 0.9) 0%,
    rgba(90, 90, 90, 0.6) 40%,
    rgba(139, 139, 139, 0.2) 70%,
    transparent 100%
  );

  &.active {
    animation: ink-pulse 1.5s ease-out;
  }
}

@keyframes ink-pulse {
  0% { transform: scale(0.3); opacity: 0; }
  50% { transform: scale(1.4); opacity: 0.8; }
  100% { transform: scale(1); opacity: 1; }
}
</style>
