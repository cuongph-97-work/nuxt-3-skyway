import { DataConnection, MediaConnection } from 'skyway-js'

export const useVideoStore = defineStore('video_call', {
  state: () => ({
    toolbarDisabled: false,
    isSharing: false,
    isConnected: false,
    isRemoteSharing: false,
    audios: [],
    videos: [],
    micOn: true,
    shareOn: false,
    videoOn: true,
    remoteId: null,
    localVideoStream: null as unknown as MediaStream,
    remoteVideoStream: null as unknown as MediaStream,
    localScreenStream: null as unknown as MediaStream,
    remoteScreenStream: null as unknown as MediaStream,
    staticPeer: null as unknown,
    currentLocalMDC: null as unknown as MediaConnection,
    currentRemoteMDC: null as unknown as MediaConnection,
    currentLocalShareMDC: null as unknown as MediaConnection,
    dataConnection: null as unknown as DataConnection,
    remoteMetadata: null as unknown,
    currentShareMDC: null as unknown as MediaConnection
  }),
  getters: {
    getStatusToolbar: (state) => ({
      micOn: state.micOn,
      shareOn: state.shareOn,
      videoOn: state.videoOn
    }),
    getLocalVideoStream: (state) => state.localVideoStream,
    getRemoteVideoStream: (state) => state.remoteVideoStream,
    getRemoteScreenStream: (state) => state.remoteScreenStream,
    getStaticPeer: (state) => state.staticPeer
  },
  actions: {
    setStaticPeer(peer: any) {
      this.staticPeer = peer
    },
    toggleShareBtn() {
      this.shareOn = !this.shareOn
    },
    toggleMicBtn() {
      this.micOn = !this.micOn
    },
    toggleVideoBtn() {
      this.videoOn = !this.videoOn
    },
    setStreamLocalVideo(stream: any) {
      this.localVideoStream = stream
    },
    setStreamRemoteVideo(stream: any) {
      this.remoteVideoStream = stream
    },
    setStreamShareVideo(stream: any) {
      this.remoteScreenStream = stream
    },
    stopShareScreen() {
      this.remoteScreenStream?.getTracks().forEach((track: any) => track.stop())
    },
    resetAllStream() {
      this.remoteScreenStream?.getTracks().forEach((track: any) => track.stop())
      this.remoteVideoStream?.getTracks().forEach((track: any) => track.stop())
      this.localVideoStream?.getTracks().forEach((track: any) => track.stop())
    }
  }
})
