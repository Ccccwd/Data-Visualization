<script setup lang="ts">
import { onMounted, ref } from 'vue'

const props = withDefaults(defineProps<{ name: string; delay?: number }>(), {
  delay: 0,
})

const visible = ref(false)

onMounted(() => {
  setTimeout(() => { visible.value = true }, 100 + props.delay * 1000)
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
  width: 48px;
  height: 48px;
  opacity: 0;
  transform: scale(2) rotate(-12deg);
  transition: none;

  &.visible {
    animation: sealPress .6s cubic-bezier(.34, 1.56, .64, 1) forwards;
  }

  &__inner {
    width: 100%;
    height: 100%;
    border: 2px solid $cinnabar;
    border-radius: 2px;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    padding: 4px 5px;
  }
}

.seal-char {
  font-family: $font-display;
  font-size: 10px;
  color: $cinnabar;
  line-height: 1.1;
}

@keyframes sealPress {
  0%   { opacity: 0; transform: scale(2) rotate(-12deg); }
  45%  { opacity: 1; transform: scale(.92) rotate(1deg); }
  65%  { transform: scale(1.06) rotate(-.5deg); }
  100% { opacity: .85; transform: scale(1) rotate(0); }
}
</style>
