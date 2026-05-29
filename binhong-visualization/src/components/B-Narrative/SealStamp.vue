<script setup lang="ts">
import { onMounted, ref } from 'vue'

const props = defineProps<{ name: string }>()
const visible = ref(false)

onMounted(() => {
  setTimeout(() => { visible.value = true }, 100)
})
</script>

<template>
  <div class="seal-stamp" :class="{ visible }">
    <div class="seal-stamp__inner">
      <span v-for="(char, i) in name.split('')" :key="i" class="seal-char">{{ char }}</span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '../../styles/variables' as *;

.seal-stamp {
  width: 56px;
  height: 56px;
  opacity: 0;
  transform: scale(2) rotate(-15deg);
  transition: none;

  &.visible {
    animation: seal-stamp 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
  }

  &__inner {
    width: 100%;
    height: 100%;
    border: 2px solid $cinnabar;
    border-radius: 4px;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    padding: 4px;
  }
}

.seal-char {
  font-family: $font-calligraphy;
  font-size: 14px;
  color: $cinnabar;
  line-height: 1;
  writing-mode: vertical-rl;
}

@keyframes seal-stamp {
  0% {
    opacity: 0;
    transform: scale(2) rotate(-15deg);
  }
  50% {
    opacity: 1;
    transform: scale(0.95) rotate(2deg);
  }
  75% {
    transform: scale(1.05) rotate(-1deg);
  }
  100% {
    opacity: 1;
    transform: scale(1) rotate(0deg);
  }
}
</style>
