import React, { useEffect, useRef, useState } from 'react';
import { 
  X, 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  PhoneOff, 
  Minimize2, 
  Maximize2,
  RotateCcw
} from 'lucide-react';
import { useWebRTC } from '../hooks/useWebRTC';

interface VideoCallProps {
  roomCode: string;
  username: string;
  onClose: () => void;
  isDarkMode?: boolean;
}

export const VideoCall: React.FC<VideoCallProps> = ({ 
  roomCode, 
  username, 
  onClose, 
  isDarkMode = false 
}) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const dragRef = useRef<HTMLDivElement>(null);

  const {
    localStream,
    remoteStream,
    isConnected,
    connectionState,
    startCall,
    endCall,
    toggleAudio,
    toggleVideo
  } = useWebRTC({
    roomCode,
    username,
    onRemoteStream: (stream) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = stream;
      }
    }
  });

  // Check if mobile and set portrait constraints
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768 || /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      setIsMobile(mobile);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Set video streams to video elements
  useEffect(() => {
    if (localStream && localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteStream && remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  // Start call when component mounts
  useEffect(() => {
    startCall();
    return () => {
      endCall();
    };
  }, []);

  const handleToggleAudio = () => {
    const enabled = toggleAudio();
    setIsAudioEnabled(enabled);
  };

  const handleToggleVideo = () => {
    const enabled = toggleVideo();
    setIsVideoEnabled(enabled);
  };

  const handleEndCall = () => {
    endCall();
    onClose();
  };

  const handleMinimize = () => {
    setIsMinimized(true);
    // Position PIP in bottom right for mobile
    if (isMobile) {
      setPosition({ 
        x: window.innerWidth - 140, 
        y: window.innerHeight - 200 
      });
    }
  };

  const handleMaximize = () => {
    setIsMinimized(false);
    setPosition({ x: 0, y: 0 });
  };

  // Touch and mouse drag functionality
  const handleStart = (clientX: number, clientY: number) => {
    if (!isMinimized) return;
    
    setIsDragging(true);
    const rect = dragRef.current?.getBoundingClientRect();
    if (rect) {
      setDragOffset({
        x: clientX - rect.left,
        y: clientY - rect.top
      });
    }
  };

  const handleMove = (clientX: number, clientY: number) => {
    if (!isDragging || !isMinimized) return;
    
    const newX = clientX - dragOffset.x;
    const newY = clientY - dragOffset.y;
    
    // Keep within viewport bounds - portrait PIP size
    const pipWidth = 120;
    const pipHeight = 180;
    const maxX = window.innerWidth - pipWidth;
    const maxY = window.innerHeight - pipHeight;
    
    setPosition({
      x: Math.max(0, Math.min(newX, maxX)),
      y: Math.max(0, Math.min(newY, maxY))
    });
  };

  const handleEnd = () => {
    setIsDragging(false);
  };

  // Mouse events
  const handleMouseDown = (e: React.MouseEvent) => {
    handleStart(e.clientX, e.clientY);
  };

  const handleMouseMove = (e: MouseEvent) => {
    handleMove(e.clientX, e.clientY);
  };

  const handleMouseUp = () => {
    handleEnd();
  };

  // Touch events
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    handleStart(touch.clientX, touch.clientY);
  };

  const handleTouchMove = (e: TouchEvent) => {
    e.preventDefault();
    const touch = e.touches[0];
    handleMove(touch.clientX, touch.clientY);
  };

  const handleTouchEnd = () => {
    handleEnd();
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleTouchEnd);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [isDragging, dragOffset]);

  // Minimized PIP view - Portrait sized
  if (isMinimized) {
    return (
      <div
        ref={dragRef}
        className={`fixed z-50 rounded-2xl shadow-2xl overflow-hidden cursor-move select-none ${
          isDarkMode ? 'bg-gray-900' : 'bg-black'
        }`}
        style={{
          left: position.x,
          top: position.y,
          width: '120px',
          height: '180px' // Portrait aspect ratio
        }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        {/* Remote video (main) - Portrait */}
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
          style={{ transform: 'scaleX(-1)' }} // Mirror effect
        />
        
        {/* Local video (small overlay) - Portrait */}
        <div className="absolute top-2 right-2 w-8 h-12 bg-gray-800 rounded-lg overflow-hidden">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
            style={{ transform: 'scaleX(-1)' }} // Mirror effect
          />
        </div>
        
        {/* Controls overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1">
              <button
                onClick={handleToggleAudio}
                className={`p-1 rounded-full ${
                  isAudioEnabled ? 'bg-white/20' : 'bg-red-500'
                }`}
              >
                {isAudioEnabled ? (
                  <Mic className="w-2 h-2 text-white" />
                ) : (
                  <MicOff className="w-2 h-2 text-white" />
                )}
              </button>
              
              <button
                onClick={handleToggleVideo}
                className={`p-1 rounded-full ${
                  isVideoEnabled ? 'bg-white/20' : 'bg-red-500'
                }`}
              >
                {isVideoEnabled ? (
                  <Video className="w-2 h-2 text-white" />
                ) : (
                  <VideoOff className="w-2 h-2 text-white" />
                )}
              </button>
            </div>
            
            <div className="flex items-center space-x-1">
              <button
                onClick={handleMaximize}
                className="p-1 rounded-full bg-white/20 hover:bg-white/30"
              >
                <Maximize2 className="w-2 h-2 text-white" />
              </button>
              
              <button
                onClick={handleEndCall}
                className="p-1 rounded-full bg-red-500 hover:bg-red-600"
              >
                <PhoneOff className="w-2 h-2 text-white" />
              </button>
            </div>
          </div>
        </div>
        
        {/* Status indicator */}
        {connectionState === 'connecting' && (
          <div className="absolute top-1 left-1 bg-yellow-500 text-white px-1 py-0.5 rounded-full text-xs">
            Connecting...
          </div>
        )}
        
        {connectionState === 'failed' && (
          <div className="absolute top-1 left-1 bg-red-500 text-white px-1 py-0.5 rounded-full text-xs">
            Failed
          </div>
        )}
      </div>
    );
  }

  // Full screen view - Portrait optimized
  return (
    <div className={`fixed inset-0 z-50 flex flex-col ${
      isDarkMode ? 'bg-gray-900' : 'bg-black'
    }`}>
      {/* Header */}
      <div className="bg-black/50 backdrop-blur-sm px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3 min-w-0 flex-1">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-white font-semibold text-xs sm:text-sm">
              {username.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="min-w-0">
            <h3 className="text-white font-semibold text-sm sm:text-base truncate">{username}</h3>
            <p className="text-gray-300 text-xs sm:text-sm">
              {connectionState === 'connecting' && 'Connecting...'}
              {connectionState === 'connected' && 'Connected'}
              {connectionState === 'failed' && 'Connection failed'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 flex-shrink-0">
          <button
            onClick={handleMinimize}
            className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
          >
            <Minimize2 className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </button>
          
          <button
            onClick={handleEndCall}
            className="p-2 bg-red-500 rounded-full hover:bg-red-600 transition-colors"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </button>
        </div>
      </div>
      
      {/* Video container - Portrait layout */}
      <div className="flex-1 relative">
        {/* Remote video (main) - Portrait */}
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
          style={{ transform: 'scaleX(-1)' }} // Mirror effect
        />
        
        {/* Local video (overlay) - Portrait positioned */}
        <div className={`absolute bg-gray-800 rounded-2xl overflow-hidden shadow-2xl ${
          isMobile 
            ? 'top-4 right-4 w-20 h-28' // Portrait selfie on mobile
            : 'top-6 right-6 w-32 h-48' // Portrait selfie on desktop
        }`}>
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
            style={{ transform: 'scaleX(-1)' }} // Mirror effect
          />
        </div>
        
        {/* Connection status overlay */}
        {connectionState === 'connecting' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <div className="text-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-white text-base sm:text-lg">Connecting to call...</p>
            </div>
          </div>
        )}
        
        {connectionState === 'failed' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <div className="text-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <X className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
              <p className="text-white text-base sm:text-lg mb-4">Connection failed</p>
              <button
                onClick={startCall}
                className="bg-blue-500 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-full hover:bg-blue-600 transition-colors text-sm sm:text-base"
              >
                <RotateCcw className="w-4 h-4 inline mr-2" />
                Retry
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Bottom controls - optimized for mobile */}
      <div className="bg-black/50 backdrop-blur-sm px-4 sm:px-6 py-4 sm:py-6 pb-safe">
        <div className="flex items-center justify-center space-x-4 sm:space-x-6">
          <button
            onClick={handleToggleAudio}
            className={`p-3 sm:p-4 rounded-full transition-all duration-200 ${
              isAudioEnabled 
                ? 'bg-white/20 hover:bg-white/30' 
                : 'bg-red-500 hover:bg-red-600'
            }`}
          >
            {isAudioEnabled ? (
              <Mic className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            ) : (
              <MicOff className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            )}
          </button>
          
          <button
            onClick={handleEndCall}
            className="p-3 sm:p-4 bg-red-500 rounded-full hover:bg-red-600 transition-colors duration-200"
          >
            <PhoneOff className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </button>
          
          <button
            onClick={handleToggleVideo}
            className={`p-3 sm:p-4 rounded-full transition-all duration-200 ${
              isVideoEnabled 
                ? 'bg-white/20 hover:bg-white/30' 
                : 'bg-red-500 hover:bg-red-600'
            }`}
          >
            {isVideoEnabled ? (
              <Video className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            ) : (
              <VideoOff className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
