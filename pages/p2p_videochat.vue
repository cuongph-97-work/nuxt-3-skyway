<template>
  <n-scrollbar style="max-height: calc(100vh - 120px); margin: 0 20px">
    <NAlert title="Video call 1 - 1">
      <template #icon>
        <NIcon>
          <VideocamOutline />
        </NIcon>
      </template>
    </NAlert>
    <n-card title="" size="medium" class="mt-5">
      <n-form ref="formRef" :label-width="80" :size="size">
        <n-form-item label="Peer ID" class="w-350px">
          <n-input v-model:value="data.peerId" :readonly="true" />
        </n-form-item>
        <n-form-item label="Chọn Camera" class="w-350px">
          <n-select
            v-model:value="data.selectedVideo"
            :options="data.videos"
            @on-update:value="changeAudioVideo"
          />
        </n-form-item>
        <n-form-item label="Chọn Micro" class="w-350px">
          <n-select
            v-model:value="data.selectedAudio"
            @on-update:value="changeAudioVideo"
            :options="data.audios"
          />
        </n-form-item>
      </n-form>
    </n-card>
    <n-card title="" size="medium" class="mt-5">
      Nhập Peer Id của đích kết nối để kết nối.
      <n-form
        ref="formRef2"
        :label-width="80"
        :size="size"
        :model="data"
        :rules="rules"
      >
        <n-form-item label="Peer ID" class="w-350px" path="callPeerId">
          <n-input v-model:value="data.callPeerId" />
        </n-form-item>
      </n-form>
      <!-- <n-button> Kết Nối </n-button> -->
      <n-button @click.stop="startVoice"> Start With Audio </n-button>
    </n-card>
    <n-grid :x-gap="12" :cols="2" class="mt-5">
      <n-grid-item>
        <video
          ref="myVideo"
          class="video green"
          muted="true"
          autoplay
          playsinline
        />
      </n-grid-item>
      <n-grid-item>
        <video
          ref="theirVideo"
          class="video light-green"
          autoplay
          playsinline
        />
      </n-grid-item>
    </n-grid>
  </n-scrollbar>
</template>
<script language="ts" setup>
import Peer from 'skyway-js'
import {
  BookmarkOutline,
  CaretDownOutline,
  VideocamOutline,
  HomeOutline as HomeIcon
} from '@vicons/ionicons5'
import {
  NScrollbar,
  NGrid,
  NGridItem,
  NSpace,
  NIcon,
  NCard,
  NAlert,
  NForm,
  NFormItem,
  NInput,
  NSelect,
  NButton,
  NLayout
} from 'naive-ui'
const size = ref('medium')
const formRef = ref()
const formRef2 = ref()
const theirVideo = ref()
const myVideo = ref()
const rules = {
  callPeerId: {
    required: true,
    message: 'vui lòng nhập peer id',
    trigger: 'blur'
  }
}
const data = reactive({
  peer: null,
  selectedAudio: null,
  selectedVideo: null,
  audios: [],
  videos: [],
  localStream: null,
  theirStream: null,
  peerId: '',
  callPeerId: '',
  call: null
})

const prepareAudioVideoDevice = async () => {
  return navigator.mediaDevices.enumerateDevices().then((deviceInfos) => {
    const _audios = []
    const _videos = []
    if (!deviceInfos?.length) {
      _audios.push({ label: 'không xác định', value: '' })
      _videos.push({ label: 'không xác định', value: '' })
    } else {
      for (const i in deviceInfos) {
        const deviceInfo = deviceInfos[i]
        if (deviceInfo.kind === 'audioinput') {
          _audios.push({
            label: deviceInfo.label || `Microphone ${data.audios.length + 1}`,
            value: deviceInfo.deviceId
          })
        } else if (deviceInfo.kind === 'videoinput') {
          _videos.push({
            label: deviceInfo.label || `Camera  ${data.videos?.length + 1}`,
            value: deviceInfo.deviceId
          })
        }
      }
    }
    data.audios = _audios
    data.videos = _videos
  })
}
const changeAudioVideo = () => {
  nextTick(() => {
    connectLocalCamera()
  })
}
// const startDisplay = () => {
//   if (!navigator.mediaDevices.getDisplayMedia) {
//     alert(`Error: Your device cannot use this type of stream.`)
//     return
//   }
//   navigator.mediaDevices
//     .getDisplayMedia()
//     .then((stream) => {
//       this.localStream = stream
//     })
//     .then(this.joinRoom)
//     .catch((err) => {
//       alert(`Error: Your device cannot use this type of stream.`)
//     })
// }
// const startVideo = () => {
//   navigator.mediaDevices
//     .getUserMedia({ video: true, audio: true })
//     .then((stream) => {
//       this.localStream = stream
//     })
//     .then(this.joinRoom)
//     .catch((err) => {
//       alert(`Error: Your device cannot use this type of stream.`)
//     })
// }
const startVoice = (e) => {
  e.preventDefault()
  formRef2.value?.validate((errors) => {
    if (!errors) {
      navigator.mediaDevices
        .getUserMedia({ video: false, audio: true })
        .then((stream) => {
          data.localStream = stream
        })
        .then(makeCall())
        .catch((err) => {
          alert(`Error: Your device cannot use this type of stream.`)
        })
    }
  })
}
const connectLocalCamera = () => {
  const constraints = {
    audio: data.selectedAudio
      ? { deviceId: { exact: data.selectedAudio } }
      : true,
    video: data.selectedVideo
      ? { deviceId: { exact: data.selectedVideo } }
      : true
  }
  navigator.mediaDevices
    .getUserMedia(constraints)
    .then((stream) => {
      prepareAudioVideoDevice()
      data.localStream = stream
      nextTick(() => {
        myVideo.value.srcObject = stream
      })
    })
    .catch((err) => {
      console.error('mediaDevice.getUserMedia() error:', err)
    })
}
const makeCall = () => {
  const call = data.peer.call(data.callPeerId, data.localStream)
  connectCall(call)
}
const connectCall = (call) => {
  endCall()
  call.on('stream', (stream) => {
    data.theirStream = stream
    nextTick(() => {
      //   this.$refs.theirVideo.srcObject = stream
      //   this.$refs.theirVideo.play()
    })
  })
  data.call = call
}
const endCall = (call) => {
  if (data.call) {
    data.call.close()
    data.call = null
  }
}
onMounted(async () => {
  data.peer = new Peer({
    key: 'c16c9ba9-6443-4c5a-b950-5c57f7fe7a1e',
    debug: 3
  })
  data.peer.on('open', (peerId) => {
    data.peerId = peerId
  })
  data.peer.on('error', (err) => {
    console.error(`peer event error:`, err)
  })
  data.peer.on('disconnected', () => {
    console.log(`peer event disconnected`)
  })
  // Cài đặt sự kiện sắp tới
  data.peer.on('call', (call) => {
    console.log(`peer event call`)
    call.answer(data.localStream)
    connectCall(call)
  })
  await prepareAudioVideoDevice()
})
</script>
<style>
.w-350px {
  width: 350px;
}
.light-green {
  height: 108px;
  background-color: rgba(0, 128, 0, 0.12);
}
.green {
  height: 108px;
  background-color: rgba(0, 128, 0, 0.24);
}
.video {
  width: 100%;
  height: 100%;
}
</style>
