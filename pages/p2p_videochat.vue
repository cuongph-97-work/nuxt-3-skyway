<template>
  <n-message-provider></n-message-provider>
  <NAlert title="Video call 1 - 1">
    <template #icon>
      <NIcon>
        <VideocamOutline />
      </NIcon>
    </template>
  </NAlert>
  <div>
    <n-card title="" size="medium" class="mt-5">
      <n-form :label-width="80">
        <n-form-item label="Peer ID" class="mw-350px">
          <n-input v-model:value="peerId" :readonly="true" />
        </n-form-item>
      </n-form>
    </n-card>
    <n-card title="" size="medium">
      Nhập Peer Id của đích kết nối để kết nối.
      <n-form ref="formRef" :label-width="80" :rules="rules" :model="form">
        <n-form-item label="Peer ID" class="mw-350px" path="remoteId">
          <n-input v-model:value="form.remoteId" />
        </n-form-item>
      </n-form>
      <n-button @click.stop="callPeer"> Bắt đầu cuộc gọi </n-button>
    </n-card>
  </div>
  <n-modal v-model:show="isCalling">
    <n-card
      class="video-container"
      style="width: 98%"
      :bordered="false"
      size="huge"
      role="dialog"
      aria-modal="true"
      loading
      close-on-esc="false"
      mask-closable="false"
    >
      <VideoCallScreen
        @on-change-toolbar="onChangeToolbar"
        :my-video-stream="localVideoStream"
        :remote-video-stream="remoteVideoStream"
        :remote-share-stream="remoteShareScreenStream"
      />
    </n-card>
  </n-modal>
</template>
<script language="ts" setup>
import Peer from 'skyway-js'
import { VideocamOutline, HomeOutline as HomeIcon } from '@vicons/ionicons5'
import { getListMedia } from '../utils/helper'
import {
  NGrid,
  NGridItem,
  NModal,
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
const calling = ref(false)
const formRef = ref()
const rules = {
  remoteId: {
    required: true,
    message: 'vui lòng nhập peer id',
    trigger: 'blur'
  }
}
const peer = ref()
const peerId = ref()
const form = reactive({
  remoteId: ''
})
const audios = ref([])
const videos = ref([])
const currentPeer = ref()
const lazyStream = ref()
const peerList = reactive([])
const remoteVideoStream = ref()
const localVideoStream = ref()
const isCalling = ref(false)
const existingCall = ref()
const remoteShareScreenStream = ref()
const dataConnection = ref()
const isConnectedData = ref(false)
/**
 * choose media
 */
const chooseMedia = () => {
  return navigator.mediaDevices.getUserMedia({
    video: !!videos.value.length,
    audio: !!audios.value.length
  })
}
/**
 * call peer
 */
const callPeer = () => {
  formRef.value?.validate((errors) => {
    if (!errors) {
      chooseMedia().then((stream) => {
        isCalling.value = true
        nextTick(() => {
          lazyStream.value = stream
          streamLocalVideo(stream)
          const mediaConnection = peer.value.call(form.remoteId, stream)
          dataConnection.value = peer.value.connect(form.remoteId)
          dataConnection.value.on('open', () => {
            isConnectedData.value = true
          })
          mediaConnection.on('stream', (remoteStream) => {
            streamShareScreen(remoteStream)
            // streamRemoteVideo(remoteStream)
            // if (mediaConnection.open) {
            //   console.log(mediaConnection, mediaConnection.getPeerConnection())
            //   currentPeer.value = mediaConnection.getPeerConnection()
            // }
          })
          existingCall.value = mediaConnection
          mediaConnection.once('close', () => {
            stream.getTracks().forEach((track) => track.stop())
            streamLocalVideo(null)
          })
        })
      })
    } else {
      console.log(errors)
    }
  })
}
/**
 * listen datachanel
 */
dataConnection.value.on('data', (data) => {
  if (data?.share?.off) {
  }
})

/**
 * stream remote video
 */
const streamRemoteVideo = (remoteStream) => {
  remoteVideoStream.value = remoteStream
}
const streamShareScreen = (remoteStream) => {
  remoteShareScreenStream.value = remoteStream
}
const streamLocalVideo = (localStream) => {
  localVideoStream.value = localStream
}
/**
 * listen for incoming
 */
const addListenerPeer = (peer) => {
  peer.on('call', (mediaConnection) => {
    hasCallRequest(mediaConnection)
  })
}

const onChangeToolbar = (data) => {
  if (data?.shareScreen) {
    const {
      status,
      videoTrack: _videoTrack,
      stream: _stream
    } = data.shareScreen
    /** status share */
    if (status) {
      /** share screen */
      // console.log(currentPeer.value)
      // const sender = currentPeer.value
      //   .getSenders()
      //   .find((s) => s.track.kind === _videoTrack.kind)
      if (existingCall.value) {
        console.log('===========> replace stream call')
        existingCall.value.replaceStream(_stream)
      }
    } else {
      /** stop share */
      // const videoTrack = lazyStream.value.getVideoTracks()[0]
      // console.log(lazyStream.value.getVideoTracks(), videoTrack)
      // console.log('video track kind: ' + videoTrack?.kind)
      // if (currentPeer.value && videoTrack) {
      //   const sender = currentPeer.value
      //     .getSenders()
      //     .find((s) => s.track.kind === videoTrack.kind)
      //   sender?.replaceTrack(videoTrack)
      // }
      const streamEmpty = new MediaStream()
      existingCall.value.replaceStream(streamEmpty)
    }
  }
}
const prepareAudioVideoDevice = async () => {
  const { audios: _audios, videos: _videos } = await getListMedia()
  audios.value = _audios
  videos.value = _videos
}

onMounted(async () => {
  peer.value = new Peer({
    key: 'c16c9ba9-6443-4c5a-b950-5c57f7fe7a1e',
    debug: 3
  })

  peer.value.once('open', (id) => (peerId.value = id))
  peer.value.on('error', (err) => {
    console.error(`peer event error:`, err)
  })
  peer.value.on('disconnected', () => {
    console.log(`peer event disconnected`)
  })
  // Cài đặt sự kiện sắp tới
  addListenerPeer(peer.value)
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
      chooseMedia()
        .then((stream) => {
          isCalling.value = true
          lazyStream.value = stream
          streamLocalVideo(stream)
          mediaConnection.answer(stream)
          mediaConnection.on('stream', (remoteStream) => {
            console.log('==========>: ', remoteStream)
            // if (!peerList.includes(mediaConnection.remoteId)) {
            streamShareScreen(remoteStream)
            // currentPeer.value = mediaConnection.remoteIdConnection
            // peerList.push(mediaConnection.remoteId)
            // }
          })
          existingCall.value = mediaConnection
          mediaConnection.once('close', () => {
            // remoteVideoStream.value = null
            remoteShareScreenStream.value = null
          })
        })
        .catch((err) => {
          console.log(err + 'Unable to get media')
        })
    },
    onNegativeClick: () => {
      message.error('từ chối!')
      mediaConnection.close(true)
    }
  })
}
</script>
<style lang="scss">
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
.video-container .n-card__content {
  padding: 0 !important;
}
</style>
