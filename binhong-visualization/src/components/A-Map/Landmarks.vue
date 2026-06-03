<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'

const props = defineProps<{
  chart: any // ECharts instance
  visible: boolean
  /** Incremented each time the map view changes (zoom/pan/option update) */
  viewRevision: number
}>()

interface LandmarkDef {
  id: string
  geoCoords: [number, number]
  fallbackPx: [number, number]
}

const positioned = ref(false)

const landmarks: LandmarkDef[] = [
  { id: 'lm-greatwall', geoCoords: [116, 41], fallbackPx: [290, 100] },
  { id: 'lm-pagoda', geoCoords: [120.15, 30.6], fallbackPx: [400, 240] },
  { id: 'lm-pine', geoCoords: [118.5, 30.5], fallbackPx: [375, 250] },
  { id: 'lm-buddha', geoCoords: [103.77, 29.3], fallbackPx: [240, 310] },
  { id: 'lm-gorge', geoCoords: [109.5, 31.3], fallbackPx: [310, 240] },
  { id: 'lm-liriver', geoCoords: [110.5, 24.9], fallbackPx: [345, 440] },
  { id: 'lm-emei', geoCoords: [103.33, 29.8], fallbackPx: [235, 270] },
]

function positionLandmarks() {
  if (!props.chart || !props.visible) return
  landmarks.forEach((lm, _i) => {
    const el = document.getElementById(lm.id)
    if (!el) return
    try {
      const p = props.chart.convertToPixel('geo', lm.geoCoords)
      if (p) {
        el.style.left = (p[0] - 18) + 'px'
        el.style.top = (p[1] - 16) + 'px'
      }
    } catch {
      // fallback pixel coords
      el.style.left = (lm.fallbackPx[0] - 18) + 'px'
      el.style.top = (lm.fallbackPx[1] - 16) + 'px'
    }
  })
  positioned.value = true
}

onMounted(() => {
  setTimeout(positionLandmarks, 2500)
})

// Reposition whenever the chart instance changes
watch(() => props.chart, () => {
  setTimeout(positionLandmarks, 500)
})

// Reposition whenever the map view changes (zoom/pan/option update)
watch(() => props.viewRevision, () => {
  // Wait for ECharts to finish rendering the new geo state
  setTimeout(positionLandmarks, 100)
})
</script>

