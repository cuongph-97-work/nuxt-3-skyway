<template>
  <n-message-provider></n-message-provider>
  <NAlert title="Video call 1 - 1">
    <template #icon>
      <NIcon>
        <VideocamOutline />
      </NIcon>
    </template>
  </NAlert>
  <div v-if="!calling">
    <n-card title="" size="medium" class="mt-5">
      <n-form ref="formRef" :label-width="80" :size="size" :model="data">
        <n-form-item label="Peer ID" class="mw-350px">
          <n-input v-model:value="data.peerId" :readonly="true" />
        </n-form-item>
        <n-form-item label="Chọn Camera" class="mw-350px" path="selectedVideo">
          <n-select :options="data.videos" v-model:value="data.selectedVideo" />
        </n-form-item>
        <n-form-item label="Chọn Micro" class="mw-350px" path="selectedAudio">
          <n-select v-model:value="data.selectedAudio" :options="data.audios" />
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
        <n-form-item label="Peer ID" class="mw-350px" path="remoteId">
          <n-input v-model:value="data.remoteId" />
        </n-form-item>
      </n-form>
      <n-button @click.stop="startCall"> Bắt đầu cuộc gọi </n-button>
    </n-card>
    <n-grid :x-gap="12" :cols="1" class="mt-5">
      <n-grid-item>
        <video
          ref="myVideo"
          class="video green"
          :srcObject="data.localStream"
          muted="true"
          autoplay
          playsinline
        />
      </n-grid-item>
    </n-grid>
  </div>
  <VideoCallScreen
    v-else
    :my-video-stream="data.localStream"
    :remote-video-stream="data.remoteVideoStream"
  />
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
  NLayout,
  useMessage,
  useDialog,
  NMessageProvider
} from 'naive-ui'
import { VideoCallScreen } from '~~/.nuxt/components'
const message = useMessage()
const dialog = useDialog()
const size = ref('medium')
const formRef = ref()
const formRef2 = ref()
const calling = ref(false)
const rules = {
  remoteId: {
    required: true,
    message: 'vui lòng nhập peer id',
    trigger: 'blur'
  }
}
const peer = ref()
const data = reactive({
  selectedAudio: null,
  selectedVideo: null,
  audios: [],
  videos: [],
  localStream: null,
  remoteVideo: null,
  peerId: '',
  remoteId: '',
  call: null
})

const prepareAudioVideoDevice = async () => {
  try {
    navigator.mediaDevices?.enumerateDevices().then((deviceInfos) => {
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
  } catch (e) {
    alert(`Error: No found enumerateDevices`)
  }
}
watch(
  () => data.selectedAudio,
  (val) => {
    if (val) connectLocalCamera()
  }
)
watch(
  () => data.selectedVideo,
  (val) => {
    if (val) connectLocalCamera()
  }
)
const startCall = () => {
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
      data.localStream = stream
      makeCall()
    })
    .catch((err) => {
      alert(`'mediaDevice.getUserMedia() error:' ${err}`)
    })
}
const connectLocalCamera = () => {
  const constraints = {
    audio:
      data.selectedAudio !== ''
        ? { deviceId: { exact: data.selectedAudio } }
        : true,
    video:
      data.selectedVideo !== ''
        ? { deviceId: { exact: data.selectedVideo } }
        : true
  }
  navigator.mediaDevices
    .getUserMedia(constraints)
    .then((stream) => {
      data.localStream = stream
    })
    .catch((err) => {
      console.error('mediaDevice.getUserMedia() error:', err)
    })
}
const makeCall = () => {
  const mediaConnection = peer.value.call(data.remoteId, data.localStream)
  calling.value = true
  mediaConnection.on('stream', async (stream) => {
    // Render remote stream for caller
    data.remoteVideoStream = stream
  })

  mediaConnection.once('close', () => {
    remoteVideo.srcObject.getTracks().forEach((track) => track.stop())
    data.remoteVideoStream = null
  })
  // closeTrigger.addEventListener('click', () => mediaConnection.close(true));
}
// const connectCall = (call) => {
//   endCall()
//   call.on('stream', (stream) => {
//     console.log('received stream')
//     data.remoteVideoStream = stream
//   })
//   data.call = call
//   calling.value = true
// }
// const endCall = (call) => {
//   if (data.call) {
//     data.call.close()
//     data.call = null
//   }
// }
onMounted(async () => {
  peer.value = new Peer({
    key: 'c16c9ba9-6443-4c5a-b950-5c57f7fe7a1e',
    debug: 3
  })
  peer.value.once('open', (id) => (data.peerId = id))
  peer.value.on('error', (err) => {
    console.error(`peer event error:`, err)
  })
  peer.value.on('disconnected', () => {
    console.log(`peer event disconnected`)
  })
  // Cài đặt sự kiện sắp tới
  peer.value.on('call', (mediaConnection) => {
    console.log(`peer event call`)
    hasCallRequest(mediaConnection)
  })
  await prepareAudioVideoDevice()
})
const hasCallRequest = (mediaConnection) => {
  dialog.success({
    title: 'Thông báo',
    content: 'Bạn có 1 cuộc gọi từ AAA',
    negativeText: 'Từ chối',
    positiveText: 'Chấp nhận',
    closeOnEsc: false,
    closable: false,
    onPositiveClick: () => {
      mediaConnection.answer(data.localStream)
      calling.value = true
      mediaConnection.on('stream', async (stream) => {
        // Render remote stream for callee
        data.remoteVideoStream = stream
      })

      mediaConnection.once('close', () => {
        data.remoteVideoStream = null
      })
    },
    onNegativeClick: () => {
      message.error('từ chối!')
      mediaConnection.close(true)
    }
  })
}
</script>
<style>
.mw-350px {
  max-width: 350px;
}
.light-green {
  height: 108px;
  background-color: rgba(0, 128, 0, 0.12);
}
.green {
  height: 108px;
  background-color: rgba(0, 128, 0, 0.24);
}
</style>
