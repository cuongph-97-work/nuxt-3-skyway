<script setup lang="ts">
import { useVideoStore } from '~~/stores/video'

const toolbarStore = useVideoStore()
const localVideoStream = computed(() => toolbarStore.getLocalVideoStream)
</script>
<template>
  <div class="cam-container">
    <div class="video">
      <video
        ref="myVideoRef"
        muted="true"
        :srcObject="localVideoStream"
        playsinline
        autoplay
      ></video>
    </div>
    <div class="content">
      <span class="name">You</span>
    </div>
  </div>
</template>
<style lang="scss"></style>