<template>
  <div v-if="visible" class="landmarks-layer">
    <!-- Great Wall -->
    <div class="landmark" id="lm-greatwall"><svg width="44" height="30" viewBox="0 0 44 30"><g stroke="rgba(74,67,58,.32)" stroke-width=".8" fill="none" stroke-linecap="round" filter="url(#landmark-texture)"><path d="M3 24L9 20 15 22 21 18 27 20 33 16 39 18 44 14"/><rect x="1" y="16" width="6" height="8" rx=".5"/><rect x="13" y="18" width="6" height="7" rx=".5"/><rect x="25" y="15" width="6" height="7" rx=".5"/><rect x="37" y="11" width="6" height="7" rx=".5"/></g><text x="22" y="30" text-anchor="middle" font-size="6.5" fill="rgba(74,67,58,.28)" font-family="ZCOOL XiaoWei,serif">长城</text></svg></div>
    <!-- Leifeng Pagoda -->
    <div class="landmark" id="lm-pagoda"><svg width="22" height="38" viewBox="0 0 22 38"><g stroke="rgba(74,67,58,.28)" stroke-width=".7" fill="none" stroke-linecap="round" filter="url(#landmark-texture)"><line x1="11" y1="2" x2="11" y2="7"/><circle cx="11" cy="2" r="1.3"/><path d="M4 7Q7 5 11 7Q15 5 18 7"/><path d="M5 13Q8 11 11 13Q14 11 17 13"/><path d="M6 19Q8.5 17 11 19Q13.5 17 16 19"/><path d="M7 25Q9 23 11 25Q13 23 15 25"/><line x1="7" y1="7" x2="7" y2="13"/><line x1="15" y1="7" x2="15" y2="13"/><line x1="8" y1="13" x2="8" y2="19"/><line x1="14" y1="13" x2="14" y2="19"/><line x1="9" y1="19" x2="9" y2="25"/><line x1="13" y1="19" x2="13" y2="25"/><rect x="7" y="25" width="8" height="4" rx=".5"/></g><text x="11" y="37" text-anchor="middle" font-size="6" fill="rgba(74,67,58,.24)" font-family="ZCOOL XiaoWei,serif">雷峰塔</text></svg></div>
    <!-- Welcome Pine -->
    <div class="landmark" id="lm-pine"><svg width="34" height="32" viewBox="0 0 34 32"><g stroke="rgba(74,67,58,.28)" stroke-width=".7" fill="none" stroke-linecap="round" filter="url(#landmark-texture)"><path d="M17 28Q16 20 15 16Q14 12 16 8"/><path d="M16 12Q9 10 5 12"/><ellipse cx="4" cy="11" rx="3.5" ry="2" fill="rgba(74,67,58,.05)" stroke="none"/><path d="M15 16Q23 13 27 15"/><ellipse cx="28" cy="14" rx="3.5" ry="1.8" fill="rgba(74,67,58,.05)" stroke="none"/><path d="M16 8Q11 5 7 7"/><ellipse cx="6" cy="6" rx="3" ry="1.8" fill="rgba(74,67,58,.05)" stroke="none"/><path d="M16 8Q21 4 25 6"/><ellipse cx="26" cy="5" rx="3" ry="1.8" fill="rgba(74,67,58,.05)" stroke="none"/><ellipse cx="15" cy="5" rx="3.5" ry="2.5" stroke="rgba(74,67,58,.12)" stroke-width=".4" fill="rgba(74,67,58,.03)"/><path d="M17 28Q13 29 11 31"/><path d="M17 28Q21 29 23 31"/></g><text x="17" y="32" text-anchor="middle" font-size="6" fill="rgba(74,67,58,.24)" font-family="ZCOOL XiaoWei,serif">迎客松</text></svg></div>
    <!-- Leshan Buddha -->
    <div class="landmark" id="lm-buddha"><svg width="26" height="34" viewBox="0 0 26 34"><g stroke="rgba(74,67,58,.22)" stroke-width=".6" fill="none" stroke-linecap="round" filter="url(#landmark-texture)"><circle cx="13" cy="7" r="4.5"/><circle cx="13" cy="7" r="6.5" stroke-dasharray="2 2" opacity=".35"/><path d="M8 12Q7 17 5 22Q4 26 5 30"/><path d="M18 12Q19 17 21 22Q22 26 21 30"/><path d="M5 18Q9 20 13 20Q17 20 21 18"/><path d="M3 30Q7 28 13 30Q19 28 23 30"/></g><text x="13" y="34" text-anchor="middle" font-size="5.5" fill="rgba(74,67,58,.2)" font-family="ZCOOL XiaoWei,serif">乐山大佛</text></svg></div>
    <!-- Kuimen Gorge -->
    <div class="landmark" id="lm-gorge"><svg width="38" height="26" viewBox="0 0 38 26"><g stroke="rgba(74,67,58,.25)" stroke-width=".7" fill="none" stroke-linecap="round" filter="url(#landmark-texture)"><path d="M4 4L4 22Q6 20 7 16L9 22"/><path d="M30 4L30 22Q28 20 27 16L25 22"/><path d="M11 22Q15 18 19 20Q23 18 27 22" stroke="rgba(74,67,58,.1)" stroke-width="1.2"/><path d="M2 4Q4 0 6 4" opacity=".5"/><path d="M28 4Q30 0 32 4" opacity=".5"/></g><text x="19" y="26" text-anchor="middle" font-size="5.5" fill="rgba(74,67,58,.2)" font-family="ZCOOL XiaoWei,serif">夔门</text></svg></div>
    <!-- Li River -->
    <div class="landmark" id="lm-liriver"><svg width="42" height="28" viewBox="0 0 42 28"><g stroke="rgba(184,58,46,.18)" stroke-width=".6" fill="none" stroke-linecap="round" filter="url(#landmark-texture)"><path d="M5 22Q7 8 9 4Q11 8 13 22" stroke="rgba(74,67,58,.22)"/><path d="M11 22Q13 12 16 6Q19 12 21 22" stroke="rgba(74,67,58,.2)"/><path d="M19 22Q21 14 24 8Q27 14 29 22" stroke="rgba(74,67,58,.22)"/><path d="M27 22Q29 16 31 12Q33 16 35 22" stroke="rgba(74,67,58,.18)"/><path d="M3 23Q13 21 23 23Q33 21 41 23" stroke="rgba(74,67,58,.08)" stroke-width=".8"/></g><text x="21" y="28" text-anchor="middle" font-size="5.5" fill="rgba(184,58,46,.25)" font-family="ZCOOL XiaoWei,serif">漓江山水</text></svg></div>
    <!-- Emei Mountain Gate -->
    <div class="landmark" id="lm-emei"><svg width="28" height="32" viewBox="0 0 28 32"><g stroke="rgba(74,67,58,.22)" stroke-width=".7" fill="none" stroke-linecap="round" filter="url(#landmark-texture)"><path d="M3 16L3 26M25 16L25 26"/><path d="M0 16Q7 10 14 14Q21 10 28 16"/><circle cx="14" cy="9" r="1.3"/><line x1="3" y1="20" x2="25" y2="20"/><path d="M9 20L9 26M19 20L19 26"/><path d="M9 20Q14 17 19 20"/><path d="M7 26L21 26M8 28L20 28"/></g><text x="14" y="32" text-anchor="middle" font-size="5.5" fill="rgba(74,67,58,.2)" font-family="ZCOOL XiaoWei,serif">峨眉山</text></svg></div>
  </div>
</template>

<style lang="scss" scoped>
.landmarks-layer {
  position: absolute;
  inset: 0;
  z-index: 6;
  pointer-events: none;
}
.landmark {
  position: absolute;
  opacity: 0;
  animation: fadeInLandmark 1.2s ease forwards;
  transition: left 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94),
              top 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}
@keyframes fadeInLandmark {
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0); }
}
</style>
