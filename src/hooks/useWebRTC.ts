import { useRef, useEffect, useState } from 'react';
import { ref, push, onValue, off, remove } from 'firebase/database';
import { database } from '../config/firebase';

interface WebRTCHookProps {
  roomCode: string;
  username: string;
  onRemoteStream?: (stream: MediaStream) => void;
}

export const useWebRTC = ({ roomCode, username, onRemoteStream }: WebRTCHookProps) => {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionState, setConnectionState] = useState<RTCPeerConnectionState>('new');
  const [error, setError] = useState<string | null>(null);
  
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const isInitiatorRef = useRef<boolean>(false);

  const configuration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:stun3.l.google.com:19302' },
      { urls: 'stun:stun4.l.google.com:19302' }
    ]
  };

  useEffect(() => {
    initializePeerConnection();
    setupSignaling();
    
    return () => {
      cleanup();
    };
  }, [roomCode, username]);

  const initializePeerConnection = () => {
    const peerConnection = new RTCPeerConnection(configuration);
    peerConnectionRef.current = peerConnection;

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        sendSignalingMessage({
          type: 'ice-candidate',
          candidate: event.candidate.toJSON(),
          sender: username,
          target: getPartnerUsername()
        });
      }
    };

    // Handle remote stream
    peerConnection.ontrack = (event) => {
      console.log('Received remote stream');
      const stream = event.streams[0];
      setRemoteStream(stream);
      onRemoteStream?.(stream);
    };

    // Handle connection state changes
    peerConnection.onconnectionstatechange = () => {
      const state = peerConnection.connectionState;
      console.log('Connection state:', state);
      setConnectionState(state);
      setIsConnected(state === 'connected');
    };

    // Handle ICE connection state
    peerConnection.oniceconnectionstatechange = () => {
      console.log('ICE connection state:', peerConnection.iceConnectionState);
    };

    return peerConnection;
  };

  const setupSignaling = () => {
    const signalingRef = ref(database, `video-calls/${roomCode}`);
    
    const handleSignalingMessage = (snapshot: any) => {
      const data = snapshot.val();
      if (data) {
        Object.entries(data).forEach(([key, message]: [string, any]) => {
          if (message.sender !== username && (!message.target || message.target === username)) {
            handleRemoteSignalingMessage(message);
            // Remove processed message
            remove(ref(database, `video-calls/${roomCode}/${key}`));
          }
        });
      }
    };

    onValue(signalingRef, handleSignalingMessage);
    
    return () => {
      off(signalingRef, 'value', handleSignalingMessage);
    };
  };

  const getPartnerUsername = () => {
    // This is a simple way to get partner username
    // In a real app, you'd get this from the users list
    return username === 'Yash' ? 'Pari' : 'Yash';
  };

  const handleRemoteSignalingMessage = async (message: any) => {
    const peerConnection = peerConnectionRef.current;
    if (!peerConnection) return;

    try {
      console.log('Handling signaling message:', message.type);
      
      switch (message.type) {
        case 'offer':
          console.log('Received offer');
          await peerConnection.setRemoteDescription(new RTCSessionDescription(message.offer));
          const answer = await peerConnection.createAnswer();
          await peerConnection.setLocalDescription(answer);
          sendSignalingMessage({
            type: 'answer',
            answer: answer.toJSON(),
            sender: username,
            target: message.sender
          });
          break;

        case 'answer':
          console.log('Received answer');
          await peerConnection.setRemoteDescription(new RTCSessionDescription(message.answer));
          break;

        case 'ice-candidate':
          console.log('Received ICE candidate');
          const candidate = new RTCIceCandidate(message.candidate);
          await peerConnection.addIceCandidate(candidate);
          break;

        case 'call-request':
          console.log('Received call request');
          // Auto-accept call for this demo
          sendSignalingMessage({
            type: 'call-accepted',
            sender: username,
            target: message.sender
          });
          break;

        case 'call-accepted':
          console.log('Call accepted, creating offer');
          isInitiatorRef.current = true;
          await createOffer();
          break;
      }
    } catch (error) {
      console.error('Error handling signaling message:', error);
    }
  };

  const sendSignalingMessage = (message: any) => {
    const signalingRef = ref(database, `video-calls/${roomCode}`);
    push(signalingRef, {
      ...message,
      timestamp: Date.now()
    });
  };

  const createOffer = async () => {
    const peerConnection = peerConnectionRef.current;
    if (!peerConnection || !localStreamRef.current) return;

    try {
      console.log('Creating offer');
      const offer = await peerConnection.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true
      });
      await peerConnection.setLocalDescription(offer);
      
      sendSignalingMessage({
        type: 'offer',
        offer: offer.toJSON(),
        sender: username,
        target: getPartnerUsername()
      });
    } catch (error) {
      console.error('Error creating offer:', error);
    }
  };

  const startCall = async () => {
    try {
      console.log('Starting call...');
      setError(null);
      
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Your browser does not support camera and microphone access. Please use a modern browser like Chrome, Firefox, or Safari.');
      }

      // Get user media with portrait constraints for mobile
      const isMobile = window.innerWidth < 768;
      const constraints = {
        video: {
          width: isMobile ? { ideal: 720 } : { ideal: 1280 },
          height: isMobile ? { ideal: 1280 } : { ideal: 720 },
          facingMode: 'user',
          frameRate: { ideal: 30 }
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('Got local stream');
      
      setLocalStream(stream);
      localStreamRef.current = stream;

      const peerConnection = peerConnectionRef.current;
      if (!peerConnection) return;

      // Add tracks to peer connection
      stream.getTracks().forEach(track => {
        console.log('Adding track:', track.kind);
        peerConnection.addTrack(track, stream);
      });

      // Send call request
      sendSignalingMessage({
        type: 'call-request',
        sender: username,
        target: getPartnerUsername()
      });

      setConnectionState('connecting');

    } catch (error: any) {
      console.error('Error starting call:', error);
      setConnectionState('failed');
      
      // Handle specific permission errors
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        setError('Camera and microphone access denied. Please click the camera icon in your browser\'s address bar and allow access to continue with the video call.');
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        setError('No camera or microphone found. Please connect a camera and microphone to use video calling.');
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        setError('Camera or microphone is already in use by another application. Please close other applications using your camera/microphone and try again.');
      } else if (error.name === 'OverconstrainedError' || error.name === 'ConstraintNotSatisfiedError') {
        setError('Your camera or microphone doesn\'t meet the required specifications. Please try with different settings.');
      } else if (error.name === 'NotSupportedError') {
        setError('Your browser doesn\'t support video calling. Please use a modern browser like Chrome, Firefox, or Safari.');
      } else if (error.name === 'TypeError') {
        setError('Browser security settings are blocking camera access. Please ensure you\'re using HTTPS or localhost.');
      } else {
        setError(error.message || 'An unexpected error occurred while trying to access your camera and microphone. Please try again.');
      }
    }
  };

  const endCall = () => {
    console.log('Ending call');
    cleanup();
    
    // Notify other user
    sendSignalingMessage({
      type: 'call-ended',
      sender: username,
      target: getPartnerUsername()
    });
  };

  const toggleAudio = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        console.log('Audio toggled:', audioTrack.enabled);
        return audioTrack.enabled;
      }
    }
    return false;
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        console.log('Video toggled:', videoTrack.enabled);
        return videoTrack.enabled;
      }
    }
    return false;
  };

  const cleanup = () => {
    console.log('Cleaning up WebRTC');
    
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        track.stop();
        console.log('Stopped track:', track.kind);
      });
    }
    
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }
    
    setLocalStream(null);
    setRemoteStream(null);
    setIsConnected(false);
    setConnectionState('closed');
    setError(null);
    localStreamRef.current = null;
  };

  return {
    localStream,
    remoteStream,
    isConnected,
    connectionState,
    error,
    startCall,
    endCall,
    toggleAudio,
    toggleVideo
  };
};
