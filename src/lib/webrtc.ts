// WebRTC Configuration and Helpers

export const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    {
      urls: [
        'stun:stun.l.google.com:19302',
        'stun:stun1.l.google.com:19302',
        'stun:stun2.l.google.com:19302',
        'stun:stun3.l.google.com:19302',
        'stun:stun4.l.google.com:19302',
      ],
    },
  ],
  iceCandidatePoolSize: 10,
};

export interface LocalMediaOptions {
  audio: boolean;
  video: boolean;
}

/**
 * Get user media (Audio/Video stream) with friendly error handling
 */
export async function getLocalMediaStream(options: LocalMediaOptions): Promise<MediaStream> {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    throw new Error('Your browser does not support media device capture.');
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: options.audio ? {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      } : false,
      video: options.video ? {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        facingMode: 'user',
      } : false,
    });
    return stream;
  } catch (err: unknown) {
    const error = err as Error;
    if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
      if (options.video) {
        throw new Error('Camera/Microphone permission is required for video calls.');
      } else {
        throw new Error('Microphone permission is required for audio calls.');
      }
    } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
      throw new Error('No camera or microphone found on your device.');
    } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
      throw new Error('Your camera or microphone is already in use by another application.');
    }
    throw new Error(`Media access error: ${error.message || 'Unable to access media devices'}`);
  }
}

/**
 * Cleanly stop all tracks on a MediaStream
 */
export function stopMediaStream(stream: MediaStream | null) {
  if (!stream) return;
  try {
    stream.getTracks().forEach((track) => {
      track.stop();
    });
  } catch (err) {
    console.warn('Error stopping media stream tracks:', err);
  }
}
