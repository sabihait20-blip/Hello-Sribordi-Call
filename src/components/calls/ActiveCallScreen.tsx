import React, { useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { CallSession } from '../../types';

interface ActiveCallScreenProps {
  activeCall: CallSession | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isMuted: boolean;
  isVideoOff: boolean;
  callDuration: number;
  isConnecting: boolean;
  callError: string | null;
  onEndCall: () => void;
  onToggleMute: () => void;
  onToggleVideo: () => void;
  onClearError: () => void;
}

export const ActiveCallScreen: React.FC<ActiveCallScreenProps> = ({
  activeCall,
  localStream,
  remoteStream,
  isMuted,
  isVideoOff,
  callDuration,
  isConnecting,
  callError,
  onEndCall,
  onToggleMute,
  onToggleVideo,
  onClearError,
}) => {
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const [isSpeakerMuted, setIsSpeakerMuted] = React.useState(false);

  // Attach local stream to local video tag
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
      localVideoRef.current.play().catch(() => {});
    }
  }, [localStream]);

  // Attach remote stream to remote video/audio tag
  useEffect(() => {
    if (remoteStream) {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
        remoteVideoRef.current.play().catch((e) => console.warn('Remote video playback warning:', e));
      }
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = remoteStream;
        remoteAudioRef.current.play().catch((e) => console.warn('Remote audio playback warning:', e));
      }
    }
  }, [remoteStream, activeCall?.type]);

  if (!activeCall) return null;

  const isVideo = activeCall.type === 'video';

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const peerName =
    activeCall.callerName === activeCall.receiverName
      ? activeCall.receiverName
      : activeCall.callerName;

  const peerPhoto = activeCall.callerPhoto || activeCall.receiverPhoto;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col justify-between p-4 md:p-8 animate-in fade-in duration-300">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between z-20 text-white bg-slate-900/60 backdrop-blur-md px-6 py-4 rounded-2xl border border-white/10">
        <div>
          <h2 className="font-bold text-base md:text-lg">{peerName}</h2>
          <p className="text-xs text-emerald-400 font-mono font-medium flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            {isConnecting
              ? 'Connecting WebRTC...'
              : activeCall.status === 'ringing'
              ? 'Ringing...'
              : `Connected • ${formatDuration(callDuration)}`}
          </p>
        </div>

        <div className="px-3 py-1 rounded-full bg-white/10 text-xs font-semibold uppercase tracking-wider">
          {isVideo ? 'HD Video Call' : 'Encrypted Audio Call'}
        </div>
      </div>

      {/* Main Stream Area */}
      <div className="relative flex-1 my-4 rounded-3xl overflow-hidden bg-slate-900 border border-slate-800 flex items-center justify-center">
        {callError && (
          <div className="absolute top-4 left-4 right-4 z-30 p-4 rounded-2xl bg-rose-500/90 text-white text-sm flex items-center justify-between">
            <span>{callError}</span>
            <button
              onClick={onClearError}
              className="font-bold underline text-xs"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Video Call View */}
        {isVideo ? (
          <>
            {/* Remote Video Stream */}
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              muted={isSpeakerMuted}
              className="w-full h-full object-cover"
            />

            {!remoteStream && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 text-white/70">
                <div className="w-24 h-24 rounded-full bg-slate-800 flex items-center justify-center mb-4 border border-slate-700 animate-pulse">
                  <img
                    src={peerPhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${peerName}`}
                    alt={peerName}
                    className="w-20 h-20 rounded-full object-cover"
                  />
                </div>
                <p className="text-sm font-medium">Waiting for remote video stream...</p>
              </div>
            )}

            {/* Floating Local Pip Stream */}
            <div className="absolute bottom-4 right-4 w-32 h-44 md:w-44 md:h-60 rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl bg-black z-20">
              {!isVideoOff ? (
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover transform -scale-x-100"
                />
              ) : (
                <div className="w-full h-full bg-slate-900 flex items-center justify-center text-slate-500">
                  <VideoOff className="w-8 h-8" />
                </div>
              )}
            </div>
          </>
        ) : (
          /* Audio Call View */
          <div className="flex flex-col items-center justify-center p-6 text-center text-white">
            <div className="relative mb-8">
              <div className="w-36 h-36 md:w-44 md:h-44 rounded-full p-2 bg-gradient-to-tr from-indigo-500 via-purple-500 to-emerald-400 animate-pulse">
                <img
                  src={peerPhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${peerName}`}
                  alt={peerName}
                  className="w-full h-full rounded-full object-cover border-4 border-slate-900 shadow-2xl"
                />
              </div>
              <div className="absolute inset-0 rounded-full border-4 border-indigo-500/30 animate-ping pointer-events-none" />
            </div>

            <h3 className="text-2xl md:text-3xl font-bold mb-2">{peerName}</h3>
            <p className="text-slate-400 text-sm font-mono">
              {isConnecting ? 'Establishing WebRTC Connection...' : formatDuration(callDuration)}
            </p>

            {/* Dedicated Audio Element for Remote Stream */}
            <audio ref={remoteAudioRef} autoPlay playsInline muted={isSpeakerMuted} />
          </div>
        )}
      </div>

      {/* Control Toolbar */}
      <div className="z-20 flex items-center justify-center gap-4 md:gap-6 bg-slate-900/80 backdrop-blur-lg px-6 py-4 rounded-3xl border border-white/10 max-w-lg mx-auto w-full">
        {/* Toggle Mute */}
        <button
          onClick={onToggleMute}
          className={`p-4 rounded-full transition-all ${
            isMuted
              ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30'
              : 'bg-white/10 hover:bg-white/20 text-white'
          }`}
          title={isMuted ? 'Unmute Microphone' : 'Mute Microphone'}
        >
          {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
        </button>

        {/* Toggle Video (If video call) */}
        {isVideo && (
          <button
            onClick={onToggleVideo}
            className={`p-4 rounded-full transition-all ${
              isVideoOff
                ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30'
                : 'bg-white/10 hover:bg-white/20 text-white'
            }`}
            title={isVideoOff ? 'Turn On Camera' : 'Turn Off Camera'}
          >
            {isVideoOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
          </button>
        )}

        {/* Speaker Toggle */}
        <button
          onClick={() => setIsSpeakerMuted(!isSpeakerMuted)}
          className={`p-4 rounded-full transition-all ${
            isSpeakerMuted
              ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30'
              : 'bg-white/10 hover:bg-white/20 text-white'
          }`}
          title={isSpeakerMuted ? 'Unmute Speaker' : 'Mute Speaker'}
        >
          {isSpeakerMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
        </button>

        {/* End Call Button */}
        <button
          onClick={onEndCall}
          className="p-4 rounded-full bg-rose-600 hover:bg-rose-700 text-white shadow-xl shadow-rose-600/40 transform hover:scale-110 transition-all ml-2"
          title="End Call"
        >
          <PhoneOff className="w-7 h-7" />
        </button>
      </div>
    </div>
  );
};
