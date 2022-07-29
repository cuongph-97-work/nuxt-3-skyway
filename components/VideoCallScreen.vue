<template>
  <n-spin :show="false">
    <template #description> đang đợi đối phương chấp nhận... </template>
    <div class="fullscreen-media-container video overlay">
      <video
        v-if="toolbar.shareOn || toolbarStore.isRemoteSharing"
        ref="shareScreenRef"
        :srcObject="remoteScreenStream"
        autoplay
        playsinline
        id="share-screen"
        oncontextmenu="return false;"
      ></video>
      <video
        v-else
        ref="remoteVideoRef"
        :srcObject="remoteVideoStream"
        autoplay
        playsinline
        mute=""
        id="remote-screen"
        oncontextmenu="return false;"
      ></video>
      <div class="overlay-content-container">
        <PartnerText />
        <ToolbarVideoCall />
        <div class="cam-section">
          <RemoteCam v-if="toolbar.shareOn || toolbarStore.isRemoteSharing" />
          <MyCam />
        </div>
      </div>
    </div>
  </n-spin>
</template>
<script setup lang="ts">
import { NSpin } from 'naive-ui'
import { useVideoStore } from '~~/stores/video'
const toolbarStore = useVideoStore()
const toolbar = computed(() => toolbarStore.getStatusToolbar)
const remoteVideoStream = computed(() => toolbarStore.getRemoteVideoStream)
const remoteScreenStream = computed(() => toolbarStore.getRemoteScreenStream)

const remoteVideoRef = ref()
const shareScreenRef = ref()
const emits = defineEmits(['onChangeToolbar'])
const toolbarConfig = reactive({
  shareScreen: {
    status: false,
    videoTrack: null,
    stream: null
  }
})
</script>
<style lang="scss">
@import '../assets/css/video_call_style.scss';
.__spin-m {
  --n-bezier: cubic-bezier(0.4, 0, 0.2, 1);
  --n-opacity-spinning: 0.5;
  --n-size: 34px;
  --n-color: #efefef !important;
  --n-text-color: #ffffff !important;
}
</style>
