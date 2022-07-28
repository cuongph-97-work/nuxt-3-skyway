export function checkDeviceSupport(callback) {
  if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
    // Firefox 38+ seems having support of enumerateDevicesx
    navigator.enumerateDevices = function (callback) {
      navigator.mediaDevices.enumerateDevices().then(callback)
    }
  }

  let MediaDevices = []
  let isHTTPs = location.protocol === 'https:'
  let canEnumerate = false

  if (
    typeof MediaStreamTrack !== 'undefined' &&
    'getSources' in MediaStreamTrack
  ) {
    canEnumerate = true
  } else if (
    navigator.mediaDevices &&
    !!navigator.mediaDevices.enumerateDevices
  ) {
    canEnumerate = true
  }

  let hasMicrophone = false
  let hasSpeakers = false
  let hasWebcam = false

  let isMicrophoneAlreadyCaptured = false
  let isWebcamAlreadyCaptured = false
  if (!canEnumerate) {
    return
  }

  if (
    !navigator.enumerateDevices &&
    window.MediaStreamTrack &&
    window.MediaStreamTrack.getSources
  ) {
    navigator.enumerateDevices = window.MediaStreamTrack.getSources.bind(
      window.MediaStreamTrack
    )
  }

  if (!navigator.enumerateDevices && navigator.enumerateDevices) {
    navigator.enumerateDevices = navigator.enumerateDevices.bind(navigator)
  }

  if (!navigator.enumerateDevices) {
    if (callback) {
      callback(
        hasWebcam,
        hasMicrophone,
        hasSpeakers,
        isWebcamAlreadyCaptured,
        isWebcamAlreadyCaptured
      )
    }
    return
  }

  MediaDevices = []
  navigator.enumerateDevices(function (devices) {
    devices.forEach(function (_device) {
      let device = {}
      for (let d in _device) {
        device[d] = _device[d]
      }

      if (device.kind === 'audio') {
        device.kind = 'audioinput'
      }

      if (device.kind === 'video') {
        device.kind = 'videoinput'
      }

      let skip
      MediaDevices.forEach(function (d) {
        if (d.id === device.id && d.kind === device.kind) {
          skip = true
        }
      })

      if (skip) {
        return
      }

      if (!device.deviceId) {
        device.deviceId = device.id
      }

      if (!device.id) {
        device.id = device.deviceId
      }

      if (!device.label) {
        device.label = 'Please invoke getUserMedia once.'
        if (!isHTTPs) {
          device.label =
            'HTTPs is required to get label of this ' + device.kind + ' device.'
        }
      } else {
        if (device.kind === 'videoinput' && !isWebcamAlreadyCaptured) {
          isWebcamAlreadyCaptured = true
        }

        if (device.kind === 'audioinput' && !isMicrophoneAlreadyCaptured) {
          isMicrophoneAlreadyCaptured = true
        }
      }

      if (device.kind === 'audioinput') {
        hasMicrophone = true
      }

      if (device.kind === 'audiooutput') {
        hasSpeakers = true
      }

      if (device.kind === 'videoinput') {
        hasWebcam = true
      }

      // there is no 'videoouput' in the spec.

      MediaDevices.push(device)
    })

    if (callback) {
      callback(
        hasWebcam,
        hasMicrophone,
        hasSpeakers,
        isWebcamAlreadyCaptured,
        isWebcamAlreadyCaptured
      )
    }
  })
}

export function requestPermissions() {
  return navigator.mediaDevices
    ?.enumerateDevices()
    .then(async (deviceInfos) => {
      const constraints = {
        audio: false,
        video: false
      }
      if (deviceInfos.length) {
        const existAudio =
          deviceInfos.findIndex((i) => i.kind === 'audioinput') !== -1
        const existVideo =
          deviceInfos.findIndex((i) => i.kind === 'videoinput') !== -1
        Object.assign(constraints, { audio: existAudio, video: existVideo })
        await navigator.mediaDevices.getUserMedia(constraints)
      } else {
        alert('No devices available')
      }
    })
}
export function getListMedia() {
  try {
    return navigator.mediaDevices?.enumerateDevices().then((deviceInfos) => {
      const _audios = []
      const _videos = []
      if (!deviceInfos?.length) {
        return
      } else {
        for (const i in deviceInfos) {
          const deviceInfo = deviceInfos[i]
          if (deviceInfo.kind === 'audioinput') {
            _audios.push({
              label: deviceInfo.label || `Microphone ${i + 1}`,
              value: deviceInfo.deviceId
            })
          } else if (deviceInfo.kind === 'videoinput') {
            _videos.push({
              label: deviceInfo.label || `Camera  ${i + 1}`,
              value: deviceInfo.deviceId
            })
          }
        }
      }
      return { audios: _audios, videos: _videos }
    })
  } catch (e) {
    alert(`Error: No found enumerateDevices`)
  }
}
