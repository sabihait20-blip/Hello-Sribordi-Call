import { useState, useEffect, useRef, useCallback } from 'react';
import {
  RTC_CONFIG,
  getLocalMediaStream,
  stopMediaStream,
} from '../lib/webrtc';
import {
  createCallSession,
  answerCallSession,
  rejectCallSession,
  endCallSession,
  addIceCandidateToFirestore,
  listenToIncomingCalls,
  listenToCallSession,
  listenToPeerIceCandidates,
} from '../services/callService';
import { soundEffects } from '../lib/audio';
import { CallSession, CallType, UserProfile } from '../types';

export function useCall(currentUserProfile: UserProfile | null) {
  const [activeCall, setActiveCall] = useState<CallSession | null>(null);
  const [incomingCall, setIncomingCall] = useState<CallSession | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [callError, setCallError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const durationTimerRef = useRef<number | null>(null);
  const callUnsubscribesRef = useRef<Array<() => void>>([]);
  const iceQueueRef = useRef<RTCIceCandidateInit[]>([]);

  // Safely add or queue ICE candidate
  const handleIncomingCandidate = useCallback(async (candidate: RTCIceCandidateInit) => {
    const pc = peerConnectionRef.current;
    if (!pc) return;

    if (pc.remoteDescription && pc.remoteDescription.type) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.warn('Error adding ICE candidate directly:', err);
      }
    } else {
      iceQueueRef.current.push(candidate);
    }
  }, []);

  // Flush queued candidates once remote description is ready
  const flushQueuedCandidates = useCallback(async () => {
    const pc = peerConnectionRef.current;
    if (!pc || !pc.remoteDescription) return;

    while (iceQueueRef.current.length > 0) {
      const cand = iceQueueRef.current.shift();
      if (cand) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(cand));
        } catch (err) {
          console.warn('Error applying queued ICE candidate:', err);
        }
      }
    }
  }, []);

  // Cleanup WebRTC & Streams
  const cleanupCall = useCallback(() => {
    soundEffects.stopRingtone();

    if (durationTimerRef.current) {
      clearInterval(durationTimerRef.current);
      durationTimerRef.current = null;
    }

    // Clear candidate queue
    iceQueueRef.current = [];

    // Unsubscribe Firestore listeners
    callUnsubscribesRef.current.forEach((unsub) => {
      try {
        unsub();
      } catch (e) {
        console.warn('Error unsubscribing call listener:', e);
      }
    });
    callUnsubscribesRef.current = [];

    // Stop streams
    if (localStream) {
      stopMediaStream(localStream);
      setLocalStream(null);
    }

    if (remoteStream) {
      stopMediaStream(remoteStream);
      setRemoteStream(null);
    }

    // Close PC
    if (peerConnectionRef.current) {
      try {
        peerConnectionRef.current.close();
      } catch (e) {
        console.warn('Error closing peer connection:', e);
      }
      peerConnectionRef.current = null;
    }

    setActiveCall(null);
    setIncomingCall(null);
    setIsConnecting(false);
    setIsMuted(false);
    setIsVideoOff(false);
    setCallDuration(0);
  }, [localStream, remoteStream]);

  // Listen to incoming calls
  useEffect(() => {
    if (!currentUserProfile) return;

    const unsub = listenToIncomingCalls(currentUserProfile.uid, (session) => {
      // If already in call, auto reject
      if (activeCall) {
        rejectCallSession(session.callId);
        return;
      }
      setIncomingCall(session);
      soundEffects.startRingtone();
    });

    return () => {
      unsub();
    };
  }, [currentUserProfile?.uid, activeCall]);

  // Start outgoing call
  const startCall = async (receiver: UserProfile, type: CallType) => {
    if (!currentUserProfile) return;
    setCallError(null);
    setIsConnecting(true);
    iceQueueRef.current = [];

    try {
      // 1. Get media
      const stream = await getLocalMediaStream({
        audio: true,
        video: type === 'video',
      });
      setLocalStream(stream);

      // 2. Create RTCPeerConnection
      const pc = new RTCPeerConnection(RTC_CONFIG);
      peerConnectionRef.current = pc;

      // Add tracks
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      // Handle remote tracks
      pc.ontrack = (event) => {
        if (event.streams && event.streams[0]) {
          setRemoteStream(event.streams[0]);
        } else if (event.track) {
          setRemoteStream((prev) => {
            const newStream = prev || new MediaStream();
            newStream.addTrack(event.track);
            return newStream;
          });
        }
      };

      pc.oniceconnectionstatechange = () => {
        const state = pc.iceConnectionState;
        if (state === 'connected' || state === 'completed') {
          setIsConnecting(false);
        }
      };

      pc.onconnectionstatechange = () => {
        const state = pc.connectionState;
        if (state === 'connected') {
          setIsConnecting(false);
        } else if (state === 'failed') {
          setCallError('Call connection failed. Please try again.');
        }
      };

      // Create offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // Save call doc
      const callId = await createCallSession(
        {
          uid: currentUserProfile.uid,
          name: currentUserProfile.name,
          photoURL: currentUserProfile.photoURL,
        },
        {
          uid: receiver.uid,
          name: receiver.name,
          photoURL: receiver.photoURL,
        },
        type,
        offer
      );

      const session: CallSession = {
        callId,
        callerId: currentUserProfile.uid,
        callerName: currentUserProfile.name,
        callerPhoto: currentUserProfile.photoURL,
        receiverId: receiver.uid,
        receiverName: receiver.name,
        receiverPhoto: receiver.photoURL,
        type,
        status: 'ringing',
        createdAt: Date.now(),
      };
      setActiveCall(session);

      // ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          addIceCandidateToFirestore(callId, event.candidate, 'caller');
        }
      };

      soundEffects.startOutgoingTone();

      // Listen for session updates
      const unsubSession = listenToCallSession(callId, async (updatedSession) => {
        setActiveCall(updatedSession);

        if (updatedSession.status === 'accepted' && updatedSession.answer && !pc.currentRemoteDescription) {
          soundEffects.stopRingtone();
          setIsConnecting(false);
          await pc.setRemoteDescription(new RTCSessionDescription(updatedSession.answer));
          await flushQueuedCandidates();

          // Start timer
          if (!durationTimerRef.current) {
            durationTimerRef.current = window.setInterval(() => {
              setCallDuration((prev) => prev + 1);
            }, 1000);
          }
        } else if (
          updatedSession.status === 'rejected' ||
          updatedSession.status === 'ended' ||
          updatedSession.status === 'busy' ||
          updatedSession.status === 'missed'
        ) {
          soundEffects.playEndCallTone();
          cleanupCall();
        }
      });

      // Listen for receiver candidates
      const unsubCandidates = listenToPeerIceCandidates(callId, 'receiver', (candidate) => {
        handleIncomingCandidate(candidate);
      });

      callUnsubscribesRef.current.push(unsubSession, unsubCandidates);
    } catch (err: unknown) {
      const error = err as Error;
      console.error('Call initiation error:', error);
      setCallError(error.message || 'Failed to start call');
      cleanupCall();
    }
  };

  // Accept incoming call
  const acceptCall = async () => {
    if (!incomingCall || !currentUserProfile) return;
    soundEffects.stopRingtone();
    setCallError(null);
    setIsConnecting(true);
    iceQueueRef.current = [];

    const callToAnswer = incomingCall;
    setIncomingCall(null);
    setActiveCall(callToAnswer);

    try {
      // 1. Get local media
      const stream = await getLocalMediaStream({
        audio: true,
        video: callToAnswer.type === 'video',
      });
      setLocalStream(stream);

      // 2. Create PC
      const pc = new RTCPeerConnection(RTC_CONFIG);
      peerConnectionRef.current = pc;

      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      // Handle remote track
      pc.ontrack = (event) => {
        if (event.streams && event.streams[0]) {
          setRemoteStream(event.streams[0]);
        } else if (event.track) {
          setRemoteStream((prev) => {
            const newStream = prev || new MediaStream();
            newStream.addTrack(event.track);
            return newStream;
          });
        }
      };

      pc.oniceconnectionstatechange = () => {
        const state = pc.iceConnectionState;
        if (state === 'connected' || state === 'completed') {
          setIsConnecting(false);
        }
      };

      pc.onconnectionstatechange = () => {
        const state = pc.connectionState;
        if (state === 'connected') {
          setIsConnecting(false);
        } else if (state === 'failed') {
          setCallError('WebRTC connection failed.');
        }
      };

      // Set Remote Description (Offer)
      if (callToAnswer.offer) {
        await pc.setRemoteDescription(new RTCSessionDescription(callToAnswer.offer));
        await flushQueuedCandidates();
      }

      // Create Answer
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      // ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          addIceCandidateToFirestore(callToAnswer.callId, event.candidate, 'receiver');
        }
      };

      // Answer in Firestore
      await answerCallSession(callToAnswer.callId, answer);
      setIsConnecting(false);

      // Start timer
      durationTimerRef.current = window.setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);

      // Listen for call session state (ended, etc)
      const unsubSession = listenToCallSession(callToAnswer.callId, (updatedSession) => {
        setActiveCall(updatedSession);
        if (updatedSession.status === 'ended' || updatedSession.status === 'rejected') {
          soundEffects.playEndCallTone();
          cleanupCall();
        }
      });

      // Listen for caller candidates
      const unsubCandidates = listenToPeerIceCandidates(callToAnswer.callId, 'caller', (candidate) => {
        handleIncomingCandidate(candidate);
      });

      callUnsubscribesRef.current.push(unsubSession, unsubCandidates);
    } catch (err: unknown) {
      const error = err as Error;
      console.error('Accept call error:', error);
      setCallError(error.message || 'Failed to connect call');
      rejectCallSession(callToAnswer.callId);
      cleanupCall();
    }
  };

  // Reject incoming call
  const rejectCall = async () => {
    soundEffects.stopRingtone();
    if (incomingCall) {
      await rejectCallSession(incomingCall.callId);
      setIncomingCall(null);
    }
  };

  // End active call
  const endCall = async () => {
    soundEffects.playEndCallTone();
    if (activeCall) {
      await endCallSession(activeCall.callId, callDuration);
    }
    cleanupCall();
  };

  // Toggle Mute
  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsMuted((prev) => !prev);
    }
  };

  // Toggle Video
  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsVideoOff((prev) => !prev);
    }
  };

  return {
    activeCall,
    incomingCall,
    localStream,
    remoteStream,
    isMuted,
    isVideoOff,
    callDuration,
    callError,
    isConnecting,
    startCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleMute,
    toggleVideo,
    clearError: () => setCallError(null),
  };
}
