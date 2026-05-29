<script setup lang="ts">
import InkMap from './components/A-Map/InkMap.vue'
import DocumentCard from './components/B-Narrative/DocumentCard.vue'
import RelationshipGraph from './components/C-Graph/RelationshipGraph.vue'
import TimelineRuler from './components/D-Timeline/TimelineRuler.vue'
</script>

<template>
  <div class="dashboard">
    <div class="dashboard__main">
      <div class="dashboard__left">
        <InkMap />
      </div>
      <div class="dashboard__right">
        <div class="dashboard__right-top">
          <DocumentCard />
        </div>
        <div class="dashboard__right-bottom">
          <RelationshipGraph />
        </div>
      </div>
    </div>
    <div class="dashboard__bottom">
      <TimelineRuler />
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use './styles/variables' as *;

.dashboard {
  width: $screen-width;
  height: $screen-height;
  display: flex;
  flex-direction: column;
  background-color: $rice-paper;
  overflow: hidden;

  &__main {
    flex: 1;
    display: flex;
    height: $main-height;
  }

  &__left {
    width: 50%;
    height: 100%;
    position: relative;
  }

  &__right {
    width: 50%;
    height: 100%;
    display: flex;
    flex-direction: column;

    &-top {
      height: 50%;
      border-left: 1px solid $ink-faint;
      border-bottom: 1px solid $ink-faint;
    }

    &-bottom {
      height: 50%;
      border-left: 1px solid $ink-faint;
      background-color: $parchment-shadow;
    }
  }

  &__bottom {
    height: $timeline-height;
    border-top: 2px solid $ink-faint;
  }
}
</style>
