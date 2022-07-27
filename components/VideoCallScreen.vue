<template>
  <div class="fullscreen-media-container video overlay">
    <video ref="remoteVideoRef" autoplay playsinline></video>
    <div class="overlay-content-container">
      <PartnerText />
      <ToolbarVideoCall />
      <MyCam :src="props.myVideoStream" />
    </div>
  </div>
</template>
<script setup lang="ts">
import { NGrid, NGridItem } from 'naive-ui'
interface Props {
  myVideoStream: any
  remoteVideoStream: any
}
const remoteVideoRef = ref()
const props = defineProps<Props>()
onMounted(() => {
  watch(
    () => props.remoteVideoStream,
    (stream) => {
      if (stream) {
        remoteVideoRef.value.srcObject = stream
        remoteVideoRef.value.play()
      } else {
        remoteVideoRef.value.srcObject
          .getTracks()
          .forEach((track: any) => track.stop())
      }
    }
  )
})
</script>
<style lang="scss">
@import '../assets/css/video_call_style.scss';
</style>
