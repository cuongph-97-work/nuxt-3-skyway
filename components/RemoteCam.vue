<script setup lang="ts">
import { useVideoStore } from '~~/stores/video'

const toolbarStore = useVideoStore()
const remoteVideoStream = computed(() => toolbarStore.getRemoteVideoStream)
</script>
<template>
  <div class="cam-container">
    <div class="video">
      <video
        ref="remoteVideoRef"
        muted="true"
        :srcObject="remoteVideoStream"
        playsinline
        autoplay
      ></video>
    </div>
    <div class="content">
      <span class="name">{{
        (toolbarStore.remoteMetadata as any)?.name || 'Anonymous'
      }}</span>
    </div>
  </div>
</template>
<style lang="scss"></style>
