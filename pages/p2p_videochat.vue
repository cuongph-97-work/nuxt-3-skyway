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
      <VideoCallScreen :peer="peer" />
    </n-card>
  </n-modal>
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
const toolbarStore = useVideoStore()
const audios = ref([])
const videos = ref([])
const lazyStream = ref()
const isCalling = ref(false)
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
          toolbarStore.setStreamLocalVideo(stream)
          toolbarStore.currentLocalMDC = staticPeer.value?.call(
            form.remoteId,
            stream
          )
          toolbarStore.dataConnection = toolbarStore.staticPeer?.connect(
            form.remoteId
          )
          toolbarStore.dataConnection.on('data', ({ type, data }) => {
            console.log(type)
            if (type == 'trigger') {
              const { type: _type, message } = data
              if (_type == 'reject_call') {
                toolbarStore.currentLocalMDC.close(true)
                message.error('đối phương đã từ chối!')
              }
            }
          })
          // dataConnection.value = staticPeer.value?.connect(form.remoteId)
          // dataConnection.value.on('open', () => {
          //   isConnectedData.value = true
          // })
          toolbarStore.currentLocalMDC.on('stream', (remoteStream) => {
            // streamShareScreen(remoteStream)
            toolbarStore.setStreamRemoteVideo(remoteStream)
            // if (mediaConnection.open) {
            //   console.log(mediaConnection, mediaConnection.getPeerConnection())
            //   currentPeer.value = mediaConnection.getPeerConnection()
            // }
          })
          toolbarStore.currentLocalMDC.on('close', () => {
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
  const { audios: _audios, videos: _videos } = await getListMedia()
  audios.value = _audios
  videos.value = _videos
}
const staticPeer = computed(() => toolbarStore.getStaticPeer)
onMounted(async () => {
  const peer = new Peer({
    key: 'c16c9ba9-6443-4c5a-b950-5c57f7fe7a1e',
    debug: 0
  })
  toolbarStore.setStaticPeer(peer)
  staticPeer.value?.once('open', (id) => (peerId.value = id))
  staticPeer.value?.on('error', (err) => {
    console.error(`peer event error:`, err)
  })
  staticPeer.value?.on('disconnected', () => {
    console.log(`peer event disconnected`)
  })
  // Cài đặt sự kiện sắp tới
  staticPeer.value?.on('call', (mediaConnection) => {
    toolbarStore.dataConnection = toolbarStore.staticPeer.connect(
      mediaConnection.remoteId
    )
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
      chooseMedia()
        .then((stream) => {
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
          console.log(err + 'Unable to get media')
        })
    },
    onNegativeClick: () => {
      message.error('từ chối!')
      const data = {
        type: 'trigger',
        data: {
          type: 'reject_call',
          reason: 'từ chối!'
        }
      }
      console.log(toolbarStore.dataConnection)
      toolbarStore.dataConnection.send(data)
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
