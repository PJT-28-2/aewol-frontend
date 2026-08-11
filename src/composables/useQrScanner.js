import { onUnmounted, ref, shallowRef } from 'vue'
import jsQR from 'jsqr'

/**
 * 카메라 스트림과 이미지 파일에서 QR을 디코딩한다.
 *
 * 디코딩된 원본 문자열만 넘기고 결제 규약 해석은 하지 않는다. 규약 해석은 `utils/qr.js`가 맡는다.
 */

/** 카메라 프레임 디코딩 해상도 상한. 원본 해상도로 매 프레임 디코딩하면 저사양 기기에서 버벅인다. */
const MAX_CAMERA_DECODE_WIDTH = 640

/** 이미지 파일 디코딩 해상도 상한. 사진 속 QR은 작게 찍히는 경우가 많아 카메라보다 넉넉하게 둔다. */
const MAX_FILE_DECODE_WIDTH = 1600

/** 카메라를 열 수 없을 때의 사유별 안내 문구. */
export const CAMERA_ERROR_MESSAGES = {
  INSECURE: '카메라는 HTTPS 또는 localhost에서만 사용할 수 있어요. 사진에서 QR을 불러와주세요.',
  DENIED: '카메라 권한이 거부되었어요. 브라우저 설정에서 권한을 허용해주세요.',
  NOT_FOUND: '사용할 수 있는 카메라를 찾지 못했어요. 사진에서 QR을 불러와주세요.',
  UNKNOWN: '카메라를 열지 못했어요. 사진에서 QR을 불러와주세요.',
}

/** 이미지 파일에서 QR을 찾지 못했을 때의 안내 문구. */
export const FILE_DECODE_ERROR_MESSAGE = '사진에서 QR을 찾지 못했어요. QR이 잘 보이는 사진으로 다시 시도해주세요.'

/**
 * @param {{ onDetect: (text: string) => void }} options 디코딩 성공 시 호출할 콜백
 */
export function useQrScanner({ onDetect }) {
  const videoRef = ref(null)
  const isCameraOn = ref(false)
  const isCameraStarting = ref(false)
  /** @type {import('vue').Ref<{ code: keyof typeof CAMERA_ERROR_MESSAGES, message: string } | null>} */
  const cameraError = ref(null)

  // 반응형으로 감쌀 필요가 없고, 프록시로 감싸면 스트림·캔버스 동작이 꼬일 수 있어 shallowRef로 둔다.
  const stream = shallowRef(null)
  const canvas = shallowRef(null)
  let frameHandle = null

  function getCanvasContext(width, height) {
    if (!canvas.value) {
      canvas.value = document.createElement('canvas')
    }
    canvas.value.width = width
    canvas.value.height = height
    // 매 프레임 getImageData를 호출하므로 willReadFrequently를 켜야 브라우저가 CPU 경로를 쓴다.
    return canvas.value.getContext('2d', { willReadFrequently: true })
  }

  function scaledSize(width, height, maxWidth) {
    if (width <= maxWidth) return { width, height }
    const ratio = maxWidth / width
    return { width: maxWidth, height: Math.round(height * ratio) }
  }

  async function startCamera() {
    if (isCameraOn.value || isCameraStarting.value) return

    cameraError.value = null

    // 보안 컨텍스트가 아니면 navigator.mediaDevices 자체가 없다. getUserMedia 호출 전에 걸러낸다.
    if (!navigator.mediaDevices?.getUserMedia) {
      cameraError.value = cameraFailure('INSECURE')
      return
    }

    isCameraStarting.value = true
    try {
      stream.value = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      })

      // 스트림을 기다리는 동안 화면을 벗어나면 videoRef가 비어 있다. 이때 스트림을 놓으면
      // 카메라 LED가 켜진 채로 남으므로 즉시 정리한다.
      if (!videoRef.value) {
        releaseStream()
        return
      }

      videoRef.value.srcObject = stream.value
      await videoRef.value.play()
      isCameraOn.value = true
      frameHandle = requestAnimationFrame(scanFrame)
    } catch (error) {
      releaseStream()
      cameraError.value = cameraFailure(toCameraErrorCode(error))
    } finally {
      isCameraStarting.value = false
    }
  }

  function scanFrame() {
    const video = videoRef.value
    if (!isCameraOn.value || !video) return

    if (video.readyState >= video.HAVE_ENOUGH_DATA && video.videoWidth > 0) {
      const { width, height } = scaledSize(
        video.videoWidth,
        video.videoHeight,
        MAX_CAMERA_DECODE_WIDTH,
      )
      const context = getCanvasContext(width, height)
      context.drawImage(video, 0, 0, width, height)
      const { data } = context.getImageData(0, 0, width, height)
      // 카메라 프레임은 반전된 QR일 가능성이 낮아, 반전 시도를 빼고 프레임당 비용을 줄인다.
      const result = jsQR(data, width, height, { inversionAttempts: 'dontInvert' })

      if (result?.data) {
        // 같은 QR이 다음 프레임에도 계속 잡혀 콜백이 반복 호출되지 않도록 카메라부터 끈다.
        stopCamera()
        onDetect(result.data)
        return
      }
    }

    frameHandle = requestAnimationFrame(scanFrame)
  }

  function stopCamera() {
    if (frameHandle !== null) {
      cancelAnimationFrame(frameHandle)
      frameHandle = null
    }
    releaseStream()
    if (videoRef.value) {
      videoRef.value.srcObject = null
    }
    isCameraOn.value = false
  }

  function releaseStream() {
    stream.value?.getTracks().forEach((track) => track.stop())
    stream.value = null
  }

  /**
   * 이미지 파일에서 QR을 디코딩한다.
   *
   * @param {File} file 사용자가 선택한 이미지 파일
   * @returns {Promise<string | null>} 디코딩된 문자열, 찾지 못하면 null
   */
  async function decodeImageFile(file) {
    const bitmap = await createImageBitmap(file)
    try {
      const { width, height } = scaledSize(bitmap.width, bitmap.height, MAX_FILE_DECODE_WIDTH)
      const context = getCanvasContext(width, height)
      context.drawImage(bitmap, 0, 0, width, height)
      const { data } = context.getImageData(0, 0, width, height)
      // 파일은 프레임당 비용을 신경 쓸 필요가 없으니 반전된 QR까지 시도한다.
      const result = jsQR(data, width, height, { inversionAttempts: 'attemptBoth' })
      return result?.data ?? null
    } finally {
      bitmap.close()
    }
  }

  onUnmounted(stopCamera)

  return {
    videoRef,
    isCameraOn,
    isCameraStarting,
    cameraError,
    startCamera,
    stopCamera,
    decodeImageFile,
  }
}

function toCameraErrorCode(error) {
  if (error?.name === 'NotAllowedError' || error?.name === 'SecurityError') return 'DENIED'
  if (error?.name === 'NotFoundError' || error?.name === 'OverconstrainedError') return 'NOT_FOUND'
  return 'UNKNOWN'
}

function cameraFailure(code) {
  return { code, message: CAMERA_ERROR_MESSAGES[code] }
}
