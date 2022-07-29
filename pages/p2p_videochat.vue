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
      <n-button @click.stop="callPeer" :disabled="!peerId">
        Bắt đầu cuộc gọi
      </n-button>
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
      <VideoCallScreen :peer="peer" />
    </n-card>
  </n-modal>
  <audio controls hidden loop ref="ringAudioRef">
    <source src="../assets/audio/ring.mp3" type="audio/mpeg" />
  </audio>
</template>
<script language="ts" setup>
import Peer, { MediaConnection } from 'skyway-js'
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
import { useVideoStore } from '~~/stores/video'
const message = useMessage()
const dialog = useDialog()
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
const ringAudioRef = ref()
const toolbarStore = useVideoStore()
const lazyStream = ref()
const isCalling = ref(false)
/**
 * choose media
 */
const chooseMedia = () => {
  if (navigator.mediaDevices && 'getDisplayMedia' in navigator.mediaDevices) {
    return navigator.mediaDevices.getUserMedia({
      video: !!toolbarStore.videos.length,
      audio: !!toolbarStore.audios.length
    })
  } else {
    alert('getDisplayMedia is not supported')
  }
}

const localConnectData = (peer, remoteId) => {
  if (!peer.open) {
    return
  }
  const dataConnection = peer.connect(remoteId)
  toolbarStore.dataConnection = dataConnection
  dataConnection.once('open', async () => {
    dataConnection.send(`=== DataConnection has been opened ===\n`)
  })

  dataConnection.on('data', (data) => {
    console.log(data)
    if (data?.type == 'trigger') {
      const { type: _type, reason } = data.data
      if (['reject_call', 'error'].includes(_type)) {
        isCalling.value = false
        toolbarStore.resetAllStream()
        toolbarStore.currentLocalMDC.close(true)
        message.error(reason)
      }
    }
  })

  dataConnection.once('close', () => {
    dataConnection.send(`=== DataConnection has been closed ===\n`)
  })
}
const remoteConnectData = (dataConnection) => {
  toolbarStore.dataConnection = dataConnection
  dataConnection.once('open', async () => {
    dataConnection.send(`=== DataConnection has been opened ===\n`)
  })

  dataConnection.on('data', (data) => {
    console.log(`Remote: ${data}\n`)
  })

  dataConnection.once('close', () => {
    dataConnection.send(`=== DataConnection has been closed ===\n`)
  })
}
/**
 * call peer
 */
const callPeer = () => {
  toolbarStore.isConnected = false
  formRef.value?.validate((errors) => {
    if (!errors) {
      chooseMedia()?.then((stream) => {
        isCalling.value = true
        nextTick(() => {
          lazyStream.value = stream
          toolbarStore.setStreamLocalVideo(stream)
          toolbarStore.currentLocalMDC = staticPeer.value?.call(
            form.remoteId,
            stream,
            {
              metadata: {
                name: 'Cường Phan',
                type: 'call'
              }
            }
          )
          toolbarStore.remoteId = form.remoteId
          localConnectData(staticPeer.value, form.remoteId)
          toolbarStore.currentLocalMDC.on('stream', (remoteStream) => {
            toolbarStore.isConnected = true
            toolbarStore.setStreamRemoteVideo(remoteStream)
          })
          toolbarStore.currentLocalMDC.on('close', () => {
            toolbarStore.isConnected = false
            isCalling.value = false
            nextTick(() => {
              message.error('cuộc gọi đã kế t thúc')
              toolbarStore.resetAllStream()
            })
          })
        })
      })
    } else {
      console.log(errors)
    }
  })
}
const prepareAudioVideoDevice = async () => {
  const { audios, videos } = await getListMedia()
  if (audios.length || videos.length) {
    toolbarStore.audios = audios
    toolbarStore.videos = videos
  } else {
    alert('no audioinput & no videoinput')
  }
}
const staticPeer = computed(() => toolbarStore.getStaticPeer)
const initPeer = async () => {
  const peer = new Peer({
    key: 'c16c9ba9-6443-4c5a-b950-5c57f7fe7a1e',
    debug: 0
  })
  toolbarStore.setStaticPeer(peer)
  peer.once('open', (id) => (peerId.value = id))
  peer.on('error', (err) => {
    console.error(`peer event error:`, err)
  })
  peer.on('disconnected', () => {
    console.log(`peer event disconnected`)
  })
  // Cài đặt sự kiện sắp tới
  peer.on('call', (mediaConnection) => {
    toolbarStore.remoteMetadata = mediaConnection.metadata
    if (mediaConnection.metadata.type == 'call') {
      ringAudioRef.value?.play()
      hasCallRequest(mediaConnection)
    }
    if (mediaConnection.metadata.type == 'share_screen') {
      mediaConnection.on('close', () => {
        toolbarStore.stopShareScreen()
      })
      mediaConnection.answer(null)
      mediaConnection.on('stream', (remoteStream) => {
        toolbarStore.setStreamShareVideo(remoteStream)
        toolbarStore.isRemoteSharing = true
      })
      mediaConnection.on('close', () => {
        console.log('close share')
        toolbarStore.stopShareScreen()
        toolbarStore.isRemoteSharing = false
      })
    }
  })
  peer.on('connection', (dataConnection) => {
    remoteConnectData(dataConnection)
  })
  await prepareAudioVideoDevice()
}
onMounted(async () => {
  const route = useRoute()
  form.remoteId = route.query.remote_id
  await initPeer()
})
const hasCallRequest = (mediaConnection) => {
  toolbarStore.isConnected = true
  dialog.success({
    title: 'Thông báo',
    content: 'Bạn có 1 cuộc gọi từ ' + mediaConnection.metadata.name,
    negativeText: 'Từ chối',
    positiveText: 'Chấp nhận',
    closeOnEsc: false,
    closable: false,
    onPositiveClick: () => {
      chooseMedia()
        ?.then((stream) => {
          ringAudioRef.value.pause()
          isCalling.value = true
          lazyStream.value = stream
          toolbarStore.setStreamLocalVideo(stream)
          mediaConnection.answer(stream)
          mediaConnection.on('stream', (remoteStream) => {
            toolbarStore.setStreamRemoteVideo(remoteStream)
          })
          toolbarStore.currentRemoteMDC = mediaConnection
          mediaConnection.on('close', () => {
            isCalling.value = false
            nextTick(() => {
              message.error('cuộc gọi đã kế t thúc')
              toolbarStore.resetAllStream()
            })
          })
        })
        .catch((err) => {
          alert(err + 'Unable to get media')
          const data = {
            type: 'trigger',
            data: {
              type: 'error',
              reason: 'đối phương đã xảy ra lỗi'
            }
          }
          ringAudioRef.value.pause()
          toolbarStore.dataConnection?.send(data)
          console.log(err + 'Unable to get media')
        })
    },
    onNegativeClick: () => {
      message.error('từ chối!')
      const data = {
        type: 'trigger',
        data: {
          type: 'reject_call',
          reason: 'đối phương đã từ chối!'
        }
      }
      ringAudioRef.value.pause()
      toolbarStore.dataConnection?.send(data)
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
